import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY, // Ensure this matches the variable in your `.env` file
});

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const { userId } = await auth();

    // Parse the request body
    const body = await req.json();
    const { prompt, amount = 1, resolution = "512x512" } = body;

    // Validate the input
    if (!prompt || (typeof prompt !== "string" && !Array.isArray(prompt))) {
      return new Response(
        JSON.stringify({ error: "Invalid prompt format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Normalize prompt to array format
    const processedPrompt = Array.isArray(prompt) ? prompt : [prompt];

    // Call OpenAI API
    const response = await openai.images.generate({
      prompt: processedPrompt[0], // Use the first prompt
      n: parseInt(amount, 10),
      size: resolution,
    });

    // Extract the generated image URLs
    const images = response.data.map((image) => image.url);

    // Return the response
    return new Response(
      JSON.stringify({ images }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("API Error:", error);

    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
