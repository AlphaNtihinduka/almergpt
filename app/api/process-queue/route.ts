// app/api/video/process-queue/route.ts
import { processQueue } from "@/lib/process-queue";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await processQueue();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Queue processing failed:", error);
    return NextResponse.json(
      { success: false, error: "Queue processing failed" },
      { status: 500 }
    );
  }
}