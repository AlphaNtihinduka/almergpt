// lib/queue-processor.ts
import Replicate from "replicate";
import Redis from "ioredis";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const MAX_CONCURRENT_GENERATIONS = 10;
const QUEUE_KEY = "video_generation_queue";
const ACTIVE_JOBS_KEY = "active_video_jobs";

const VIDEO_MODELS = {
  fast: "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb1a4c8e654c630349bd722be2fdf1c1c72f93c2f6",
  quality: "anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
  ultra_fast: "lucataco/animate-diff:beecf59c4aee8d81bf04f0381033dfa10dc16e845b83c17a80c47521fb20f8b8"
};

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

async function getActiveJobsCount(): Promise<number> {
  try {
    return await redis.scard(ACTIVE_JOBS_KEY);
  } catch {
    return 0;
  }
}

interface GenerateVideoResult {
  success: boolean;
  predictionId?: string;
  status: "processing" | "failed";
  error?: string;
}

async function generateVideo(input: VideoGenerationInput, userId: string): Promise<GenerateVideoResult> {
  const jobId = `${userId}_${Date.now()}`;

  try {
    await redis.sadd(ACTIVE_JOBS_KEY, jobId);

    console.log("Starting optimized video generation:", {
      jobId,
      prompt: input.prompt.substring(0, 50) + "...",
      priority: input.priority
    });

    const modelVersion = VIDEO_MODELS[input.priority!];

    const replicateInput = {
      fps: input.fps!,
      width: input.width!,
      height: input.height!,
      prompt: input.prompt,
      guidance_scale: input.guidance_scale!,
      negative_prompt: input.negative_prompt!,
      num_inference_steps: input.num_inference_steps!,
      seed: Math.floor(Math.random() * 100000),
      scheduler: "DPMSolverMultistep",
      enable_memory_efficient_attention: true,
    };

    const prediction = await replicate.predictions.create({
      version: modelVersion,
      input: replicateInput,
    });

    console.log("Prediction started:", prediction.id);

    return {
      success: true,
      predictionId: prediction.id,
      status: "processing",
    };

  } catch (error) {
    console.error("Video generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      status: "failed"
    };
  } finally {
    await redis.srem(ACTIVE_JOBS_KEY, jobId);
  }
}

// Background queue processor
export async function processQueue() {
  try {
    const activeJobs = await getActiveJobsCount();
    if (activeJobs >= MAX_CONCURRENT_GENERATIONS) {
      return;
    }

    const queueItem = await redis.rpop(QUEUE_KEY);
    if (!queueItem) {
      return;
    }

    const { userId, input } = JSON.parse(queueItem);
    console.log("Processing queued job for user:", userId);

    // Process the queued job
    await generateVideo(input, userId);
  } catch (error) {
    console.error("Queue processing error:", error);
  }
}