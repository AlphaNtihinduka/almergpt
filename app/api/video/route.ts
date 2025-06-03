/* eslint-disable @typescript-eslint/no-explicit-any */
import Replicate from "replicate";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Configuration
const USE_MOCK = process.env.NODE_ENV === "development" && process.env.USE_MOCK_VIDEO === "true";
const MAX_PROMPT_LENGTH = 500;
const GENERATION_TIMEOUT = 300000; // 5 minutes

// Input validation schema
interface VideoGenerationInput {
  prompt: string;
  fps?: number;
  width?: number;
  height?: number;
  guidance_scale?: number;
  negative_prompt?: string;
  duration?: number;
}

// Response interfaces
interface VideoGenerationResponse {
  success: boolean;
  video?: string;
  predictionId?: string;
  status?: string;
  error?: string;
  metadata?: {
    duration?: string;
    format?: string;
    resolution?: string;
    fps?: number;
  };
}

// Validate and sanitize input
function validateInput(body: any): { isValid: boolean; error?: string; data?: VideoGenerationInput } {
  if (!body || typeof body !== "object") {
    return { isValid: false, error: "Invalid request body" };
  }

  const { prompt, fps, width, height, guidance_scale, negative_prompt, duration } = body;

  // Validate prompt
  if (!prompt || typeof prompt !== "string") {
    return { isValid: false, error: "Prompt is required and must be a string" };
  }

  if (prompt.trim().length === 0) {
    return { isValid: false, error: "Prompt cannot be empty" };
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return { isValid: false, error: `Prompt must be less than ${MAX_PROMPT_LENGTH} characters` };
  }

  // Validate optional parameters
  const validatedData: VideoGenerationInput = {
    prompt: prompt.trim(),
    fps: fps && typeof fps === "number" && fps > 0 && fps <= 60 ? fps : 24,
    width: width && typeof width === "number" && width > 0 ? Math.min(width, 1920) : 1024,
    height: height && typeof height === "number" && height > 0 ? Math.min(height, 1080) : 576,
    guidance_scale: guidance_scale && typeof guidance_scale === "number" ? Math.max(1, Math.min(guidance_scale, 20)) : 17.5,
    negative_prompt: negative_prompt && typeof negative_prompt === "string" ? negative_prompt.trim() : "very blue, dust, noisy, washed out, ugly, distorted, broken",
    duration: duration && typeof duration === "number" && duration > 0 ? Math.min(duration, 10) : 3
  };

  return { isValid: true, data: validatedData };
}

// Mock response for development
function getMockResponse(): VideoGenerationResponse {
  return {
    success: true,
    video: "/braveboy.mp4",
    status: "succeeded",
    metadata: {
      duration: "3:45",
      format: "mp4",
      resolution: "1024x576",
      fps: 24
    }
  };
}

// Generate video using Replicate
async function generateVideo(input: VideoGenerationInput): Promise<VideoGenerationResponse> {
  try {
    console.log("Starting video generation with input:", { ...input, prompt: input.prompt.substring(0, 100) + "..." });

    const replicateInput = {
      fps: input.fps!,
      width: input.width!,
      height: input.height!,
      prompt: input.prompt,
      guidance_scale: input.guidance_scale!,
      negative_prompt: input.negative_prompt!,
      // Add more parameters as needed
      num_inference_steps: 50,
      seed: Math.floor(Math.random() * 1000000), // Random seed for variety
    };

    // Start the prediction
    const prediction = await replicate.predictions.create({
      version: "anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
      input: replicateInput,
    });

    console.log("Prediction started:", prediction.id);

    // Poll for completion with timeout
    const startTime = Date.now();
    let completedPrediction = prediction;

    while (completedPrediction.status !== "succeeded" && completedPrediction.status !== "failed") {
      if (Date.now() - startTime > GENERATION_TIMEOUT) {
        throw new Error("Video generation timeout");
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      completedPrediction = await replicate.predictions.get(prediction.id);
      console.log("Prediction status:", completedPrediction.status);
    }

    if (completedPrediction.status === "failed") {
      throw new Error(typeof completedPrediction.error === "string" ? completedPrediction.error : "Video generation failed");
    }

    const videoUrl = Array.isArray(completedPrediction.output) 
      ? completedPrediction.output[0] 
      : completedPrediction.output;

    if (!videoUrl) {
      throw new Error("No video URL in response");
    }

    return {
      success: true,
      video: videoUrl,
      predictionId: prediction.id,
      status: completedPrediction.status,
      metadata: {
        format: "mp4",
        resolution: `${input.width}x${input.height}`,
        fps: input.fps
      }
    };

  } catch (error) {
    console.error("Video generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      status: "failed"
    };
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check for required environment variables
    if (!USE_MOCK && !process.env.REPLICATE_API_TOKEN) {
      console.error("REPLICATE_API_TOKEN is not set");
      return NextResponse.json(
        { success: false, error: "Service configuration error" },
        { status: 500 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validation = validateInput(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const validatedInput = validation.data!;

    // Generate video
    const result = USE_MOCK 
      ? getMockResponse()
      : await generateVideo(validatedInput);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Log successful generation
    console.log("Video generated successfully:", {
      userId,
      videoUrl: result.video?.substring(0, 100) + "...",
      predictionId: result.predictionId
    });

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

// Optional: Add GET endpoint to check prediction status
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
      return NextResponse.json({
        success: true,
        status: "succeeded",
        video: "/braveboy.mp4"
      });
    }

    const prediction = await replicate.predictions.get(predictionId);
    
    return NextResponse.json({
      success: true,
      status: prediction.status,
      video: prediction.output,
      error: prediction.error
    });

  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check status" },
      { status: 500 }
    );
  }
}