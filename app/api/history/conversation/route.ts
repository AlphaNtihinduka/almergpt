import { createAdminClient } from "@/config/appwrite";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Authentication required", code: "AUTH_REQUIRED" }, { status: 401 })
    }

    // 2. Initialize the Appwrite admin client
    const { databases } = await createAdminClient();

    // 3. Fetch documents from the Appwrite collection
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_COLLECTION_ID_MESSAGES!,
      [
        // Use a query to filter documents where 'userId' matches the authenticated user's ID.
        // This ensures that users can only access their own conversation history.
        // Make sure you have an index on the 'userId' attribute in your Appwrite collection for this to work.
        Query.equal("userId", userId),
        // Optionally, you can add more queries here, for example to sort by creation date:
      ]
    );

    // 4. Return the fetched documents
    return NextResponse.json(response.documents, { status: 200 });
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Failed to fetch conversation history:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    // Return a generic internal server error response
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}