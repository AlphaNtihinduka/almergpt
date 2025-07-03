import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { ID } from "node-appwrite";
import { createAdminClient } from "@/config/appwrite";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const { userId } = await auth();

    // Check if user is authenticated
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse the request body
    const body = await req.json();
    const { messages, conversationId } = body;

    // Validate the input
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate message format
    const isValidMessages = messages.every(msg =>
      msg && typeof msg === 'object' &&
      msg.role && msg.content &&
      ['system', 'user', 'assistant'].includes(msg.role)
    );

    if (!isValidMessages) {
      return new Response(
        JSON.stringify({ error: "Invalid message structure. Each message must have 'role' and 'content' properties." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call OpenAI API with appropriate settings for conversation
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 1000, // Increased from 2 to allow proper responses
      temperature: 0.7, // Add some creativity
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    // Extract the reply
    const reply = response.choices?.[0]?.message?.content || "No response received.";

    const assistantMessage = {
      role: "assistant",
      content: reply.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      const currentConversationId = conversationId || ID.unique();
      const lastUserMessage = messages[messages.length - 1];

      // Create conversation document
      const conversationData = {
        conversationId: currentConversationId,
        userId: userId,
        userMessage: lastUserMessage.content,
        assistantMessage: reply.trim(),
        timestamp: new Date().toISOString(),
        model: "gpt-4o",
        tokenUsage: JSON.stringify(response.usage || {}),
        // Store full message history for context
        messageHistory: messages.concat(assistantMessage).map(msg => JSON.stringify(msg))
      };

      const { databases } = await createAdminClient();
      await databases.createDocument(process.env.APPWRITE_DATABASE_ID!, process.env.APPWRITE_COLLECTION_ID_MESSAGES!, currentConversationId, conversationData);
      console.log("Conversation saved successfully:", conversationData);
    } catch (error) {
      console.error("Error saving conversation:", error);
    }

    // Return the response in the expected format
    return new Response(
      JSON.stringify({
        role: "assistant",
        content: reply.trim(),
        usage: response.usage // Include token usage info
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("API Error:", error);

    // More specific error handling
    if (error instanceof OpenAI.APIError) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API Error",
          message: error.message,
          status: error.status
        }),
        { status: error.status || 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}