/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Replicate from "replicate";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";
import { createAdminClient } from "@/config/appwrite";
import { ID, Query } from "node-appwrite";

// Initialize clients
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Redis for caching and queue management
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Configuration
const USE_MOCK = process.env.NODE_ENV === "development" && process.env.USE_MOCK_VIDEO === "true";
const MAX_PROMPT_LENGTH = 500;
const CACHE_TTL = 3600; // 1 hour cache
const MAX_CONCURRENT_GENERATIONS = 10;
const QUEUE_KEY = "video_generation_queue";
const ACTIVE_JOBS_KEY = "active_video_jobs";

// Faster model versions (using more recent/optimized models)
const VIDEO_MODELS = {
  fast: "bytedance/seedance-1-lite", // SVD - faster
  quality: "minimax/video-01", // Original
  ultra_fast: "kwaivgi/kling-v2.1-master" // AnimateDiff - very fast
};

// Input validation with optimized defaults
interface VideoGenerationInput {
  prompt: string;
  fps?: number;
  width?: number;
  height?: number;
  guidance_scale?: number;
  negative_prompt?: string;
  duration?: number;
  priority?: 'fast' | 'quality' | 'ultra_fast';
  num_inference_steps?: number;
}

interface VideoGenerationResponse {
  success: boolean;
  video?: string;
  predictionId?: string;
  status?: string;
  error?: string;
  queuePosition?: number;
  estimatedWaitTime?: number;
  cached?: boolean;
  metadata?: {
    duration?: string;
    format?: string;
    resolution?: string;
    fps?: number;
  };
}

// Appwrite document structure
interface VideoGenerationDocument {
  userId: string;
  prompt: string;
  fps: number;
  width: number;
  height: number;
  guidance_scale: string;
  negative_prompt: string;
  duration: number;
  priority: string;
  num_inference_steps: number;
  success: boolean;
  video_url?: string;
  prediction_id?: string;
  status: string;
  error?: string;
  queue_position?: number;
  estimated_wait_time?: number;
  cached: boolean;
  metadata?: string; // JSON string
  created_at: string;
  updated_at: string;
  model_version?: string;
  seed?: number;
  processing_time?: number;
  progress?: number;
}

// Save to Appwrite
async function saveToAppwrite(
  userId: string,
  input: VideoGenerationInput,
  response: VideoGenerationResponse,
  additionalData?: {
    modelVersion?: string;
    seed?: number;
    processingTime?: number;
    progress?: number;
  }
): Promise<string | null> {
  try {
    const document: Partial<VideoGenerationDocument> = {
      userId,
      prompt: input.prompt,
      fps: input.fps || 15,
      width: input.width || 512,
      height: input.height || 512,
      guidance_scale: String(input.guidance_scale || 7.5),
      negative_prompt: input.negative_prompt || "blurry, low quality",
      duration: input.duration || 2,
      priority: input.priority || "ultra_fast",
      num_inference_steps: input.num_inference_steps || 20,
      success: response.success,
      video_url: response.video,
      prediction_id: response.predictionId,
      status: response.status || "unknown",
      error: response.error,
      queue_position: response.queuePosition,
      estimated_wait_time: response.estimatedWaitTime,
      cached: response.cached || false,
      metadata: response.metadata ? JSON.stringify(response.metadata) : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      model_version: additionalData?.modelVersion,
      seed: additionalData?.seed,
      processing_time: additionalData?.processingTime,
      progress: additionalData?.progress
    };

    const { databases } = await createAdminClient();

    const result = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_VIDEO_GENERATIONS_COLLECTION_ID!,
      ID.unique(),
      document
    );

    console.log("Successfully saved to Appwrite:", result.$id);
    return JSON.stringify({
      id: result.$id,
      userId: result.userId,
      prompt: result.prompt,
      videoUrl: result.video_url,
      status: result.status,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      metadata: result.metadata ? JSON.parse(result.metadata) : undefined
    });
  } catch (error) {
    console.error("Failed to save to Appwrite:", error);
    return null;
  }
}

async function updateAppwriteDocument(documentId: string, response: Partial<VideoGenerationDocument>): Promise<void> {
  try {
    const { databases } = await createAdminClient();

    const updateData: Partial<VideoGenerationDocument> = {
      updated_at: new Date().toISOString(),
      ...response,
      metadata: response.metadata && typeof response.metadata !== "string" ? JSON.stringify(response.metadata) : response.metadata
    };

    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_VIDEO_GENERATIONS_COLLECTION_ID!,
      documentId,
      updateData
    );

    console.log("Successfully updated Appwrite document:", documentId);
  } catch (error) {
    console.error("Failed to update Appwrite document:", error);
  }
}

// Get document from Appwrite by prediction ID
async function getAppwriteDocumentByPredictionId(predictionId: string): Promise<any> {
  try {

    const { databases } = await createAdminClient();

    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_VIDEO_GENERATIONS_COLLECTION_ID!,
      [
        // Add query filter for prediction_id
        Query.equal('prediction_id', predictionId)
      ]
    );

    // Filter manually since we might not have the Query import
    const document = response.documents.find(doc => doc.prediction_id === predictionId);
    return document || null;
  } catch (error) {
    console.error("Failed to get document from Appwrite:", error);
    return null;
  }
}

// Generate cache key for similar prompts
function generateCacheKey(input: VideoGenerationInput): string {
  const key = `video:${input.prompt}:${input.width}x${input.height}:${input.fps}:${input.duration}:${input.priority}`;
  return Buffer.from(key).toString('base64').slice(0, 50);
}

// Check cache first
async function checkCache(cacheKey: string): Promise<string | null> {
  try {
    return await redis.get(cacheKey);
  } catch (error) {
    console.warn("Cache check failed:", error);
    return null;
  }
}

// Store in cache
async function storeInCache(cacheKey: string, videoUrl: string): Promise<void> {
  try {
    await redis.setex(cacheKey, CACHE_TTL, videoUrl);
  } catch (error) {
    console.warn("Cache store failed:", error);
  }
}

// Queue management
async function getQueuePosition(userId: string): Promise<number> {
  try {
    const position = await redis.lpos(QUEUE_KEY, userId);
    return position !== null ? position : -1;
  } catch {
    return -1;
  }
}

async function addToQueue(userId: string, input: VideoGenerationInput): Promise<number> {
  try {
    await redis.lpush(QUEUE_KEY, JSON.stringify({ userId, input, timestamp: Date.now() }));
    return await redis.llen(QUEUE_KEY);
  } catch {
    return 0;
  }
}

async function getActiveJobsCount(): Promise<number> {
  try {
    return await redis.scard(ACTIVE_JOBS_KEY);
  } catch {
    return 0;
  }
}

// Validate and optimize input
function validateInput(body: any): { isValid: boolean; error?: string; data?: VideoGenerationInput } {
  if (!body || typeof body !== "object") {
    return { isValid: false, error: "Invalid request body" };
  }

  const { prompt, fps, width, height, guidance_scale, negative_prompt, duration, priority, num_inference_steps } = body;

  if (!prompt || typeof prompt !== "string") {
    return { isValid: false, error: "Prompt is required and must be a string" };
  }

  if (prompt.trim().length === 0) {
    return { isValid: false, error: "Prompt cannot be empty" };
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return { isValid: false, error: `Prompt must be less than ${MAX_PROMPT_LENGTH} characters` };
  }

  // Optimized defaults for speed
  const validatedData: VideoGenerationInput = {
    prompt: prompt.trim(),
    fps: fps && typeof fps === "number" && fps > 0 && fps <= 30 ? fps : 15, // Lower default FPS for speed
    width: width && typeof width === "number" && width > 0 ? Math.min(width, 1024) : 512, // Smaller default resolution
    height: height && typeof height === "number" && height > 0 ? Math.min(height, 1024) : 512,
    guidance_scale: guidance_scale && typeof guidance_scale === "number" ? Math.max(1, Math.min(guidance_scale, 15)) : 7.5, // Lower for speed
    negative_prompt: negative_prompt && typeof negative_prompt === "string" ? negative_prompt.trim() : "blurry, low quality",
    duration: duration && typeof duration === "number" && duration > 0 ? Math.min(duration, 5) : 2, // Shorter default duration
    priority: priority && ['fast', 'quality', 'ultra_fast'].includes(priority) ? priority : 'ultra_fast',
    num_inference_steps: num_inference_steps && typeof num_inference_steps === "number" ? Math.min(num_inference_steps, 50) : 20 // Fewer steps for speed
  };

  return { isValid: true, data: validatedData };
}

// Mock response
function getMockResponse(): VideoGenerationResponse {
  return {
    success: true,
    video: "/braveboy.mp4",
    status: "succeeded",
    cached: false,
    metadata: {
      duration: "2s",
      format: "mp4",
      resolution: "512x512",
      fps: 15
    }
  };
}

// Optimized video generation with queue processing
async function generateVideo(input: VideoGenerationInput, userId: string): Promise<VideoGenerationResponse> {
  const jobId = `${userId}_${Date.now()}`;
  const startTime = Date.now();

  try {
    // Add to active jobs
    await redis.sadd(ACTIVE_JOBS_KEY, jobId);

    console.log("Starting optimized video generation:", {
      jobId,
      prompt: input.prompt.substring(0, 50) + "...",
      priority: input.priority
    });

    // Choose model based on priority
    const modelVersion = VIDEO_MODELS[input.priority!];
    const seed = Math.floor(Math.random() * 100000); // Random seed for variability

    const replicateInput = {
      fps: input.fps!,
      width: input.width!,
      height: input.height!,
      prompt: input.prompt,
      guidance_scale: input.guidance_scale!,
      negative_prompt: input.negative_prompt!,
      num_inference_steps: input.num_inference_steps!,
      seed: Math.floor(Math.random() * 100000),
      // Optimization parameters
      scheduler: "DPMSolverMultistep", // Faster scheduler
      enable_memory_efficient_attention: true,
    };

    // Start async prediction (non-blocking)
    const prediction = await replicate.predictions.create({
      version: modelVersion,
      input: replicateInput,
    });

    console.log("Prediction created:", prediction);

    console.log("Prediction started:", prediction.id);

    const processingTime = Date.now() - startTime;

    // Return response data
    const response: VideoGenerationResponse = {
      success: true,
      predictionId: prediction.id,
      status: "processing",
      estimatedWaitTime: getEstimatedWaitTime(input.priority!),
      metadata: {
        format: "mp4",
        resolution: `${input.width}x${input.height}`,
        fps: input.fps
      }
    };

    // Save to Appwrite with additional data
    await saveToAppwrite(userId, input, response, {
      modelVersion,
      seed,
      processingTime
    });

    return response;

  } catch (error) {
    console.error("Video generation error:", error);

    const errorResponse: VideoGenerationResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      status: "failed"
    };

    // Save error to Appwrite
    await saveToAppwrite(userId, input, errorResponse);

    return errorResponse;
  } finally {
    // Remove from active jobs
    await redis.srem(ACTIVE_JOBS_KEY, jobId);
  }
}

// Get estimated wait time based on priority and queue
function getEstimatedWaitTime(priority: string): number {
  const baseTimes = {
    ultra_fast: 15, // 15 seconds
    fast: 30,       // 30 seconds  
    quality: 60     // 1 minute
  };
  return baseTimes[priority as keyof typeof baseTimes] || 30;
}

// Main POST handler - now async and non-blocking
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Environment check
    if (!USE_MOCK && !process.env.REPLICATE_API_TOKEN) {
      console.error("REPLICATE_API_TOKEN is not set");
      return NextResponse.json(
        { success: false, error: "Service configuration error" },
        { status: 500 }
      );
    }

    // Parse request
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate input
    const validation = validateInput(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const validatedInput = validation.data!;

    // Check cache first
    const cacheKey = generateCacheKey(validatedInput);
    const cachedVideo = await checkCache(cacheKey);

    if (cachedVideo) {
      console.log("Cache hit for user:", userId);
      const cachedResponse: VideoGenerationResponse = {
        success: true,
        video: cachedVideo,
        status: "succeeded",
        cached: true,
        metadata: {
          format: "mp4",
          resolution: `${validatedInput.width}x${validatedInput.height}`,
          fps: validatedInput.fps
        }
      };
      // Save cached result to Appwrite
      await saveToAppwrite(userId, validatedInput, cachedResponse);

      return NextResponse.json(cachedResponse);
    }

    // Check if we're at capacity
    const activeJobs = await getActiveJobsCount();
    if (activeJobs >= MAX_CONCURRENT_GENERATIONS) {
      const queuePosition = await addToQueue(userId, validatedInput);
      const queuedResponse = {
        success: true,
        status: "queued",
        queuePosition,
        estimatedWaitTime: queuePosition * 10,
        message: "Request queued due to high demand"
      };

      // Save queued status to Appwrite
      await saveToAppwrite(userId, validatedInput, queuedResponse);

      return NextResponse.json(queuedResponse);
    }

    // Generate video (async)
    const result = USE_MOCK
      ? getMockResponse()
      : await generateVideo(validatedInput, userId);

    // Save mock result to Appwrite if using mock
    if (USE_MOCK) {
      await saveToAppwrite(userId, validatedInput, result);
    }

    // For successful generations, we return the prediction ID for polling
    if (result.success && result.predictionId) {
      console.log("Video generation initiated:", {
        userId,
        predictionId: result.predictionId
      });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
}

// Enhanced GET endpoint for real-time status checking
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const predictionId = searchParams.get("predictionId");

    if (!predictionId) {
      return NextResponse.json(
        { success: false, error: "Prediction ID is required" },
        { status: 400 }
      );
    }

    if (USE_MOCK) {
      const mockResponse = {
        success: true,
        status: "succeeded",
        video: "/braveboy.mp4"
      };

      // Update Appwrite document if it exists
      const existingDoc = await getAppwriteDocumentByPredictionId(predictionId);
      if (existingDoc) {
        await updateAppwriteDocument(existingDoc.$id, {
          status: "succeeded",
          video_url: "/braveboy.mp4",
          success: true
        });
      }

      return NextResponse.json(mockResponse);
    }

    // Get prediction status
    const prediction = await replicate.predictions.get(predictionId);

    let videoUrl = null;
    if (prediction.status === "succeeded") {
      videoUrl = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output;

      // Cache successful result
      if (videoUrl) {
        const prompt = searchParams.get("prompt");
        if (prompt) {
          const cacheKey = generateCacheKey({
            prompt,
            width: parseInt(searchParams.get("width") || "512"),
            height: parseInt(searchParams.get("height") || "512"),
            fps: parseInt(searchParams.get("fps") || "15"),
            duration: parseInt(searchParams.get("duration") || "2"),
            priority: searchParams.get("priority") as any || "ultra_fast"
          });
          await storeInCache(cacheKey, videoUrl);
        }
      }
    }

    const response: VideoGenerationResponse = {
      success: true,
      status: prediction.status,
      video: videoUrl,
      error: prediction.error ? String(prediction.error) : undefined
    };

    // Add progress information if available
    let progress = undefined;
    if (prediction.status === "processing" && prediction.logs) {
      const logs = Array.isArray(prediction.logs) ? prediction.logs.join("\n") : prediction.logs;
      if (logs.includes("%")) {
        const progressMatch = logs.match(/(\d+)%/);
        if (progressMatch) {
          progress = parseInt(progressMatch[1]);
          (response as any).progress = progress;
        }
      }
    }

    // Update Appwrite document with latest status
    const existingDoc = await getAppwriteDocumentByPredictionId(predictionId);
    if (existingDoc) {
      const updateData: Partial<VideoGenerationDocument> = {
        status: prediction.status,
        success: prediction.status === "succeeded",
        video_url: videoUrl || undefined,
        error: prediction.error ? String(prediction.error) : undefined,
        progress
      };

      await updateAppwriteDocument(existingDoc.$id, updateData);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check status" },
      { status: 500 }
    );
  }
}