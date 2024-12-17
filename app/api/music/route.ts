import Replicate from "replicate";
import { auth } from "@clerk/nextjs/server";

console.log("Replicate API Token:", process.env.REPLICATE_API_TOKEN);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const USE_MOCK = false; // Set to false to use the real API.

// Helper function: Convert ReadableStream to Base64
async function streamToBase64(stream: ReadableStream) {
  const chunks = [];
  const reader = stream.getReader();
  let done, value;

  while ({ done, value } = await reader.read(), !done) {
    chunks.push(value);
  }

  const blob = new Blob(chunks, { type: "audio/mp3" });
  const buffer = await blob.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Invalid prompt format" }), { status: 400 });
    }

    const input = { prompt_a: prompt };

    // Get the response from Replicate API
    const response = USE_MOCK
      ? {
          audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          metadata: { duration: "3:45", format: "mp3" },
        }
      : (await replicate.run(
          "riffusion/riffusion:8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05",
          { input }
        )) as { audio: ReadableStream | string; metadata: object };

    // Convert ReadableStream to Base64
    if (response.audio instanceof ReadableStream) {
      const base64Audio = await streamToBase64(response.audio);
      return new Response(
        JSON.stringify({ audio: `data:audio/mp3;base64,${base64Audio}` }),
        { status: 200 }
      );
    }

    // If the response is already a URL, return it directly
    return new Response(JSON.stringify({ audio: response.audio }), { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
