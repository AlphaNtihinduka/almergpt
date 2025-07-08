'use client';

import SubscriptionComponent from '@/components/SubscriptionComponent';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SubscriptionPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/subscription');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return <SubscriptionComponent />;
}