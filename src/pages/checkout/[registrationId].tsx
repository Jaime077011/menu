import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { db } from '@/server/db';

// Simple currency formatter
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

interface CheckoutProps {
  registration: {
    id: string;
    email: string;
    restaurantName: string;
    ownerName: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    subdomain: string;
    selectedPlan: string;
    status: string;
    verifiedAt: string | null;
    createdAt: string;
  };
  plan: {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    price: number;
    billingInterval: string;
    features: string[];
    maxMenuItems: number;
    maxOrders: number;
    maxUsers: number;
  };
}

export default function CheckoutPage({ registration, plan }: CheckoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not verified
  useEffect(() => {
    if (registration.status !== 'VERIFIED') {
      router.push('/register');
    }
  }, [registration.status, router]);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-onboarding-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: registration.id,
          planId: plan.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
      setIsLoading(false);
    }
  };

  const formatFeatures = (features: string[]) => {
    try {
      return Array.isArray(features) ? features : JSON.parse(features);
    } catch {
      return [];
    }
  };

  return (
    <>
      <Head>
        <title>Complete Your Subscription - {registration.restaurantName}</title>
        <meta name="description" content="Complete your restaurant subscription setup" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Complete Your Subscription
            </h1>
            <p className="text-xl text-gray-600">
              You're just one step away from launching your AI-powered restaurant!
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Restaurant Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Restaurant Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant Name
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {registration.restaurantName}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner
                  </label>
                  <div className="text-gray-900">{registration.ownerName}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="text-gray-900">{registration.email}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subdomain
                  </label>
                  <div className="text-blue-600 font-mono">
                    {registration.subdomain}.yourdomain.com
                  </div>
                </div>

                {registration.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <div className="text-gray-900">
                      {registration.address}
                      {registration.city && `, ${registration.city}`}
                      {registration.state && `, ${registration.state}`}
                      {registration.zipCode && ` ${registration.zipCode}`}
                    </div>
                  </div>
                )}
              </div>

              {/* Verification Status */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800 font-medium">Email Verified</span>
                </div>
              </div>
            </div>

            {/* Plan Details & Payment */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Subscription Plan</h2>
              
              {/* Plan Card */}
              <div className="border-2 border-blue-200 rounded-xl p-6 mb-6">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.displayName}</h3>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-blue-600">
                    {formatCurrency(plan.price)}
                  </div>
                  <div className="text-gray-500">
                    per {plan.billingInterval.toLowerCase()}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Features included:</h4>
                  {formatFeatures(plan.features).map((feature: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limits */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{plan.maxMenuItems}</div>
                      <div className="text-sm text-gray-500">Menu Items</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{plan.maxOrders}</div>
                      <div className="text-sm text-gray-500">Orders/Month</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{plan.maxUsers}</div>
                      <div className="text-sm text-gray-500">Admin Users</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trial Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-blue-900">14-Day Free Trial</h4>
                    <p className="text-blue-800 text-sm mt-1">
                      Start your free trial today. You won't be charged until after the trial period ends.
                      Cancel anytime during the trial with no fees.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-red-900">Payment Error</h4>
                      <p className="text-red-800 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  'Start Free Trial & Complete Setup'
                )}
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                Secure payment processing by Stripe
              </p>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                What happens after payment?
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Instant Setup</h3>
                  <p className="text-gray-600 text-sm">
                    Your restaurant account and admin dashboard are created automatically
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Welcome Email</h3>
                  <p className="text-gray-600 text-sm">
                    Receive login credentials and setup instructions via email
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Start Using</h3>
                  <p className="text-gray-600 text-sm">
                    Access your dashboard, customize your menu, and go live!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { registrationId } = context.params!;

  if (!registrationId || typeof registrationId !== 'string') {
    return { notFound: true };
  }

  try {
    const registration = await db.restaurantRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      return { notFound: true };
    }

    // Get plan details
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: registration.selectedPlan },
    });

    if (!plan) {
      return { notFound: true };
    }

    return {
      props: {
        registration: {
          id: registration.id,
          email: registration.email,
          restaurantName: registration.restaurantName,
          ownerName: registration.ownerName,
          phone: registration.phone,
          address: registration.address,
          city: registration.city,
          state: registration.state,
          zipCode: registration.zipCode,
          subdomain: registration.subdomain,
          selectedPlan: registration.selectedPlan,
          status: registration.status,
          createdAt: registration.createdAt.toISOString(),
          verifiedAt: registration.verifiedAt?.toISOString() || null,
        },
        plan: {
          id: plan.id,
          name: plan.name,
          displayName: plan.displayName,
          description: plan.description,
          price: Number(plan.price),
          billingInterval: plan.billingInterval,
          maxMenuItems: plan.maxMenuItems,
          maxOrders: plan.maxOrders,
          maxUsers: plan.maxUsers,
          features: JSON.parse(plan.features as string),
        },
      },
    };
  } catch (error) {
    console.error('Error fetching registration:', error);
    return { notFound: true };
  }
}; 