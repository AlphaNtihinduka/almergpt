import Replicate from "replicate";
import { auth } from "@clerk/nextjs/server";

console.log("Replicate API Token:", process.env.REPLICATE_API_TOKEN);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const USE_MOCK = true; // Set to false to use the real API.

export async function POST(req: Request) {
  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid prompt format" }),
        { status: 400 }
      );
    }

    // Input for the Replicate API
    const input = {
      fps: 24,
      width: 1024,
      height: 576,
      prompt: prompt, // Use prompt from request body
      guidance_scale: 17.5,
      negative_prompt: "very blue, dust, noisy, washed out, ugly, distorted, broken",
    };

    // Mock Response or Real API Call
    const response = USE_MOCK
      ? {
          video: "/braveboy.mp4",
          metadata: { duration: "3:45", format: "mp4" },
        }
      : (await replicate.run(
          "anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
          { input }
        )) as { video: string; metadata: object }; // Real API Response

    console.log("Video response:", response.video);

    // Return the video URL directly
    return new Response(
      JSON.stringify({ video: response.video }),
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
