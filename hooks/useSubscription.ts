"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription: any;
  requestStatus: any;
  loading: boolean;
  error: string | null;
}

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    subscription: null,
    requestStatus: null,
    loading: true,
    error: null
  });

  const { userId } = useAuth();

  useEffect(() => {
    const fetchStatus = async () => {
      if (!userId) {
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const response = await fetch('/api/subscription?action=status');

        if (!response.ok) {
          throw new Error('Failed to fetch subscription status');
        }

        const data = await response.json();

        setStatus({
          hasActiveSubscription: data.hasActiveSubscription,
          subscription: data.subscription,
          requestStatus: data.requestStatus,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };

    fetchStatus();
  }, [userId]);

  const refetch = () => {
    setStatus(prev => ({ ...prev, loading: true }));
    // Re-trigger the effect
    const event = new CustomEvent('refetch-subscription');
    window.dispatchEvent(event);
  };

  return { ...status, refetch };
}