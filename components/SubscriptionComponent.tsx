/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { CreditCard, Check, Loader2, Crown, Star, Zap } from 'lucide-react';

// --- Type Definitions ---

/**
 * Defines the structure for a subscription plan object.
 */
interface Plan {
  id: string;
  name: string;
  price: number;
  currency: 'UGX';
  interval: 'forever' | 'monthly' | 'yearly';
  description: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  buttonColor: string;
  popular: boolean;
  savings?: string; // Optional property
}

/**
 * Defines the structure for the user's subscription status fetched from the API.
 */
interface UserStatus {
  hasActiveSubscription: boolean;
  subscription: {
    planId: string;
    endDate: string; // Assuming ISO date string
  } | null;
  requestStatus: {
    remainingRequests: number;
  } | null;
}

// --- Component ---

const SubscriptionComponent: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const router = useRouter();
  const { userId } = useAuth();

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'UGX',
      interval: 'forever',
      description: 'Perfect for trying out our service',
      features: [
        '5 requests per day',
        'Basic code generation',
        'Community support',
        'Standard response time'
      ],
      icon: <Star className="w-6 h-6" />,
      color: 'border-gray-200 bg-gray-50',
      buttonColor: 'bg-gray-600 hover:bg-gray-700',
      popular: false
    },
    {
      id: 'basic_monthly',
      name: 'Pro Monthly',
      price: 2000,
      currency: 'UGX',
      interval: 'monthly',
      description: 'Best for regular users',
      features: [
        'Unlimited requests',
        'Advanced code generation',
        'Priority support',
        'Fast response time',
        'Export conversations'
      ],
      icon: <Zap className="w-6 h-6" />,
      color: 'border-blue-200 bg-blue-50',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      popular: true
    },
    {
      id: 'basic_yearly',
      name: 'Pro Yearly',
      price: 20000,
      currency: 'UGX',
      interval: 'yearly',
      description: 'Best value - 2 months free!',
      features: [
        'Unlimited requests',
        'Advanced code generation',
        'Priority support',
        'Fastest response time',
        'Export conversations',
        '2 months free',
        'Early access to new features'
      ],
      icon: <Crown className="w-6 h-6" />,
      color: 'border-purple-200 bg-purple-50',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      popular: false,
      savings: 'UGX 4,000 saved annually'
    }
  ];

  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!userId) return;

      try {
        const response = await fetch('/api/subscription?action=status');
        if (response.ok) {
          const data: UserStatus = await response.json();
          setUserStatus(data);
        }
      } catch (err) {
        console.error('Error fetching user status:', err);
      }
    };

    fetchUserStatus();
  }, [userId]);

  const handlePlanSelect = (plan: Plan) => {
    if (plan.id === 'free') {
      setError('Free plan is already active by default');
      return;
    }
    setSelectedPlan(plan);
    setError('');
  };

  const handlePayment = async () => {
    if (!selectedPlan || !userId) {
      setError('Please select a plan and ensure you are logged in');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/subscription?action=initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          redirectUrl: `${window.location.origin}/subscription/callback`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      if (data.success && data.paymentLink) {
        sessionStorage.setItem('pendingTransaction', JSON.stringify({
          transactionId: data.transactionId,
          flutterwaveTransactionId: data.flutterwaveTransactionId,
          planId: selectedPlan.id
        }));
        window.location.href = data.paymentLink;
      } else {
        throw new Error('Failed to get payment link');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error('Payment error:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    if (price === 0) return 'Free';
    // Assuming price is in kobo/cents
    return `UGX ${(price).toLocaleString()}`;
  };

  const isPlanActive = (planId: string): boolean => {
    if (!userStatus) return false;

    if (userStatus.hasActiveSubscription && userStatus.subscription) {
      return userStatus.subscription.planId === planId;
    }

    return planId === 'free';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Unlock the full potential of AlmerGPT with our subscription plans
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-center">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-center">{success}</p>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {plans.map((plan) => {
          const isActive = isPlanActive(plan.id);
          const isSelected = selectedPlan?.id === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${isSelected
                ? 'border-blue-500 shadow-lg'
                : isActive
                  ? 'border-green-500 shadow-md'
                  : plan.color
                } ${plan.popular ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
              onClick={() => handlePlanSelect(plan)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {isActive && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Active
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">{plan.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(plan.price)}
                  </span>
                  {plan.interval !== 'forever' && (
                    <span className="text-gray-600 text-lg">/{plan.interval}</span>
                  )}
                </div>
                {plan.savings && (
                  <p className="text-green-600 text-sm font-semibold">{plan.savings}</p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  if (plan.id === 'free') {
                    setError('Free plan is already available to all users');
                    return;
                  }
                  if (isActive) {
                    router.push('/dashboard');
                    return;
                  }
                  handlePlanSelect(plan);
                }}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${isActive
                  ? 'bg-green-600 text-white cursor-default'
                  : plan.id === 'free'
                    ? 'bg-gray-400 text-white cursor-default'
                    : isSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : `${plan.buttonColor} text-white`
                  }`}
              >
                {isActive ? 'Current Plan' :
                  plan.id === 'free' ? 'Default Plan' :
                    isSelected ? 'Selected' :
                      'Select Plan'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment Section */}
      {selectedPlan && !isPlanActive(selectedPlan.id) && (
        <div className="bg-gray-50 rounded-xl p-6 border">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Complete Your Subscription
            </h3>
            <div className="bg-white rounded-lg p-6 mb-6 border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-900">{selectedPlan.name}</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(selectedPlan.price)}
                  {selectedPlan.interval !== 'forever' && (
                    <span className="text-lg text-gray-600">/{selectedPlan.interval}</span>
                  )}
                </span>
              </div>
              {selectedPlan.savings && (
                <p className="text-green-600 text-sm font-semibold mb-4">{selectedPlan.savings}</p>
              )}
            </div>
            <button
              onClick={handlePayment}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-8 rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Subscribe Now
                </>
              )}
            </button>
            <p className="text-gray-600 text-sm mt-4">
              Secure payment powered by Flutterwave
            </p>
          </div>
        </div>
      )}

      {/* Current Status */}
      {userStatus && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Your Current Status</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-blue-800">
                <span className="font-semibold">Plan:</span> {userStatus.subscription?.planId || 'Free'}
              </p>
              <p className="text-blue-800">
                <span className="font-semibold">Status:</span> {userStatus.hasActiveSubscription ? 'Active' : 'Free Tier'}
              </p>
            </div>
            <div>
              <p className="text-blue-800">
                <span className="font-semibold">Requests:</span> {
                  userStatus.requestStatus?.remainingRequests === -1
                    ? 'Unlimited'
                    : `${userStatus.requestStatus?.remainingRequests ?? 0} remaining`
                }
              </p>
              {userStatus.subscription?.endDate && (
                <p className="text-blue-800">
                  <span className="font-semibold">Expires:</span> {new Date(userStatus.subscription.endDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionComponent;