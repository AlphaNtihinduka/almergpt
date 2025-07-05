/* eslint-disable @typescript-eslint/no-unused-vars */
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ID } from "node-appwrite";
import { createAdminClient } from "@/config/appwrite";
import { RequestTracker } from '@/config/Track/requestTrack';

// Import rate limiter with fallback
type RateLimitType = { limit: (u: string) => Promise<{ success: boolean; remaining: number; reset: number }> } | null;
let ratelimit: RateLimitType = null;
try {
  // Use dynamic import for ES module compatibility
  import("@/lib/ratelimit").then(mod => {
    ratelimit = mod.ratelimit as RateLimitType;
  }).catch(() => {
    console.warn("External rate limiter not available, using fallback");
  });
} catch (error) {
  console.warn("External rate limiter not available, using fallback");
}

// Simple in-memory rate limiter fallback
const memoryRateLimit = new Map<string, { count: number; resetTime: number }>();

const requestTracker = new RequestTracker();

const checkMemoryRateLimit = (u: string, limit: number = 50, windowMs: number = 3600000) => {
  const now = Date.now();
  const userLimit = memoryRateLimit.get(u);

  if (!userLimit || now > userLimit.resetTime) {
    memoryRateLimit.set(u, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (userLimit.count >= limit) {
    return { success: false, remaining: 0, reset: userLimit.resetTime };
  }

  userLimit.count++;
  return { success: true, remaining: limit - userLimit.count, reset: userLimit.resetTime };
};


// Helper function to save conversation to Appwrite
async function saveConversationToAppwrite(data: {
  userId: string;
  question: string;
  response: string;
  codeType: string;
}): Promise<string | null> {
  try {

    const documentData = {
      userId: data.userId,
      question: data.question.length > 4000 ? data.question.substring(0, 4000) + '...[truncated]' : data.question,
      response: data.response.length > 10000 ? data.response.substring(0, 10000) + '...[truncated]' : data.response,
      codeType: data.codeType
    };

    const { databases } = await createAdminClient();

    const document = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_COLLECTION_ID!,
      ID.unique(),
      documentData
    );

    console.log(`Conversation auto-saved: Document ID ${document.$id} for user ${data.userId}`);
    return document.$id;
  } catch (error) {
    console.warn('Failed to auto-save conversation:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// Input validation schema
const RequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().min(1).max(4000),
    })
  ).min(1).max(20),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().min(50).max(3000).optional().default(1500),
  codeType: z.enum([
    "general",
    "web-development",
    "backend",
    "mobile",
    "data-science",
    "machine-learning",
    "devops",
    "algorithms",
    "database"
  ]).optional().default("general"),
  saveConversation: z.boolean().optional().default(true), // Add option to disable saving
});

// Initialize OpenAI with connection pooling and timeout
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
  timeout: 45000, // 45 second timeout for code generation
  maxRetries: 2,
});

// Dynamic system message based on code type
const getSystemMessage = (codeType: string) => {
  const basePrompt = `You are an expert software developer and code generator. Generate high-quality, production-ready code solutions.

Core Rules:
- Provide complete, working code solutions
- Use best practices and modern conventions
- Include clear comments and documentation
- Handle edge cases and errors appropriately
- Use proper naming conventions
- Follow security best practices
- Optimize for readability and maintainability`;

  const specializations = {
    "web-development": `
Focus on: React, Next.js, TypeScript, HTML, CSS, JavaScript, Vue, Angular
- Use modern React patterns (functional components, hooks)
- Implement responsive design
- Follow accessibility guidelines
- Use TypeScript for type safety`,

    "backend": `
Focus on: Node.js, Python, Java, C#, Go, REST APIs, GraphQL, databases
- Implement proper error handling
- Use middleware for common concerns
- Follow RESTful conventions
- Implement proper authentication/authorization`,

    "mobile": `
Focus on: React Native, Flutter, Swift, Kotlin, cross-platform development
- Use platform-specific best practices
- Implement proper navigation
- Handle device-specific features
- Optimize for performance`,

    "data-science": `
Focus on: Python, R, Pandas, NumPy, Matplotlib, Jupyter, data analysis
- Use efficient data structures
- Implement proper data cleaning
- Create meaningful visualizations
- Handle missing data appropriately`,

    "machine-learning": `
Focus on: TensorFlow, PyTorch, Scikit-learn, ML pipelines, model deployment
- Implement proper train/validation/test splits
- Use appropriate evaluation metrics
- Handle overfitting prevention
- Consider model interpretability`,

    "devops": `
Focus on: Docker, Kubernetes, CI/CD, Infrastructure as Code, monitoring
- Use container best practices
- Implement proper logging
- Create reproducible environments
- Follow security hardening guidelines`,

    "algorithms": `
Focus on: Data structures, algorithms, complexity analysis, optimization
- Analyze time and space complexity
- Provide multiple solution approaches
- Explain algorithmic choices
- Include test cases`,

    "database": `
Focus on: SQL, NoSQL, database design, query optimization, migrations
- Use proper indexing strategies
- Implement data validation
- Follow normalization principles
- Consider performance implications`
  };

  return {
    role: "system" as const,
    content: `${basePrompt}\n\n${specializations[codeType as keyof typeof specializations] || ""}`,
  };
};

// Rate limiting configuration
const RATE_LIMITS = {
  free: { requests: 20, window: "1h" },
  premium: { requests: 200, window: "1h" },
};

// Code-related keywords for content filtering
const CODE_KEYWORDS = [
  // Programming languages
  'javascript', 'python', 'java', 'typescript', 'react', 'node', 'php', 'go', 'rust', 'swift', 'kotlin',
  // Development concepts
  'code', 'function', 'class', 'component', 'api', 'database', 'algorithm', 'data structure',
  // Technologies
  'html', 'css', 'sql', 'mongodb', 'express', 'django', 'flutter', 'angular', 'vue',
  // Development tasks
  'debug', 'implement', 'build', 'create', 'develop', 'program', 'script', 'application',
  // Technical terms
  'variable', 'array', 'object', 'method', 'property', 'loop', 'condition', 'syntax'
];

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;
  let conversationId: string | null = null;
  let requestTrackingResult: unknown = null;
  try {
    // 1. Authentication
    const authResult = await auth();
    userId = authResult?.userId || null;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    try {
      const canMakeRequest = await requestTracker.canMakeRequest(userId);
      if (!canMakeRequest) {
        const userStatus = await requestTracker.getUserRequestStatus(userId);
        return NextResponse.json(
          {
            error: "Request limit exceeded",
            code: "REQUEST_LIMIT_EXCEEDED",
            remainingRequests: userStatus.remainingRequests,
            status: userStatus.status
          },
          { status: 429 }
        );
      }
    } catch (error) {
      console.error("Error checking user request status:", error);
      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    // 2. Rate limiting with fallback
    let rateLimitResult = { success: true, remaining: 100, reset: Date.now() + 3600000 };

    try {
      // Only attempt rate limiting if Redis is properly configured
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN && ratelimit) {
        rateLimitResult = await ratelimit.limit(userId);
      } else {
        // Use in-memory rate limiter as fallback
        rateLimitResult = checkMemoryRateLimit(userId);
        if (!rateLimitResult.success) {
          console.log(`Rate limit exceeded for user ${userId} (in-memory)`);
        }
      }
    } catch (error) {
      console.warn("Redis rate limiting failed, using memory fallback:", error instanceof Error ? error.message : "Unknown error");
      // Fallback to memory-based rate limiting
      rateLimitResult = checkMemoryRateLimit(userId);
    }

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED",
          resetTime: rateLimitResult.reset
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }

    // 3. Input validation
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON payload", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const validationResult = RequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request format",
          code: "VALIDATION_ERROR",
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { messages, temperature, maxTokens, codeType, saveConversation } = validationResult.data;
    // 4. Content filtering for code-related queries
    const userMessage = messages[messages.length - 1]?.content?.toLowerCase();
    const isCodeRelated = CODE_KEYWORDS.some(keyword => userMessage?.includes(keyword));

    // Also check for common code patterns
    const hasCodePatterns = /(?:how to|create|build|implement|develop|write|generate|make).*(?:function|class|component|api|app|website|script|program|code)/i.test(userMessage || '');

    if (!isCodeRelated && !hasCodePatterns) {
      return NextResponse.json(
        {
          error: "This endpoint is for code generation and programming assistance only",
          code: "NON_CODE_REQUEST",
          suggestion: "Please ask programming-related questions or request code solutions"
        },
        { status: 400 }
      );
    }

    // 6. Track the request (NEW - Track after validation but before OpenAI call)
    try {
      requestTrackingResult = await requestTracker.trackRequest(userId);
      console.log(`Request tracked for user ${userId}:`, requestTrackingResult);
    } catch (error) {
      console.error('Error tracking request:', error);
      // If tracking fails, we should still return an error since the user might have exceeded limits
      return NextResponse.json(
        {
          error: "Request tracking failed",
          code: "TRACKING_ERROR",
          message: "Unable to process request. Please try again."
        },
        { status: 500 }
      );
    }


    // 5. Prepare messages with dynamic system prompt
    const systemMessage = getSystemMessage(codeType);
    const fullMessages = [systemMessage, ...messages];

    // 6. OpenAI API call
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: fullMessages,
      max_tokens: maxTokens,
      temperature,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
      user: userId,
    });

    const reply = completion.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error("No response generated from OpenAI");
    }

    // 7. Response validation
    if (reply.length < 20) {
      throw new Error("Response too short, likely an error occurred");
    }

    // 8. Save conversation to Appwrite (if enabled)
    if (saveConversation) {
      conversationId = await saveConversationToAppwrite({
        userId,
        question: messages[messages.length - 1].content,
        response: reply,
        codeType
      });
    }

    // 8. Usage tracking
    const responseTime = Date.now() - startTime;

    console.log(`Code Generation API Success: User ${userId}, Type: ${codeType}, Response time: ${responseTime}ms, Tokens: ${completion.usage?.total_tokens || 0}`);

    // 9. Enhanced response with metadata
    return NextResponse.json(
      {
        role: "assistant",
        content: reply,
        metadata: {
          model: completion.model,
          codeType,
          tokensUsed: completion.usage?.total_tokens || 0,
          responseTime,
          timestamp: new Date().toISOString(),
          rateLimitRemaining: rateLimitResult.remaining,
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache',
          'X-Response-Time': responseTime.toString(),
          'X-Code-Type': codeType,
        }
      }
    );

  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Enhanced error logging
    console.error("Code Generation API Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      responseTime,
      timestamp: new Date().toISOString(),
    });

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      const errorMessages = {
        429: "OpenAI rate limit exceeded",
        400: "Invalid request to OpenAI",
        401: "OpenAI authentication failed",
        403: "OpenAI request forbidden",
        500: "OpenAI service error",
      };

      return NextResponse.json(
        {
          error: errorMessages[error.status as keyof typeof errorMessages] || "OpenAI error",
          code: `OPENAI_ERROR_${error.status}`
        },
        { status: error.status === 429 ? 429 : 500 }
      );
    }

    // Handle timeout errors
    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json(
        { error: "Request timeout - code generation took too long", code: "TIMEOUT" },
        { status: 504 }
      );
    }

    // Handle network errors
    if (error instanceof Error && (error.message.includes('ECONNRESET') || error.message.includes('network'))) {
      return NextResponse.json(
        { error: "Network error occurred", code: "NETWORK_ERROR" },
        { status: 503 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // Health check
    if (action === 'health') {
      const testCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5,
      });

      const redisStatus = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
        ? "configured"
        : "using_memory_fallback";

      return NextResponse.json(
        {
          status: "healthy",
          service: "code-generation-api",
          openai: "connected",
          rateLimit: redisStatus,
          timestamp: new Date().toISOString(),
          version: "2.0.0"
        },
        { status: 200 }
      );
    }

    // Check request status
    if (action === 'status') {
      const authResult = await auth();
      const userId = authResult?.userId;

      if (!userId) {
        return NextResponse.json(
          { error: "Authentication required", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }

      const status = await requestTracker.getUserRequestStatus(userId);
      return NextResponse.json(
        {
          success: true,
          requestInfo: status,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    }

    // Reset requests (for subscription activation)
    if (action === 'reset') {
      const authResult = await auth();
      const userId = authResult?.userId;

      if (!userId) {
        return NextResponse.json(
          { error: "Authentication required", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }

      // You might want to add additional authorization here
      // to ensure only subscribed users can reset their requests

      const result = await requestTracker.resetUserRequests(userId);
      return NextResponse.json(
        {
          success: true,
          message: "Request limit reset successfully",
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Invalid action", code: "INVALID_ACTION" },
      { status: 400 }
    );

  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        service: "code-generation-api",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}