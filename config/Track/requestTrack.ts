import { Query, ID } from "node-appwrite";
import { createAdminClient } from "../appwrite";

// Request Tracker Class
export class RequestTracker {
  private databaseId: string;
  private collectionId: string;

  constructor() {
    this.databaseId = process.env.APPWRITE_DATABASE_ID!;
    this.collectionId = process.env.APPWRITE_REQUESTS_COLLECTION_ID!; // New collection for tracking
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
          userId: userId,                    // Changed from user_id to userId
          requestCount: 0,                  // Changed from request_count to requestCount
          status: true,
          createdAt: new Date().toISOString(),  // Changed from created_at to createdAt
          updatedAt: new Date().toISOString()   // Changed from updated_at to updatedAt
        }
      );

      return newRecord;
    } catch (error) {
      console.error('Error initializing user requests:', error);
      throw error;
    }
  }

  // Check if user can make a request
  async canMakeRequest(userId: string) {
    try {
      const userRecord = await this.initializeUserRequests(userId);
      return userRecord.status && userRecord.requestCount < 5;  // Changed from request_count to requestCount
    } catch (error) {
      console.error('Error checking request permission:', error);
      return false;
    }
  }

  // Track a new request
  async trackRequest(userId: string) {
    try {
      const { databases } = await createAdminClient();
      const userRecord = await this.initializeUserRequests(userId);

      // Check if user can make request
      if (!userRecord.status || userRecord.requestCount >= 5) {  // Changed from request_count to requestCount
        throw new Error('Request limit reached. Please subscribe to continue.');
      }

      const newCount = userRecord.requestCount + 1;  // Changed from request_count to requestCount
      const newStatus = newCount < 5;

      // Update the record
      await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        userRecord.$id,
        {
          requestCount: newCount,           // Changed from request_count to requestCount
          status: newStatus,
          updatedAt: new Date().toISOString()  // Changed from updated_at to updatedAt
        }
      );

      return {
        success: true,
        requestCount: newCount,
        status: newStatus,
        remainingRequests: Math.max(0, 5 - newCount)
      };
    } catch (error) {
      console.error('Error tracking request:', error);
      throw error;
    }
  }

  // Get user request status
  async getUserRequestStatus(userId: string) {
    try {
      const userRecord = await this.initializeUserRequests(userId);
      return {
        requestCount: userRecord.requestCount,  // Changed from request_count to requestCount
        status: userRecord.status,
        remainingRequests: Math.max(0, 5 - userRecord.requestCount),  // Changed from request_count to requestCount
        canMakeRequest: userRecord.status && userRecord.requestCount < 5  // Changed from request_count to requestCount
      };
    } catch (error) {
      console.error('Error getting user request status:', error);
      throw error;
    }
  }

  // Reset user requests (call this when user subscribes)
  async resetUserRequests(userId: string) {
    try {
      const { databases } = await createAdminClient();
      const userRecord = await this.initializeUserRequests(userId);

      await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        userRecord.$id,
        {
          requestCount: 0,                  // Changed from request_count to requestCount
          status: true,
          updatedAt: new Date().toISOString()  // Changed from updated_at to updatedAt
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
}