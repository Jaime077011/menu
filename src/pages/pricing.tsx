import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { api } from "@/utils/api";

export default function PricingPage() {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  
  const { data: plans, isLoading } = api.subscription.getPlans.useQuery();

  const handleGetStarted = (planId: string) => {
    // Redirect to registration with selected plan
    router.push(`/register?plan=${planId}`);
  };

  const formatPrice = (price: number, interval: string) => {
    if (interval === "YEARLY") {
      return Math.round(price * 12 * 0.8); // 20% discount for yearly
    }
    return price;
  };

  const features = {
    STARTER: [
      "1 Restaurant Location",
      "Up to 50 Menu Items",
      "100 Orders per Month",
      "2 Admin Users",
      "AI Waiter Assistant",
      "QR Code Ordering",
      "Basic Analytics",
      "Email Support",
      "14-Day Free Trial"
    ],
    PROFESSIONAL: [
      "3 Restaurant Locations",
      "Up to 200 Menu Items", 
      "1,000 Orders per Month",
      "5 Admin Users",
      "Advanced AI Waiter",
      "Custom Branding",
      "Advanced Analytics",
      "Priority Support",
      "Multi-Language Support",
      "14-Day Free Trial"
    ],
    ENTERPRISE: [
      "Unlimited Locations",
      "Unlimited Menu Items",
      "Unlimited Orders",
      "Unlimited Admin Users",
      "Premium AI Features",
      "White-Label Solution",
      "Custom Integrations",
      "Dedicated Support",
      "Advanced Security",
      "Custom Onboarding"
    ]
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Pricing Plans - AI Menu Assistant</title>
        <meta name="description" content="Choose the perfect plan for your restaurant's AI-powered ordering system" />
      </Head>

      <div className="bg-white">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-800">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
                Start your free trial today. No setup fees, no hidden costs. 
                Scale your restaurant with our AI-powered ordering system.
              </p>
              
              {/* Billing Toggle */}
              <div className="flex items-center justify-center space-x-4 mb-8">
                <span className={`text-sm ${billingInterval === 'MONTHLY' ? 'text-white' : 'text-indigo-300'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingInterval(billingInterval === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      billingInterval === 'YEARLY' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm ${billingInterval === 'YEARLY' ? 'text-white' : 'text-indigo-300'}`}>
                  Yearly
                  <span className="ml-1 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                    Save 20%
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="relative -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans?.map((plan, index) => {
              const isPopular = plan.name === 'PROFESSIONAL';
              const planFeatures = features[plan.name as keyof typeof features] || [];
              
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl shadow-xl ${
                    isPopular 
                      ? 'bg-gradient-to-b from-indigo-50 to-white border-2 border-indigo-500 transform scale-105' 
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="p-8">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.displayName}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {plan.description}
                      </p>
                      
                      <div className="mb-6">
                        <span className="text-5xl font-bold text-gray-900">
                          ${formatPrice(Number(plan.price), billingInterval)}
                        </span>
                        <span className="text-gray-600 ml-2">
                          /{billingInterval === 'MONTHLY' ? 'month' : 'year'}
                        </span>
                        {billingInterval === 'YEARLY' && (
                          <div className="text-sm text-green-600 mt-1">
                            Save ${Math.round(Number(plan.price) * 12 * 0.2)} per year
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleGetStarted(plan.id)}
                        className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                          isPopular
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        Start Free Trial
                      </button>
                      
                      <p className="text-sm text-gray-500 mt-3">
                        14-day free trial • No credit card required
                      </p>
                    </div>
                    
                    <div className="mt-8">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">
                        Everything included:
                      </h4>
                      <ul className="space-y-3">
                        {planFeatures.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start">
                            <svg className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600">
                Have questions? We have answers.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  How does the free trial work?
                </h3>
                <p className="text-gray-600">
                  Start with a 14-day free trial with full access to all features. 
                  No credit card required to begin.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Can I change plans later?
                </h3>
                <p className="text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time. 
                  Changes are prorated automatically.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600">
                  We accept all major credit cards and ACH bank transfers 
                  through our secure payment processor.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Is there a setup fee?
                </h3>
                <p className="text-gray-600">
                  No setup fees, no hidden costs. The price you see is 
                  exactly what you'll pay.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-indigo-600 py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to transform your restaurant?
            </h2>
            <p className="text-indigo-100 mb-8 text-lg">
              Join hundreds of restaurants already using our AI-powered ordering system.
            </p>
            <button
              onClick={() => router.push('/register')}
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Start Your Free Trial
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 