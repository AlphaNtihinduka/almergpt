/* eslint-disable @typescript-eslint/no-unused-vars */
import { Query, ID } from "node-appwrite";
import { createAdminClient } from "@/config/appwrite";
import { RequestTracker } from "@/config/Track/requestTrack";
import { request } from "http";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string; // 'monthly' | 'yearly'
  features: string[];
}

export interface Transaction {
  id: string;
  userId: string;
  flutterwaveTransactionId: string;
  subscriptionPlanId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  metadata: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  flutterwaveCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export class FlutterwaveSubscriptionService {
  private readonly flutterwaveSecretKey: string;
  private readonly flutterwavePublicKey: string;
  private readonly baseUrl: string;
  private readonly databaseId: string;
  private readonly subscriptionsCollectionId: string;
  private readonly transactionsCollectionId: string;
  private readonly requestTracker: RequestTracker;

  // Available subscription plans
  private readonly plans: SubscriptionPlan[] = [
    {
      id: 'basic_monthly',
      name: 'Basic Monthly',
      price: 20000, // UGX 20,000 (adjust as needed)
      currency: 'UGX',
      interval: 'monthly',
      features: ['Unlimited requests', 'Premium support', 'Advanced code generation']
    },
    {
      id: 'basic_yearly',
      name: 'Basic Yearly',
      price: 200000, // UGX 200,000 (adjust as needed)
      currency: 'UGX',
      interval: 'yearly',
      features: ['Unlimited requests', 'Premium support', 'Advanced code generation', '2 months free']
    }
  ];

  constructor() {
    this.flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY!;
    this.flutterwavePublicKey = process.env.FLUTTERWAVE_PUBLIC_KEY!;
    this.baseUrl = 'https://api.flutterwave.com/v3';
    this.databaseId = process.env.APPWRITE_DATABASE_ID!;
    this.subscriptionsCollectionId = process.env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID!;
    this.transactionsCollectionId = process.env.APPWRITE_TRANSACTIONS_COLLECTION_ID!;
    this.requestTracker = new RequestTracker();

    // Validate required environment variables
    if (!this.flutterwaveSecretKey || !this.flutterwavePublicKey) {
      throw new Error('Flutterwave keys are required');
    }
  }

  // Get available subscription plans
  getPlans(): SubscriptionPlan[] {
    return this.plans;
  }

  // Get specific plan by ID
  getPlan(planId: string): SubscriptionPlan | null {
    return this.plans.find(plan => plan.id === planId) || null;
  }

  // Initialize subscription payment
  async initializeSubscription(userId: string, planId: string, userEmail: string, redirectUrl: string) {
    try {
      // Validate required parameters
      if (!userId || !planId || !userEmail || !redirectUrl) {
        throw new Error('Missing required parameters: userId, planId, userEmail, or redirectUrl');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        throw new Error('Invalid email format');
      }

      const plan = this.getPlan(planId);
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // Create transaction record first
      const transaction = await this.createTransaction({
        userId,
        subscriptionPlanId: planId,
        amount: plan.price,
        currency: plan.currency,
        status: 'pending'
      });

      // Check if transaction was created successfully
      if (!transaction || !transaction.id) {
        throw new Error('Failed to create transaction record');
      }

      // Generate shorter transaction reference to avoid length issues
      // Use timestamp + random string instead of full transaction ID
      // Generate unique transaction reference
      const txRef = `SB${transaction.id}${Date.now()}`;

      // Initialize Flutterwave payment with all required parameters
      const paymentData = {
        tx_ref: txRef,
        amount: plan.price.toString(), // Convert to string
        currency: plan.currency,
        payment_options: 'card,banktransfer,ussd,mobilemoney',
        redirect_url: redirectUrl,
        customer: {
          email: userEmail,
          name: userEmail.split('@')[0], // Extract name from email
          phonenumber: "", // Optional but recommended
        },
        customizations: {
          title: 'AlmerGPT Subscription',
          description: `Subscribe to ${plan.name}`,
          logo: 'https://your-domain.com/logo.png'
        },
        meta: {
          userId: userId,
          planId: planId,
          transactionId: transaction.id,
          consumer_id: userId,
          consumer_mac: "92a3-912ba-1192a" // Required for some regions
        }
      };

      console.log('Initializing Flutterwave payment with data:', JSON.stringify(paymentData, null, 2));

      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.flutterwaveSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      // Log the response for debugging
      console.log('Flutterwave API response:', JSON.stringify(result, null, 2));

      if (!response.ok) {
        console.error('Flutterwave API error:', result);
        throw new Error(`Flutterwave error: ${result.message || 'Unknown error'}`);
      }

      if (result.status !== 'success') {
        throw new Error(`Flutterwave error: ${result.message || 'Payment initialization failed'}`);
      }

      // Extract transaction reference from the payment link if needed
      const flutterwaveTransactionId = txRef; // Use our tx_ref as the identifier

      // Update transaction with Flutterwave transaction reference
      await this.updateTransaction(transaction.id, {
        flutterwaveTransactionId: flutterwaveTransactionId,
        metadata: JSON.stringify(result.data)
      });

      return {
        success: true,
        paymentLink: result.data.link,
        transactionId: transaction.id,
        flutterwaveTransactionId: flutterwaveTransactionId,
        txRef: txRef
      };

    } catch (error) {
      console.error('Error initializing subscription:', error);
      throw error;
    }
  }

  // Updated verifySubscriptionPayment method
  async verifySubscriptionPayment(transactionId: string, flutterwaveTransactionId: string) {
    try {
      console.log(`=== Payment Verification Started ===`);
      console.log(`Transaction ID: ${transactionId}`);
      console.log(`Flutterwave Transaction ID: ${flutterwaveTransactionId}`);

      // Validate transaction ID format before proceeding
      if (!this.validateDocumentId(transactionId)) {
        throw new Error(`Invalid transaction ID format: ${transactionId}`);
      }

      // Get the transaction from our database
      let transaction = await this.getTransaction(transactionId);

      if (!transaction) {
        // Try to find transaction by flutterwaveTransactionId as fallback
        const { databases } = await createAdminClient();
        const transactionSearch = await databases.listDocuments(
          this.databaseId,
          this.transactionsCollectionId,
          [
            Query.equal('flutterwaveTransactionId', flutterwaveTransactionId),
            Query.limit(1)
          ]
        );

        if (transactionSearch.documents.length > 0) {
          const foundTransaction = transactionSearch.documents[0];
          transaction = {
            id: foundTransaction.$id,
            userId: foundTransaction.userId,
            flutterwaveTransactionId: foundTransaction.flutterwaveTransactionId,
            subscriptionPlanId: foundTransaction.subscriptionPlanId,
            amount: foundTransaction.amount,
            currency: foundTransaction.currency,
            status: foundTransaction.status,
            paymentMethod: foundTransaction.paymentMethod,
            createdAt: foundTransaction.createdAt,
            updatedAt: foundTransaction.updatedAt,
            metadata: foundTransaction.metadata
          } as Transaction;
        } else {
          throw new Error('Transaction not found in database');
        }
      }

      // Verify payment with Flutterwave
      const txRef = transaction.flutterwaveTransactionId || flutterwaveTransactionId;
      let response = await fetch(`${this.baseUrl}/transactions/verify_by_reference?tx_ref=${txRef}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.flutterwaveSecretKey}`,
          'Content-Type': 'application/json',
        }
      });

      let result = await response.json();

      // If verification by reference fails, try by transaction ID
      if (!response.ok || result.status !== 'success') {
        response = await fetch(`${this.baseUrl}/transactions/${flutterwaveTransactionId}/verify`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.flutterwaveSecretKey}`,
            'Content-Type': 'application/json',
          }
        });
        result = await response.json();
      }

      if (!response.ok || result.status !== 'success') {
        throw new Error(`Flutterwave verification error: ${result.message || 'Verification failed'}`);
      }

      const paymentData = result.data;
      const metadata = paymentData.meta || {};
      const userId = metadata.userId || transaction.userId;
      const planId = metadata.planId || transaction.subscriptionPlanId;
      const dbTransactionId = metadata.transactionId || transaction.id;

      // Update transaction status
      await this.updateTransaction(dbTransactionId, {
        status: paymentData.status === 'successful' ? 'completed' : 'failed',
        paymentMethod: paymentData.payment_type || 'unknown',
        metadata: JSON.stringify(paymentData),
        flutterwaveTransactionId: paymentData.tx_ref || txRef
      });

      if (paymentData.status === 'successful') {
        console.log(`💰 Payment successful, activating subscription for user: ${userId}, plan: ${planId}`);

        // Create subscription record (this will call activatePremiumAccess internally)
        const subscription = await this.activateSubscription(userId, planId, dbTransactionId);

        console.log(`✅ Subscription activated successfully:`);
        console.log(`   - User: ${userId}`);
        console.log(`   - Plan: ${planId}`);
        console.log(`   - Subscription ID: ${subscription}`);
        console.log(`   - Valid until: ${subscription.endDate}`);
        console.log(`   - Premium access: ACTIVE (no request counting)`);

        return {
          success: true,
          subscription,
          transaction: await this.getTransaction(dbTransactionId),
          message: `Premium access activated until ${subscription.endDate}`
        };
      }

      return {
        success: false,
        error: `Payment status: ${paymentData.status}`,
        paymentData
      };

    } catch (error) {
      console.error('=== Payment Verification Error ===');
      console.error('Error details:', error);

      // Update transaction status to failed
      try {
        if (transactionId && this.validateDocumentId(transactionId)) {
          await this.updateTransaction(transactionId, {
            status: 'failed',
            metadata: JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            })
          });
        }
      } catch (updateError) {
        console.error('Error updating transaction status:', updateError);
      }

      throw error;
    }
  }

  // Activate subscription after successful payment
  private async activateSubscription(userId: string, planId: string, transactionId: string): Promise<Subscription> {
    try {
      const { databases } = await createAdminClient();
      const plan = this.getPlan(planId);

      if (!plan) {
        throw new Error('Invalid plan ID');
      }

      const now = new Date();
      const endDate = new Date(now);

      // Calculate end date based on interval
      if (plan.interval === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.interval === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Check if user already has an active subscription
      const existingSubscriptions = await databases.listDocuments(
        this.databaseId,
        this.subscriptionsCollectionId,
        [
          Query.equal('userId', userId),
          Query.equal('status', 'active')
        ]
      );

      // Cancel existing active subscriptions
      for (const existingSub of existingSubscriptions.documents) {
        await databases.updateDocument(
          this.databaseId,
          this.subscriptionsCollectionId,
          existingSub.$id,
          {
            status: 'cancelled',
            updatedAt: now.toISOString()
          }
        );
      }

      // Create new subscription
      const subscriptionData = {
        userId,
        planId,
        status: 'active',
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      const newSubscription = await databases.createDocument(
        this.databaseId,
        this.subscriptionsCollectionId,
        ID.unique(),
        subscriptionData
      );

      console.log(`Subscription activated for user ${userId}: ${newSubscription.$id}`);

      return newSubscription as unknown as Subscription;

    } catch (error) {
      console.error('Error activating subscription:', error);
      throw error;
    }
  }

  // Create transaction record
  private async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    try {
      const { databases } = await createAdminClient();
      const now = new Date().toISOString();

      // Properly handle metadata as a string
      let metadataString = '';
      if (data.metadata) {
        if (typeof data.metadata === 'string') {
          metadataString = data.metadata;
        } else {
          metadataString = JSON.stringify(data.metadata);
        }
      }

      const transactionData = {
        userId: data.userId!,
        subscriptionPlanId: data.subscriptionPlanId!,
        amount: data.amount!,
        currency: data.currency!,
        status: data.status || 'pending',
        paymentMethod: data.paymentMethod || '',
        flutterwaveTransactionId: data.flutterwaveTransactionId || '',
        createdAt: now,
        updatedAt: now,
        metadata: metadataString // Always a string, can be empty
      };

      console.log('Creating transaction with data:', JSON.stringify(transactionData, null, 2));

      const transaction = await databases.createDocument(
        this.databaseId,
        this.transactionsCollectionId,
        ID.unique(),
        transactionData
      );

      console.log('Transaction created successfully:', transaction.$id);

      // Return transaction with proper ID mapping
      return {
        id: transaction.$id,
        userId: transaction.userId,
        flutterwaveTransactionId: transaction.flutterwaveTransactionId,
        subscriptionPlanId: transaction.subscriptionPlanId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        metadata: transaction.metadata
      } as Transaction;

    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Add these helper methods to your FlutterwaveSubscriptionService class

  // Helper method to validate document ID
  private validateDocumentId(documentId: string): boolean {
    // Appwrite document ID rules:
    // - Max 36 characters
    // - Only a-z, A-Z, 0-9, underscore
    // - Cannot start with underscore
    const regex = /^[a-zA-Z0-9][a-zA-Z0-9_]*$/;
    return documentId.length <= 36 && regex.test(documentId);
  }

  // Helper method to sanitize document ID
  private sanitizeDocumentId(documentId: string): string {
    if (!documentId) {
      throw new Error('Document ID cannot be empty');
    }

    // Remove any invalid characters and ensure it doesn't start with underscore
    let sanitized = documentId.replace(/[^a-zA-Z0-9_]/g, '');

    // If it starts with underscore, remove it
    if (sanitized.startsWith('_')) {
      sanitized = sanitized.substring(1);
    }

    // Ensure it's not empty after sanitization
    if (!sanitized) {
      throw new Error('Document ID is empty after sanitization');
    }

    // Truncate if too long
    if (sanitized.length > 36) {
      sanitized = sanitized.substring(0, 36);
    }

    return sanitized;
  }

  // Updated getTransaction method with validation
  async getTransaction(transactionId: string): Promise<Transaction | null> {
    try {
      const { databases } = await createAdminClient();

      // Validate and sanitize the transaction ID
      if (!this.validateDocumentId(transactionId)) {
        console.error(`Invalid transaction ID format: ${transactionId}`);
        const sanitized = this.sanitizeDocumentId(transactionId);
        console.log(`Using sanitized ID: ${sanitized}`);
        transactionId = sanitized;
      }

      console.log(`Attempting to get transaction with ID: ${transactionId}`);

      const transaction = await databases.listDocuments(
        this.databaseId,
        this.transactionsCollectionId,
        [
          Query.equal('$id', transactionId),
        ]
      );

      console.log(`Transaction found:`, transaction);

      return transaction as unknown as Transaction;

    } catch (error) {
      console.error('Error getting transaction:', error);

      // Log the exact error for debugging
      if (error instanceof Error ? error.message && error.message.includes('Invalid `documentId` param') : "") {
        console.error(`Transaction ID validation failed: ${transactionId}`);
        console.error(`ID Length: ${transactionId.length}`);
        console.error(`ID Contains invalid chars: ${!/^[a-zA-Z0-9][a-zA-Z0-9_]*$/.test(transactionId)}`);
      }

      return null;
    }
  }

  // Updated updateTransaction method with validation
  private async updateTransaction(transactionId: string, updates: Partial<Transaction>) {
    try {
      const { databases } = await createAdminClient();

      // Validate and sanitize the transaction ID
      if (!this.validateDocumentId(transactionId)) {
        console.error(`Invalid transaction ID format for update: ${transactionId}`);
        const sanitized = this.sanitizeDocumentId(transactionId);
        console.log(`Using sanitized ID for update: ${sanitized}`);
        transactionId = sanitized;
      }

      // Handle metadata properly if it's being updated
      const processedUpdates = { ...updates };
      if (updates.metadata !== undefined) {
        if (typeof updates.metadata === 'string') {
          processedUpdates.metadata = updates.metadata;
        } else {
          processedUpdates.metadata = JSON.stringify(updates.metadata);
        }
      }

      console.log(`Updating transaction ${transactionId} with:`, processedUpdates);

      await databases.updateDocument(
        this.databaseId,
        this.transactionsCollectionId,
        transactionId,
        {
          ...processedUpdates,
          updatedAt: new Date().toISOString()
        }
      );

      console.log(`Transaction ${transactionId} updated successfully`);

    } catch (error) {
      console.error('Error updating transaction:', error);

      // Log additional debug info
      if (error instanceof Error ? error.message && error.message.includes('Invalid `documentId` param') : '') {
        console.error(`Update transaction ID validation failed: ${transactionId}`);
        console.error(`ID Length: ${transactionId.length}`);
        console.error(`ID Contains invalid chars: ${!/^[a-zA-Z0-9][a-zA-Z0-9_]*$/.test(transactionId)}`);
      }

      throw error;
    }
  }

  // Check if user has active subscription
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const { databases } = await createAdminClient();

      const subscriptions = await databases.listDocuments(
        this.databaseId,
        this.subscriptionsCollectionId,
        [
          Query.equal('userId', userId),
          Query.equal('status', 'active'),
          Query.greaterThan('endDate', new Date().toISOString())
        ]
      );

      return subscriptions.documents.length > 0;

    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  // Get user's active subscription
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { databases } = await createAdminClient();

      const subscriptions = await databases.listDocuments(
        this.databaseId,
        this.subscriptionsCollectionId,
        [
          Query.equal('userId', userId),
          Query.equal('status', 'active'),
          Query.greaterThan('endDate', new Date().toISOString())
        ]
      );

      return subscriptions.documents[0] as unknown as Subscription || null;

    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null;
    }
  }

  // Check for expired subscriptions and handle renewals
  async processExpiredSubscriptions() {
    try {
      const { databases } = await createAdminClient();

      // Find expired subscriptions
      const expiredSubscriptions = await databases.listDocuments(
        this.databaseId,
        this.subscriptionsCollectionId,
        [
          Query.equal('status', 'active'),
          Query.lessThan('endDate', new Date().toISOString())
        ]
      );

      console.log(`Found ${expiredSubscriptions.documents.length} expired subscriptions`);

      for (const subscription of expiredSubscriptions.documents) {
        if (subscription.autoRenew) {
          // Handle auto-renewal logic here
          // You might want to attempt to charge the user again
          console.log(`Auto-renewing subscription ${subscription.$id} for user ${subscription.userId}`);
          // Implementation depends on your auto-renewal strategy
        } else {
          // Mark as expired
          await databases.updateDocument(
            this.databaseId,
            this.subscriptionsCollectionId,
            subscription.$id,
            {
              status: 'expired',
              updatedAt: new Date().toISOString()
            }
          );
          console.log(`Subscription ${subscription.$id} marked as expired`);
        }
      }

    } catch (error) {
      console.error('Error processing expired subscriptions:', error);
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string, subscriptionId: string) {
    try {
      const { databases } = await createAdminClient();

      // Verify ownership
      const subscription = await databases.getDocument(
        this.databaseId,
        this.subscriptionsCollectionId,
        subscriptionId
      );

      if (subscription.userId !== userId) {
        throw new Error('Unauthorized to cancel this subscription');
      }

      await databases.updateDocument(
        this.databaseId,
        this.subscriptionsCollectionId,
        subscriptionId,
        {
          status: 'cancelled',
          autoRenew: false,
          updatedAt: new Date().toISOString()
        }
      );

      return {
        success: true,
        message: 'Subscription cancelled successfully'
      };

    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Get user's transaction history
  async getUserTransactions(userId: string, limit: number = 10) {
    try {
      const { databases } = await createAdminClient();

      const transactions = await databases.listDocuments(
        this.databaseId,
        this.transactionsCollectionId,
        [
          Query.equal('userId', userId),
          Query.orderDesc('createdAt'),
          Query.limit(limit)
        ]
      );

      return transactions.documents as unknown as Transaction[];

    } catch (error) {
      console.error('Error getting user transactions:', error);
      return [];
    }
  }
}