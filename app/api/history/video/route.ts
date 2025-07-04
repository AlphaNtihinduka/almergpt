import { createAdminClient } from "@/config/appwrite";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

export interface VideoGenerationHistory {
  $id: string;
  userId: string;
  prompt: string;
  fps: number;
  width: number;
  height: number;
  guidance_scale: number;
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
  metadata?: string;
  created_at: string;
  updated_at: string;
  model_version?: string;
  seed?: number;
  processing_time?: number;
  progress?: number;
}

export interface VideoHistoryResponse {
  success: boolean;
  data?: VideoGenerationHistory[];
  total?: number;
  error?: string;
  code?: string;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED"
        },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { databases } = await createAdminClient();

    // Get total count for pagination
    const totalResponse = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_VIDEO_GENERATIONS_COLLECTION_ID!,
      [
        Query.equal("userId", userId),
        Query.equal("status", "succeeded"),
      ]
    );

    // Get paginated results
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_VIDEO_GENERATIONS_COLLECTION_ID!,
      [
        Query.equal("userId", userId),
        Query.equal("status", "succeeded"),
        Query.orderDesc("created_at"),
        Query.limit(limit),
        Query.offset(offset)
      ]
    );

    const historyData: VideoHistoryResponse = {
      success: true,
      data: response.documents.map((doc) => ({
        $id: doc.$id,
        userId: doc.userId,
        prompt: doc.prompt,
        fps: doc.fps,
        width: doc.width,
        height: doc.height,
        guidance_scale: doc.guidance_scale,
        negative_prompt: doc.negative_prompt,
        duration: doc.duration,
        priority: doc.priority,
        num_inference_steps: doc.num_inference_steps,
        success: doc.success,
        video_url: doc.video_url,
        prediction_id: doc.prediction_id,
        status: doc.status,
        error: doc.error,
        queue_position: doc.queue_position,
        estimated_wait_time: doc.estimated_wait_time,
        cached: doc.cached,
        metadata: doc.metadata,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        model_version: doc.model_version,
        seed: doc.seed,
        processing_time: doc.processing_time,
        progress: doc.progress,
      })) as VideoGenerationHistory[],
      total: totalResponse.total
    };

    return NextResponse.json(historyData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error("Error in GET /api/history/video:", error);

    return NextResponse.json({
      success: false,
      error: "Internal Server Error",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}
