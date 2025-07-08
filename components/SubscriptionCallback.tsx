"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';

// --- Type Definitions ---

/**
 * Defines the possible states for the payment verification process.
 */
type VerificationStatus = 'verifying' | 'success' | 'failed';

/**
 * Defines the structure of the details object received upon successful payment verification.
 */
interface SuccessDetails {
  success: boolean;
  subscription: {
    planId: string;
    status: string;
    startDate: string; // Assumed ISO date string
    endDate: string;   // Assumed ISO date string
  };
  transaction: {
    id: string;
  };
}

// --- Component ---

const SubscriptionCallback: React.FC = () => {
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [message, setMessage] = useState<string>('Verifying your payment...');
  const [details, setDetails] = useState<SuccessDetails | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const transactionId = searchParams.get('tx_ref');
        const flutterwaveTransactionId = searchParams.get('transaction_id');
        const paymentStatus = searchParams.get('status');

        if (!transactionId || !flutterwaveTransactionId) {
          throw new Error('Missing payment reference information from URL.');
        }

        if (paymentStatus === 'cancelled') {
          setStatus('failed');
          setMessage('Your payment was cancelled. Please feel free to try again.');
          return;
        }

        if (paymentStatus === 'failed') {
          setStatus('failed');
          setMessage('The payment attempt failed. Please check your payment details and try again.');
          return;
        }

        const response = await fetch('/api/subscription?action=verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionId: transactionId,
            flutterwaveTransactionId: flutterwaveTransactionId
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Verification failed due to a server error.');
        }

        if (data.success) {
          setStatus('success');
          setMessage('Payment successful! Your subscription is now active.');
          setDetails(data as SuccessDetails);

          sessionStorage.removeItem('pendingTransaction');

          setTimeout(() => {
            router.push('/dashboard');
          }, 4000);
        } else {
          throw new Error(data.error || 'Payment could not be confirmed.');
        }

      } catch (err: unknown) {
        console.error('Payment verification error:', err);
        setStatus('failed');
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setMessage(`${errorMessage} If the issue persists, please contact support.`);
      }
    };

    if (userId) {
      verifyPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, router]);

  const handleRetry = () => {
    router.push('/subscription');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return {
          icon: <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />,
          title: 'Verifying Payment',
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-700'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          title: 'Payment Successful!',
          titleColor: 'text-green-900',
          messageColor: 'text-green-700'
        };
      case 'failed':
        return {
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          title: 'Payment Failed',
          titleColor: 'text-red-900',
          messageColor: 'text-red-700'
        };
      default:
        return {
          icon: null,
          title: '',
          titleColor: '',
          messageColor: ''
        };
    }
  };

  const { icon, title, titleColor, messageColor } = renderContent();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="mb-6">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-opacity-20 ${status === 'success' ? 'bg-green-200' : status === 'failed' ? 'bg-red-200' : 'bg-blue-200'
              }`}>
              {icon}
            </div>
          </div>

          <h2 className={`text-2xl font-bold mb-4 ${titleColor}`}>
            {title}
          </h2>

          <p className={`text-lg mb-6 ${messageColor}`}>
            {message}
          </p>

          {status === 'success' && details && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-green-900 mb-2">Subscription Details:</h3>
              <div className="space-y-1 text-sm text-green-800">
                <p><span className="font-medium">Plan:</span> {details.subscription.planId}</p>
                <p><span className="font-medium">Status:</span> {details.subscription.status}</p>
                <p><span className="font-medium">End Date:</span> {new Date(details.subscription.endDate).toLocaleDateString()}</p>
                <p><span className="font-medium">Transaction ID:</span> {details.transaction.id}</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-3">
              <button
                onClick={handleGoToDashboard}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
              <p className="text-sm text-gray-600">
                You will be redirected automatically...
              </p>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Try Another Payment
              </button>
              <button
                onClick={handleGoHome}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Return Home
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Having issues? Contact support at{' '}
            <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-800 font-medium">
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCallback;