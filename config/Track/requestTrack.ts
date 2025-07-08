/* eslint-disable @typescript-eslint/no-explicit-any */
import { Query, ID } from "node-appwrite";
import { createAdminClient } from "../appwrite";

// Define subscription plan types and their limits
export interface SubscriptionLimits {
  requestLimit: number;
  resetPeriod: 'daily' | 'monthly' | 'unlimited';
  features: string[];
}

export const SUBSCRIPTION_LIMITS: Record<string, SubscriptionLimits> = {
  free: {
    requestLimit: 5,
    resetPeriod: 'daily',
    features: ['Basic code generation', 'Limited requests']
  },
  basic_monthly: {
    requestLimit: -1, // -1 means unlimited
    resetPeriod: 'unlimited',
    features: ['Unlimited requests', 'Premium support', 'Advanced code generation']
  },
  basic_yearly: {
    requestLimit: -1, // -1 means unlimited
    resetPeriod: 'unlimited',
    features: ['Unlimited requests', 'Premium support', 'Advanced code generation', '2 months free']
  }
};

// Request Tracker Class
export class RequestTracker {
  private databaseId: string;
  private collectionId: string;
  private subscriptionsCollectionId: string;

  constructor() {
    this.databaseId = process.env.APPWRITE_DATABASE_ID!;
    this.collectionId = process.env.APPWRITE_REQUESTS_COLLECTION_ID!;
    this.subscriptionsCollectionId = process.env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID!;
  }

  // Initialize or get user request record
  async initializeUserRequests(userId: string) {
    try {
      const { databases } = await createAdminClient();

      // Check if user already has a request record
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [Query.equal('userId', userId)]
      );

      if (response.documents.length > 0) {
        return response.documents[0];
      }

      // Create new record if doesn't exist
      const newRecord = await databases.createDocument(
        this.databaseId,
        this.collectionId,
        ID.unique(),
        {
          userId: userId,
          requestCount: 0,
          status: true,
          isSubscribed: false,
          subscriptionType: 'free',
          subscriptionPlanId: null,
          subscriptionId: null,
          subscriptionEndDate: null,
          lastResetDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      return newRecord;
    } catch (error) {
      console.error('Error initializing user requests:', error);
      throw error;
    }
  }

  // Check if user has an active subscription
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const { databases } = await createAdminClient();
      const now = new Date().toISOString();

      const subscriptions = await databases.listDocuments(
        this.databaseId,
        this.subscriptionsCollectionId,
        [
          Query.equal('userId', userId),
          Query.equal('status', 'active'),
          Query.greaterThan('endDate', now)
        ]
      );

      return subscriptions.documents.length > 0;
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return false;
    }
  }

  // Get user's active subscription details
  async getActiveSubscription(userId: string) {
    try {
      const { databases } = await createAdminClient();
      const now = new Date().toISOString();

      const subscriptions = await databases.listDocuments(
        this.databaseId,
        this.subscriptionsCollectionId,
        [
          Query.equal('userId', userId),
          Query.equal('status', 'active'),
          Query.greaterThan('endDate', now),
          Query.orderDesc('createdAt'),
          Query.limit(1)
        ]
      );

      return subscriptions.documents[0] || null;
    } catch (error) {
      console.error('Error getting active subscription:', error);
      return null;
    }
  }

  // Check subscription status and update user record accordingly
  async checkAndUpdateSubscriptionStatus(userId: string, userRecord: any) {
    try {
      const { databases } = await createAdminClient();
      const activeSubscription = await this.getActiveSubscription(userId);

      if (activeSubscription) {
        // User has active subscription
        const subscriptionType = this.getSubscriptionTypeFromPlanId(activeSubscription.planId);

        // Update user record if subscription info has changed
        if (userRecord.subscriptionType !== subscriptionType ||
          userRecord.subscriptionEndDate !== activeSubscription.endDate ||
          !userRecord.isSubscribed) {

          await databases.updateDocument(
            this.databaseId,
            this.collectionId,
            userRecord.$id,
            {
              isSubscribed: true,
              subscriptionType: subscriptionType,
              subscriptionPlanId: activeSubscription.planId,
              subscriptionId: activeSubscription.$id,
              subscriptionEndDate: activeSubscription.endDate,
              status: true,
              updatedAt: new Date().toISOString()
            }
          );

          // Update the userRecord object
          userRecord.isSubscribed = true;
          userRecord.subscriptionType = subscriptionType;
          userRecord.subscriptionPlanId = activeSubscription.planId;
          userRecord.subscriptionId = activeSubscription.$id;
          userRecord.subscriptionEndDate = activeSubscription.endDate;
          userRecord.status = true;
        }
      } else {
        // No active subscription, check if user record needs to be downgraded
        if (userRecord.isSubscribed || userRecord.subscriptionType !== 'free') {
          console.log(`Downgrading user ${userId} to free tier - subscription expired`);

          await databases.updateDocument(
            this.databaseId,
            this.collectionId,
            userRecord.$id,
            {
              isSubscribed: false,
              subscriptionType: 'free',
              subscriptionPlanId: null,
              subscriptionId: null,
              subscriptionEndDate: null,
              requestCount: 0, // Reset count when downgrading
              status: true,
              lastResetDate: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          );

          // Update the userRecord object
          userRecord.isSubscribed = false;
          userRecord.subscriptionType = 'free';
          userRecord.subscriptionPlanId = null;
          userRecord.subscriptionId = null;
          userRecord.subscriptionEndDate = null;
          userRecord.requestCount = 0;
          userRecord.status = true;
          userRecord.lastResetDate = new Date().toISOString();
        }
      }

      return userRecord;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return userRecord;
    }
  }

  // Check and reset daily limit for free users
  private async checkAndResetDailyLimit(userId: string, userRecord: any) {
    try {
      const { databases } = await createAdminClient();
      const now = new Date();
      const lastReset = new Date(userRecord.lastResetDate);

      // Check if it's been 24 hours since last reset
      const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

      if (hoursSinceReset >= 24) {
        await databases.updateDocument(
          this.databaseId,
          this.collectionId,
          userRecord.$id,
          {
            requestCount: 0,
            status: true,
            lastResetDate: now.toISOString(),
            updatedAt: now.toISOString()
          }
        );
      }
    } catch (error) {
      console.error('Error checking daily reset:', error);
    }
  }

  // Track a new request
  async trackRequest(userId: string) {
    try {
      const { databases } = await createAdminClient();
      let userRecord = await this.initializeUserRequests(userId);

      // Check and update subscription status
      userRecord = await this.checkAndUpdateSubscriptionStatus(userId, userRecord);

      // If user has active subscription, don't limit requests
      if (userRecord.isSubscribed && userRecord.subscriptionType !== 'free') {
        if (!userRecord.status) {
          throw new Error('Account is currently disabled.');
        }

        // For subscribed users, we still track the count for analytics but don't limit
        await databases.updateDocument(
          this.databaseId,
          this.collectionId,
          userRecord.$id,
          {
            requestCount: userRecord.requestCount + 1,
            updatedAt: new Date().toISOString()
          }
        );

        return {
          success: true,
          requestCount: userRecord.requestCount + 1,
          status: userRecord.status,
          remainingRequests: -1, // Unlimited
          subscriptionType: userRecord.subscriptionType,
          isSubscribed: true,
          subscriptionEndDate: userRecord.subscriptionEndDate
        };
      }

      // For free users, apply daily limits
      const limits = SUBSCRIPTION_LIMITS.free;

      // Check if daily reset is needed
      await this.checkAndResetDailyLimit(userId, userRecord);

      // Re-fetch the record after potential reset
      const updatedRecord = await databases.getDocument(
        this.databaseId,
        this.collectionId,
        userRecord.$id
      );
      userRecord.requestCount = updatedRecord.requestCount;
      userRecord.status = updatedRecord.status;

      // Check if user can make request
      if (!userRecord.status || userRecord.requestCount >= limits.requestLimit) {
        throw new Error(`Daily request limit reached (${limits.requestLimit}). Please upgrade your subscription for unlimited requests.`);
      }

      const newCount = userRecord.requestCount + 1;
      const newStatus = newCount < limits.requestLimit;

      // Update the record
      await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        userRecord.$id,
        {
          requestCount: newCount,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }
      );

      return {
        success: true,
        requestCount: newCount,
        status: newStatus,
        remainingRequests: Math.max(0, limits.requestLimit - newCount),
        subscriptionType: userRecord.subscriptionType,
        isSubscribed: false,
        subscriptionEndDate: null
      };
    } catch (error) {
      console.error('Error tracking request:', error);
      throw error;
    }
  }

  // Enhanced RequestTracker methods for premium access management

  // NEW METHOD: Activate premium access immediately after payment
  async activatePremiumAccess(userId: string, planId: string, subscriptionId: string, endDate: string) {
    try {
      const { databases } = await createAdminClient();
      const userRecord = await this.initializeUserRequests(userId);

      // Determine subscription type from plan ID
      const subscriptionType = this.getSubscriptionTypeFromPlanId(planId);
      const limits = SUBSCRIPTION_LIMITS[subscriptionType];

      if (!limits) {
        throw new Error(`Invalid subscription type: ${subscriptionType}`);
      }

      // Update the user's subscription information
      // Key: Set requestCount to 0 and status to true for immediate premium access
      await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        userRecord.$id,
        {
          requestCount: 0, // Reset request count
          status: true, // Activate account
          isSubscribed: true, // Mark as subscribed
          subscriptionType: subscriptionType,
          subscriptionPlanId: planId,
          subscriptionId: subscriptionId,
          subscriptionEndDate: endDate,
          lastResetDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      console.log(`✅ Premium access activated for user ${userId} with ${subscriptionType} until ${endDate}`);

      return {
        success: true,
        message: `Premium access activated for ${subscriptionType}`,
        subscriptionType: subscriptionType,
        subscriptionEndDate: endDate,
        limits: limits
      };
    } catch (error) {
      console.error('Error activating premium access:', error);
      throw error;
    }
  }

  // ENHANCED METHOD: Modified canMakeRequest to handle premium users
  async canMakeRequest(userId: string) {
    try {
      let userRecord = await this.initializeUserRequests(userId);

      // Check and update subscription status
      userRecord = await this.checkAndUpdateSubscriptionStatus(userId, userRecord);

      // If user has active subscription, they can make unlimited requests
      if (userRecord.isSubscribed && userRecord.subscriptionType !== 'free') {
        console.log(`✅ Premium user ${userId} can make unlimited requests until ${userRecord.subscriptionEndDate}`);
        return true; // Premium users always can make requests
      }

      // For free users, check daily limit
      if (userRecord.subscriptionType === 'free') {
        await this.checkAndResetDailyLimit(userId, userRecord);
        // Re-fetch the record after potential reset
        const { databases } = await createAdminClient();
        const updatedRecord = await databases.getDocument(
          this.databaseId,
          this.collectionId,
          userRecord.$id
        );
        userRecord.requestCount = updatedRecord.requestCount;
        userRecord.status = updatedRecord.status;
      }

      const limits = SUBSCRIPTION_LIMITS[userRecord.subscriptionType];
      if (!limits) {
        console.error(`Unknown subscription type: ${userRecord.subscriptionType}`);
        return false;
      }

      // Check against the limit
      const canMake = userRecord.status && userRecord.requestCount < limits.requestLimit;
      console.log(`Free user ${userId} can make request: ${canMake} (${userRecord.requestCount}/${limits.requestLimit})`);

      return canMake;
    } catch (error) {
      console.error('Error checking request permission:', error);
      return false;
    }
  }

  // ENHANCED METHOD: Modified getUserRequestStatus
  async getUserRequestStatus(userId: string) {
    try {
      let userRecord = await this.initializeUserRequests(userId);

      // Check and update subscription status
      userRecord = await this.checkAndUpdateSubscriptionStatus(userId, userRecord);

      // If user has active subscription
      if (userRecord.isSubscribed && userRecord.subscriptionType !== 'free') {
        const limits = SUBSCRIPTION_LIMITS[userRecord.subscriptionType];

        return {
          requestCount: 0, // Always 0 for premium users
          status: userRecord.status,
          subscriptionType: userRecord.subscriptionType,
          subscriptionPlanId: userRecord.subscriptionPlanId,
          subscriptionId: userRecord.subscriptionId,
          subscriptionEndDate: userRecord.subscriptionEndDate,
          remainingRequests: -1, // Unlimited
          canMakeRequest: userRecord.status,
          limits: limits,
          isSubscribed: true,
          lastResetDate: userRecord.lastResetDate,
          message: `Premium access active until ${userRecord.subscriptionEndDate}`
        };
      }

      // For free users, check daily reset
      await this.checkAndResetDailyLimit(userId, userRecord);

      // Re-fetch the record after potential reset
      const { databases } = await createAdminClient();
      const updatedRecord = await databases.getDocument(
        this.databaseId,
        this.collectionId,
        userRecord.$id
      );
      userRecord.requestCount = updatedRecord.requestCount;
      userRecord.status = updatedRecord.status;

      const limits = SUBSCRIPTION_LIMITS.free;

      return {
        requestCount: userRecord.requestCount,
        status: userRecord.status,
        subscriptionType: userRecord.subscriptionType,
        subscriptionPlanId: userRecord.subscriptionPlanId,
        subscriptionId: userRecord.subscriptionId,
        subscriptionEndDate: userRecord.subscriptionEndDate,
        remainingRequests: Math.max(0, limits.requestLimit - userRecord.requestCount),
        canMakeRequest: userRecord.status && userRecord.requestCount < limits.requestLimit,
        limits: limits,
        isSubscribed: false,
        lastResetDate: userRecord.lastResetDate
      };
    } catch (error) {
      console.error('Error getting user request status:', error);
      throw error;
    }
  }


  // Update user subscription after payment
  async updateUserSubscription(userId: string, planId: string, subscriptionId: string) {
    try {
      const { databases } = await createAdminClient();
      const userRecord = await this.initializeUserRequests(userId);

      // Get the active subscription to get the end date
      const activeSubscription = await this.getActiveSubscription(userId);

      if (!activeSubscription) {
        throw new Error('No active subscription found for user');
      }

      // Determine subscription type from plan ID
      const subscriptionType = this.getSubscriptionTypeFromPlanId(planId);
      const limits = SUBSCRIPTION_LIMITS[subscriptionType];

      if (!limits) {
        throw new Error(`Invalid subscription type: ${subscriptionType}`);
      }

      // Update the user's subscription information
      await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        userRecord.$id,
        {
          requestCount: 0, // Reset request count
          status: true, // Activate account
          isSubscribed: subscriptionType !== 'free',
          subscriptionType: subscriptionType,
          subscriptionPlanId: planId,
          subscriptionId: subscriptionId,
          subscriptionEndDate: activeSubscription.endDate,
          lastResetDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      console.log(`✅ User ${userId} subscription updated to ${subscriptionType} until ${activeSubscription.endDate}`);

      return {
        success: true,
        message: `User subscription updated to ${subscriptionType}`,
        subscriptionType: subscriptionType,
        subscriptionEndDate: activeSubscription.endDate,
        limits: limits
      };
    } catch (error) {
      console.error('Error updating user subscription:', error);
      throw error;
    }
  }

  // Helper method to determine subscription type from plan ID
  private getSubscriptionTypeFromPlanId(planId: string): string {
    const planMapping: Record<string, string> = {
      'basic_monthly': 'basic_monthly',
      'basic_yearly': 'basic_yearly'
    };

    return planMapping[planId] || 'free';
  }

  // Reset user requests (for admin use)
  async resetUserRequests(userId: string) {
    try {
      const { databases } = await createAdminClient();
      const userRecord = await this.initializeUserRequests(userId);

      await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        userRecord.$id,
        {
          requestCount: 0,
          status: true,
          lastResetDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      return {
        success: true,
        message: 'User requests reset successfully'
      };
    } catch (error) {
      console.error('Error resetting user requests:', error);
      throw error;
    }
  }

  // Cancel user subscription (downgrade to free)
  async cancelUserSubscription(userId: string) {
    try {
      const { databases } = await createAdminClient();
      const userRecord = await this.initializeUserRequests(userId);

      await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        userRecord.$id,
        {
          requestCount: 0, // Reset to free tier limit
          status: true,
          isSubscribed: false,
          subscriptionType: 'free',
          subscriptionPlanId: null,
          subscriptionId: null,
          subscriptionEndDate: null,
          lastResetDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      return {
        success: true,
        message: 'User subscription cancelled, downgraded to free tier'
      };
    } catch (error) {
      console.error('Error cancelling user subscription:', error);
      throw error;
    }
  }

  // Get subscription limits for a plan
  getSubscriptionLimits(planId: string): SubscriptionLimits {
    const subscriptionType = this.getSubscriptionTypeFromPlanId(planId);
    return SUBSCRIPTION_LIMITS[subscriptionType] || SUBSCRIPTION_LIMITS.free;
  }

  // Method to check and process expired subscriptions (should be called periodically)
  async processExpiredSubscriptions() {
    try {
      const { databases } = await createAdminClient();
      const now = new Date().toISOString();

      // Find all users with expired subscriptions
      const expiredUsers = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('isSubscribed', true),
          Query.isNotNull('subscriptionEndDate'),
          Query.lessThan('subscriptionEndDate', now)
        ]
      );

      console.log(`Found ${expiredUsers.documents.length} users with expired subscriptions`);

      for (const user of expiredUsers.documents) {
        console.log(`Processing expired subscription for user: ${user.userId}`);

        await databases.updateDocument(
          this.databaseId,
          this.collectionId,
          user.$id,
          {
            isSubscribed: false,
            subscriptionType: 'free',
            subscriptionPlanId: null,
            subscriptionId: null,
            subscriptionEndDate: null,
            requestCount: 0,
            status: true,
            lastResetDate: now,
            updatedAt: now
          }
        );

        console.log(`✅ User ${user.userId} downgraded to free tier due to expired subscription`);
      }

      return {
        success: true,
        processedUsers: expiredUsers.documents.length,
        message: `Processed ${expiredUsers.documents.length} expired subscriptions`
      };
    } catch (error) {
      console.error('Error processing expired subscriptions:', error);
      throw error;
    }
  }
}