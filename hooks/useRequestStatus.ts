/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useRequestStatus.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

// Define the type for request status
export type RequestStatus = {
  status: boolean;
  remainingRequests: number;
  requestCount: number;
  canMakeRequest: boolean;
};

export const useRequestStatus = () => {
  const [requestStatus, setRequestStatus] = useState<RequestStatus>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Function to fetch request status
  const fetchRequestStatus = useCallback(async (signal?: AbortSignal) => {
    if (!isLoaded || !user?.id) return;

    try {
      setError(null);

      const response = await fetch('/api/user/request-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const status = await response.json();

      // Validate the response structure
      if (!status || typeof status !== 'object') {
        throw new Error('Invalid response format from request tracker');
      }

      if (
        typeof status.status !== 'boolean' ||
        typeof status.remainingRequests !== 'number' ||
        typeof status.requestCount !== 'number' ||
        typeof status.canMakeRequest !== 'boolean'
      ) {
        throw new Error('Invalid response structure from request tracker');
      }

      setRequestStatus(status);
    } catch (err: any) {
      if (err.name === 'AbortError') return; // Ignore aborted requests

      console.error('Error fetching request status:', err);

      if (err.message?.includes('fetch')) {
        setError('Network error - please check your connection');
      } else if (err.message?.includes('unauthorized') || err.message?.includes('authentication')) {
        setError('Authentication failed - please try logging in again');
      } else if (err.message?.includes('rate limit')) {
        setError('Too many requests - please wait a moment');
      } else {
        setError(`Request failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user?.id]);

  // Function to track a new request and update status
  const trackRequest = useCallback(async () => {
    if (!isLoaded || !user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/user/request-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Update the request status immediately
      setRequestStatus(prev => prev ? {
        ...prev,
        requestCount: result.requestCount,
        status: result.status,
        remainingRequests: result.remainingRequests,
        canMakeRequest: result.status && result.requestCount < 5
      } : undefined);

      return result;
    } catch (error) {
      console.error('Error tracking request:', error);
      throw error;
    }
  }, [isLoaded, user?.id]);

  // Function to manually refresh status
  const refreshStatus = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    fetchRequestStatus(abortControllerRef.current.signal);
  }, [fetchRequestStatus]);

  // Start polling for real-time updates
  const startPolling = useCallback((intervalMs: number = 30000) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      fetchRequestStatus(abortControllerRef.current.signal);
    }, intervalMs);
  }, [fetchRequestStatus]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Initial fetch and setup polling
  useEffect(() => {
    if (!isLoaded) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    fetchRequestStatus(abortControllerRef.current.signal);

    // Start polling every 30 seconds
    startPolling(30000);

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [isLoaded, user?.id, fetchRequestStatus, startPolling, stopPolling]);

  // Handle visibility change to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling(30000);
        refreshStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startPolling, stopPolling, refreshStatus]);

  return {
    requestStatus,
    loading,
    error,
    trackRequest,
    refreshStatus,
    startPolling,
    stopPolling
  };
};