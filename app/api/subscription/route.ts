import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FlutterwaveSubscriptionService } from "@/lib/flutterwave/subscription";
import { RequestTracker } from "@/config/Track/requestTrack";

const subscriptionService = new FlutterwaveSubscriptionService();
const requestTracker = new RequestTracker();

// Validation schemas
const InitializeSubscriptionSchema = z.object({
  planId: z.string(),
  redirectUrl: z.string().url()
});

const VerifyPaymentSchema = z.object({
  transactionId: z.string(),
  flutterwaveTransactionId: z.string()
});

// POST - Initialize subscription or verify payment
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'initialize': {
        const validationResult = InitializeSubscriptionSchema.safeParse(body);
        if (!validationResult.success) {
          return NextResponse.json(
            { error: "Invalid request format", details: validationResult.error.issues },
            { status: 400 }
          );
        }

        const { planId, redirectUrl } = validationResult.data;

        // Get user email from Clerk
        const userEmail = user?.emailAddresses[0]?.emailAddress;

        if (!userEmail) {
          return NextResponse.json(
            { error: "User email is required" },
            { status: 400 }
          );
        }

        const result = await subscriptionService.initializeSubscription(
          userId,
          planId,
          userEmail,
          redirectUrl
        );

        return NextResponse.json(result);
      }

      case 'verify': {
        const validationResult = VerifyPaymentSchema.safeParse(body);

        if (!validationResult.success) {
          return NextResponse.json(
            { error: "Invalid request format", details: validationResult.error.issues },
            { status: 400 }
          );
        }

        const { transactionId, flutterwaveTransactionId } = validationResult.data;

        const result = await subscriptionService.verifySubscriptionPayment(
          transactionId,
          flutterwaveTransactionId
        );

        return NextResponse.json(result);
      }

      case 'cancel': {
        const { subscriptionId } = body;
        if (!subscriptionId) {
          return NextResponse.json(
            { error: "Subscription ID required" },
            { status: 400 }
          );
        }

        const result = await subscriptionService.cancelSubscription(userId, subscriptionId);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action", code: "INVALID_ACTION" },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET - Get subscription info, plans, transactions, or request status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'plans': {
        const plans = subscriptionService.getPlans();
        return NextResponse.json({ plans });
      }

      case 'status': {
        const { userId } = await auth();
        if (!userId) {
          return NextResponse.json(
            { error: "Authentication required", code: "AUTH_REQUIRED" },
            { status: 401 }
          );
        }

        const [hasActiveSubscription, subscription, requestStatus] = await Promise.all([
          subscriptionService.hasActiveSubscription(userId),
          subscriptionService.getUserSubscription(userId),
          requestTracker.getUserRequestStatus(userId)
        ]);

        return NextResponse.json({
          hasActiveSubscription,
          subscription,
          requestStatus,
          timestamp: new Date().toISOString()
        });
      }

      case 'request-status': {
        const { userId } = await auth();
        if (!userId) {
          return NextResponse.json(
            { error: "Authentication required", code: "AUTH_REQUIRED" },
            { status: 401 }
          );
        }

        const requestStatus = await requestTracker.getUserRequestStatus(userId);
        return NextResponse.json({ requestStatus });
      }

      case 'transactions': {
        const { userId } = await auth();
        if (!userId) {
          return NextResponse.json(
            { error: "Authentication required", code: "AUTH_REQUIRED" },
            { status: 401 }
          );
        }

        const limit = parseInt(searchParams.get('limit') || '10');
        const transactions = await subscriptionService.getUserTransactions(userId, limit);

        return NextResponse.json({ transactions });
      }

      case 'plan-limits': {
        const planId = searchParams.get('planId');
        if (!planId) {
          return NextResponse.json(
            { error: "Plan ID required" },
            { status: 400 }
          );
        }

        const limits = requestTracker.getSubscriptionLimits(planId);
        return NextResponse.json({ limits });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action", code: "INVALID_ACTION" },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Subscription GET API error:', error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}