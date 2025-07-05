import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/config/appwrite";
import { ID } from "node-appwrite";
import { RequestTracker } from "@/config/Track/requestTrack";

const requestTracker = new RequestTracker();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

// Valid resolution options for OpenAI DALL-E
const VALID_RESOLUTIONS = ["1024x1792", "1792x1024", "1024x1024"] as const;
type ValidResolution = typeof VALID_RESOLUTIONS[number];

// Validation functions
const isValidResolution = (resolution: string): resolution is ValidResolution => {
  return VALID_RESOLUTIONS.includes(resolution as ValidResolution);
};

const isValidAmount = (amount: number): boolean => {
  return Number.isInteger(amount) && amount >= 1 && amount <= 5;
};

// Interface for the data to be saved in Appwrite
interface ImageGenerationRecord {
  userId: string;
  prompt: string;
  originalPrompt: string;
  revisedPrompt?: string;
  resolution: string;
  amount: number;
  imageUrls: string[];
  status: 'success' | 'failed';
  errorMessage?: string;
  createdAt: string;
  generationTime?: string;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let requestTrackingResult;

  try {
    // Authenticate the user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
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

    // Parse the request body
    const body = await req.json();
    const { prompt, amount = "1", resolution = "1024x1024" } = body;

    // Validate prompt
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt must be a non-empty string" },
        { status: 400 }
      );
    }

    // Validate and parse amount
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || !isValidAmount(numAmount)) {
      return NextResponse.json(
        { error: "Amount must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate resolution
    if (!isValidResolution(resolution)) {
      return NextResponse.json(
        {
          error: "Invalid resolution. Must be one of: " + VALID_RESOLUTIONS.join(", ")
        },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_KEY) {
      console.error("OpenAI API key not configured");
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 }
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


    console.log(`Generating ${numAmount} image(s) with resolution ${resolution} for prompt: "${prompt.substring(0, 50)}..."`);

    try {
      // Call OpenAI API
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt.trim(),
        n: 1,
        size: resolution,
        response_format: "url",
      });

      // Validate response
      if (!response.data || response.data.length === 0) {
        // Save failed generation to Appwrite
        await saveToAppwrite({
          userId,
          prompt: prompt.trim(),
          originalPrompt: prompt.trim(),
          resolution,
          amount: numAmount,
          imageUrls: [],
          status: 'failed',
          errorMessage: 'No images were generated',
          createdAt: new Date().toISOString(),
          generationTime: String(Date.now() - startTime)
        });

        return NextResponse.json(
          { error: "No images were generated" },
          { status: 500 }
        );
      }

      // Extract the generated image URLs and ensure they exist
      const images = response.data
        .filter(image => image.url)
        .map(image => ({
          url: image.url!,
          revised_prompt: image.revised_prompt || prompt
        }));

      if (images.length === 0) {
        // Save failed generation to Appwrite
        await saveToAppwrite({
          userId,
          prompt: prompt.trim(),
          originalPrompt: prompt.trim(),
          resolution,
          amount: numAmount,
          imageUrls: [],
          status: 'failed',
          errorMessage: 'Generated images had no valid URLs',
          createdAt: new Date().toISOString(),
          generationTime: String(Date.now() - startTime)
        });

        return NextResponse.json(
          { error: "Generated images had no valid URLs" },
          { status: 500 }
        );
      }

      console.log(`Successfully generated ${images.length} image(s)`);

      // Save successful generation to Appwrite
      const generationRecord = await saveToAppwrite({
        userId,
        prompt: prompt.trim(),
        originalPrompt: prompt.trim(),
        revisedPrompt: images[0]?.revised_prompt,
        resolution,
        amount: numAmount,
        imageUrls: images.map(img => img.url),
        status: 'success',
        createdAt: new Date().toISOString(),
        generationTime: (Date.now() - startTime).toString()
      });

      // Return the response with the database record ID
      return NextResponse.json({
        images,
        count: images.length,
        prompt_used: prompt,
        resolution_used: resolution,
        record_id: generationRecord ? generationRecord.$id : null,
        generation_time: Date.now() - startTime
      });

    } catch (openaiError: unknown) {
      console.error("OpenAI API Error:", openaiError);

      // Extract error message for database
      let errorMessage = "Unknown OpenAI error";
      let statusCode = 500;

      if (
        typeof openaiError === "object" &&
        openaiError !== null &&
        "error" in openaiError &&
        typeof (openaiError as { error: unknown }).error === "object" &&
        (openaiError as { error: unknown }).error !== null &&
        "code" in (openaiError as { error: { code?: unknown } }).error
      ) {
        const errObj = openaiError as { error: { code: string; message?: string } };
        errorMessage = errObj.error.message || `OpenAI error: ${errObj.error.code}`;

        if (errObj.error.code === "invalid_request_error") {
          statusCode = 400;
        } else if (errObj.error.code === "rate_limit_exceeded" || errObj.error.code === "insufficient_quota") {
          statusCode = 429;
        }
      }

      // Save failed generation to Appwrite
      await saveToAppwrite({
        userId,
        prompt: prompt.trim(),
        originalPrompt: prompt.trim(),
        resolution,
        amount: numAmount,
        imageUrls: [],
        status: 'failed',
        errorMessage,
        createdAt: new Date().toISOString(),
        generationTime: String(Date.now() - startTime)
      });

      // Handle specific OpenAI errors
      if (
        typeof openaiError === "object" &&
        openaiError !== null &&
        "error" in openaiError &&
        typeof (openaiError as { error: unknown }).error === "object" &&
        (openaiError as { error: unknown }).error !== null &&
        "code" in (openaiError as { error: { code?: unknown } }).error
      ) {
        const errObj = openaiError as { error: { code: string; message?: string } };

        if (errObj.error.code === "invalid_request_error") {
          return NextResponse.json(
            { error: "Invalid request to OpenAI: " + (errObj.error.message ?? "") },
            { status: 400 }
          );
        }

        if (errObj.error.code === "rate_limit_exceeded") {
          return NextResponse.json(
            { error: "Rate limit exceeded. Please try again later." },
            { status: 429 }
          );
        }

        if (errObj.error.code === "insufficient_quota") {
          return NextResponse.json(
            { error: "OpenAI quota exceeded. Please check your billing." },
            { status: 429 }
          );
        }
      }

      // Generic error handling
      return NextResponse.json(
        { error: "Failed to generate images. Please try again." },
        { status: statusCode }
      );
    }

  } catch (error: unknown) {
    console.error("Route Error:", error);

    // Try to save the error to Appwrite if we have userId
    try {
      const { userId } = await auth();
      if (userId) {
        await saveToAppwrite({
          userId,
          prompt: "",
          originalPrompt: "",
          resolution: "1024x1024",
          amount: 1,
          imageUrls: [],
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          createdAt: new Date().toISOString(),
          generationTime: String(Date.now() - startTime)
        });
      }
    } catch (saveError) {
      console.error("Failed to save error to Appwrite:", saveError);
    }

    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}

// Helper function to save data to Appwrite
async function saveToAppwrite(data: ImageGenerationRecord) {
  try {
    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    const collectionId = process.env.APPWRITE_IMAGE_GENERATIONS_COLLECTION_ID!;

    const { databases } = await createAdminClient();

    const document = await databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      data
    );

    console.log("Successfully saved to Appwrite:", document.$id);
    return document;
  } catch (error) {
    console.error("Failed to save to Appwrite:", error);
    // Don't throw here to avoid breaking the main flow
    // You might want to implement a retry mechanism or queue system
    return null;
  }
}
