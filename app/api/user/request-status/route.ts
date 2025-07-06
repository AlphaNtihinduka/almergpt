import { NextResponse } from 'next/server';
import { RequestTracker } from '@/config/Track/requestTrack';
import { auth } from '@clerk/nextjs/server';

export async function GET(): Promise<NextResponse> {
  try {
    // Get user ID from Clerk auth
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requestTracker = new RequestTracker();
    const status = await requestTracker.getUserRequestStatus(userId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching request status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
