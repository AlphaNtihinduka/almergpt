import Replicate from "replicate";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { z } from "zod";

// Environment validation
const envSchema = z.object({
  REPLICATE_API_TOKEN: z.string().min(1, "REPLICATE_API_TOKEN is required"),
  NODE_ENV: z.string().optional(),
});

const env = envSchema.parse(process.env);

// Request validation schema
const requestSchema = z.object({
  prompt: z.string()
    .min(1, "Prompt is required")
    .max(500, "Prompt must be less than 500 characters")
    .trim(),
});

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per user

// Replicate client with connection pooling
const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

// Content filter for inappropriate prompts
const BLOCKED_KEYWORDS = [
  'explicit', 'nsfw', 'sexual', 'violence', 'hate', 'illegal'
  // Add more as needed
];

function isContentAppropriate(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  return !BLOCKED_KEYWORDS.some(keyword => lowerPrompt.includes(keyword));
}

// Rate limiting check
function checkRateLimit(userId: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: userLimit.resetTime };
  }
  
  userLimit.count++;
  return { allowed: true };
}

// Optimized stream to base64 conversion with memory management
async function streamToBase64(stream: ReadableStream): Promise<string> {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB limit
  let totalSize = 0;
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      totalSize += value.length;
      if (totalSize > MAX_SIZE) {
        throw new Error("Audio file too large");
      }
      
      chunks.push(value);
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return Buffer.from(combined).toString("base64");
  } finally {
    reader.releaseLock();
  }
}

// Error response helper
function createErrorResponse(message: string, status: number, code?: string) {
  return new Response(
    JSON.stringify({ 
      error: message, 
      code,
      timestamp: new Date().toISOString() 
    }),
    { 
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
      }
    }
  );
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;

  try {
    // Authentication
    const authResult = await auth();
    userId = authResult.userId;
    
    if (!userId) {
      return createErrorResponse("Authentication required", 401, "UNAUTHORIZED");
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      const resetTime = rateLimitResult.resetTime!;
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded", 
          resetTime: new Date(resetTime).toISOString(),
          code: "RATE_LIMIT_EXCEEDED"
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Reset': resetTime.toString(),
            'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    // Request validation with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Request timeout")), 30000)
    );
    
    const body = await Promise.race([
      req.json(),
      timeoutPromise
    ]) as unknown;

    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse(
        `Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    const { prompt } = validationResult.data;

    // Content filtering
    if (!isContentAppropriate(prompt)) {
      return createErrorResponse(
        "Content violates our terms of service",
        400,
        "INAPPROPRIATE_CONTENT"
      );
    }

    console.log(`[${userId}] Music generation started: "${prompt.substring(0, 50)}..."`);

    // Replicate API call with timeout and retry logic
    const REPLICATE_TIMEOUT = 120000; // 2 minutes
    type ReplicateResponse = { audio?: ReadableStream | string };

    let response: ReplicateResponse | undefined;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        const replicatePromise = replicate.run(
          "riffusion/riffusion:8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05",
          { input: { prompt_a: prompt } }
        );

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Replicate timeout")), REPLICATE_TIMEOUT)
        );

        response = await Promise.race([replicatePromise, timeoutPromise]) as ReplicateResponse;
        break; // Success, exit retry loop
      } catch (error: unknown) {
        retryCount++;
        const errorMessage =
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error);
        console.error(`[${userId}] Replicate attempt ${retryCount} failed:`, errorMessage);
        
        if (retryCount > maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    if (!response || !response.audio) {
      throw new Error("Invalid response from music generation service");
    }

    let audioData: string;

    // Handle different response types
    if (response.audio instanceof ReadableStream) {
      console.log(`[${userId}] Converting stream to base64...`);
      const base64Audio = await streamToBase64(response.audio);
      audioData = `data:audio/mp3;base64,${base64Audio}`;
    } else if (typeof response.audio === "string") {
      // Validate URL format
      try {
        new URL(response.audio);
        audioData = response.audio;
      } catch {
        throw new Error("Invalid audio URL received");
      }
    } else {
      throw new Error("Unexpected audio format received");
    }

    const processingTime = Date.now() - startTime;
    console.log(`[${userId}] Music generation completed in ${processingTime}ms`);

    return new Response(
      JSON.stringify({ 
        audio: audioData,
        metadata: {
          prompt: prompt.substring(0, 100), // Truncated for logs
          processingTime,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Processing-Time': processingTime.toString(),
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        }
      }
    );

  } catch (error: unknown) {
    const processingTime = Date.now() - startTime;
    
    // Structured error logging
    const errMsg = typeof error === "object" && error !== null && "message" in error
      ? (error as { message: string }).message
      : String(error);
    const errStack = typeof error === "object" && error !== null && "stack" in error
      ? (error as { stack?: string }).stack
      : undefined;

    console.error(`[${userId || 'unknown'}] Music API Error:`, {
      message: errMsg,
      stack: errStack,
      processingTime,
      timestamp: new Date().toISOString(),
    });

    // Handle specific error types
    if (typeof errMsg === "string" && errMsg.includes("timeout")) {
      return createErrorResponse(
        "Request timed out. Please try again.",
        408,
        "TIMEOUT"
      );
    }
    
    if (typeof errMsg === "string" && errMsg.includes("Rate limit")) {
      return createErrorResponse(
        "Service temporarily unavailable due to high demand",
        503,
        "SERVICE_UNAVAILABLE"
      );
    }

    if (typeof errMsg === "string" && errMsg.includes("too large")) {
      return createErrorResponse(
        "Generated audio file is too large",
        413,
        "FILE_TOO_LARGE"
      );
    }

    // Generic server error (don't expose internal details)
    return createErrorResponse(
      "An unexpected error occurred. Please try again later.",
      500,
      "INTERNAL_ERROR"
    );
  }
} 