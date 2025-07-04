import { createAdminClient } from "@/config/appwrite";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

export async function GET(): Promise<NextResponse> {
  try {

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { databases } = await createAdminClient();

    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MUSIC_GENERATIONS_COLLECTION_ID!,
      [
        Query.equal("status", "success"),
        Query.equal("userId", userId),
      ]
    );

    console.log(`[${userId}] Fetched music history:`, response.documents.length);
    // Simulate fetching music history
    const musicHistory = [
      {
        id: "1",
        prompt: "Relaxing piano music",
        status: "success",
        audioUrl: "https://example.com/audio1.mp3",
        processingTime: "2 seconds",
        metadata: JSON.stringify({
          model: "riffusion/riffusion:8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05",
          timestamp: new Date().toISOString(),
          fileSize: 123456,
        }),
      },
      // Add more records as needed
    ];

    return NextResponse.json(musicHistory);
  } catch (error) {
    console.error("Failed to fetch music history:", error);
    return NextResponse.json({ error: "Failed to fetch music history" }, { status: 500 });
  }
}