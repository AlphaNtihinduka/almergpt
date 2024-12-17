import Replicate from "replicate";
import { auth } from "@clerk/nextjs/server";

console.log("Replicate API Token:", process.env.REPLICATE_API_TOKEN);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const USE_MOCK = true; // Set to false to use the real API.

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid prompt format" }),
        { status: 400 }
      );
    }

    const input = {
      prompt_a: "90's rap",
    };

    // Get the response from Replicate API
    const response = USE_MOCK
      ? {
          audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          metadata: { duration: "3:45", format: "mp3" },
        }
      : (await replicate.run(
          "riffusion/riffusion:8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05",
          { input }
        )) as { audio: ReadableStream | string; metadata: object }; // Type assertion

    console.log("Music response:", response);

    // Check if the response contains a ReadableStream for audio
    if (response.audio instanceof ReadableStream) {
      // Optionally convert it into a Blob or another format
      const audioBlob = await streamToBlob(response.audio);
      const audioUrl = URL.createObjectURL(audioBlob);

      return new Response(
        JSON.stringify({ audio: audioUrl }),
        { status: 200 }
      );
    }

    // If it's not a stream, return the audio URL directly
    return new Response(
      JSON.stringify({ audio: response.audio }),
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

// Helper function to convert ReadableStream to Blob
async function streamToBlob(stream: ReadableStream) {
  const chunks = [];
  const reader = stream.getReader();
  let done, value;

  while ({ done, value } = await reader.read(), !done) {
    chunks.push(value);
  }

  return new Blob(chunks);
}
