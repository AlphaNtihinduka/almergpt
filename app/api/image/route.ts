import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

console.log("OPENAI_API_KEY:", process.env.OPENAI_KEY);
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

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
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

    console.log(`Generating ${numAmount} image(s) with resolution ${resolution} for prompt: "${prompt.substring(0, 50)}..."`);

    // Call OpenAI API
    const response = await openai.images.generate({
      model: "dall-e-3", // Explicitly specify the model
      prompt: prompt.trim(),
      n: 1,
      size: resolution,
      response_format: "url",
    });

    // Validate response
    if (!response.data || response.data.length === 0) {
      return NextResponse.json(
        { error: "No images were generated" },
        { status: 500 }
      );
    }

    // Extract the generated image URLs and ensure they exist
    const images = response.data
      .filter(image => image.url) // Filter out any images without URLs
      .map(image => ({
        url: image.url!,
        revised_prompt: image.revised_prompt || prompt // Include revised prompt if available
      }));

    if (images.length === 0) {
      return NextResponse.json(
        { error: "Generated images had no valid URLs" },
        { status: 500 }
      );
    }

    console.log(`Successfully generated ${images.length} image(s)`);

    // Return the response
    return NextResponse.json({
      images,
      count: images.length,
      prompt_used: prompt,
      resolution_used: resolution
    });

  } catch (error: unknown) {
    console.error("OpenAI API Error:", error);

    // Handle specific OpenAI errors
    if (
      typeof error === "object" &&
      error !== null &&
      "error" in error &&
      typeof (error as { error: unknown }).error === "object" &&
      (error as { error: unknown }).error !== null &&
      "code" in (error as { error: { code?: unknown } }).error
    ) {
      const errObj = error as { error: { code: string; message?: string } };

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
      { status: 500 }
    );
  }
}