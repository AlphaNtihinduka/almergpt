import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";

// console.log("OPENAI_API_KEY:", process.env.OPENAI_KEY);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY, // Ensure this matches the variable in your `.env` file
});

const mockResponse = {
  choices: [
    { message: { role: "assistant", content: "This is a mock response." } },
  ],
};

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const { userId } = await auth();

    // Parse the request body
    const body = await req.json();
    const { messages } = body;

    // Validate the input
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Add the system message to guide the assistant's behavior
    const systemMessage = {
      role: "system",
      content: "You are a code generator. You must answer only in the markdown of code snippets. Use code comments for explanation.",
    };

    // Prepend the system message to the user's messages
    const fullMessages = [systemMessage, ...messages];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: fullMessages,
      max_tokens: 2, // Adjusted for more flexibility in response length
    });

    // const response = mockResponse;

    // Extract the reply
    const reply = response.choices?.[0]?.message?.content || "No response received.";

    // Return the response
    return new Response(
      JSON.stringify({ role: "assistant", content: reply }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("API code Error:", error);

    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
