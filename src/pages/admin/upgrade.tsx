import React, { useState } from "react";
import { GetServerSideProps } from "next";
import { getAdminSessionFromCookies } from "@/utils/auth";
import { api } from "@/utils/api";
import AdminLayout from "@/components/AdminLayout";
import { loadStripe } from "@stripe/stripe-js";
import { env } from "@/env.js";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  CheckIcon, 
  XMarkIcon, 
  ArrowUpIcon,
  StarIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  UserGroupIcon,
  GlobeAltIcon,
  CogIcon
} from "@heroicons/react/24/outline";

// Initialize Stripe
const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface UpgradePageProps {
  restaurantId: string;
}

export default function UpgradePage({ restaurantId }: UpgradePageProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { theme, actualTheme } = useTheme();

  // API calls
  const { data: plans } = api.subscription.getPlans.useQuery();
  const { data: currentSubscription, refetch: refetchSubscription } = 
    api.subscription.getCurrentSubscription.useQuery();
  const { data: features } = api.subscription.getFeatures.useQuery();

  const createCheckoutSession = api.subscription.createCheckoutSession.useMutation();
  const changePlan = api.subscription.changePlan.useMutation();

  const handleUpgrade = async (planName: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setSelectedPlan(planName);

    try {
      // If user has an active subscription, change plan
      if (currentSubscription?.status === 'ACTIVE') {
        await changePlan.mutateAsync({
          newPlanName: planName as "STARTER" | "PROFESSIONAL" | "ENTERPRISE",
        });
        
        await refetchSubscription();
        alert("Plan upgraded successfully!");
        
      } else {
        // If no active subscription, create new checkout session
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe not loaded");

        const result = await createCheckoutSession.mutateAsync({
          restaurantId,
          planName: planName as "STARTER" | "PROFESSIONAL" | "ENTERPRISE",
          successUrl: `${window.location.origin}/admin/upgrade?success=true`,
          cancelUrl: `${window.location.origin}/admin/upgrade?canceled=true`,
          trialDays: 14,
        });

        if (result.clientSecret) {
          console.log("Subscription created:", result);
          await refetchSubscription();
        }
      }

    } catch (error) {
      console.error("Error upgrading plan:", error);
      alert("Failed to upgrade plan. Please try again.");
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const formatCurrency = (amount: number | string | any, currency = "USD") => {
    // Convert Prisma Decimal to number
    const numericAmount = typeof amount === 'object' && amount.toNumber ? amount.toNumber() : Number(amount);
    
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(numericAmount);
  };

  const getCurrentPlanName = () => {
    return currentSubscription?.plan?.displayName || "Trial";
  };

  const isCurrentPlan = (planName: string) => {
    return getCurrentPlanName().toLowerCase() === planName.toLowerCase();
  };

  const planFeatures = {
    starter: [
      { name: "1 Restaurant Location", included: true },
      { name: "Up to 50 Menu Items", included: true },
      { name: "Basic AI Waiter", included: true },
      { name: "QR Code Ordering", included: true },
      { name: "Basic Analytics", included: true },
      { name: "Email Support", included: true },
      { name: "Custom AI Personality", included: false },
      { name: "Advanced Analytics", included: false },
      { name: "Phone Support", included: false },
      { name: "Custom Branding", included: false },
      { name: "Multi-Location Management", included: false },
      { name: "Staff Management", included: false },
      { name: "API Access", included: false },
      { name: "White Label", included: false }
    ],
    professional: [
      { name: "Up to 3 Restaurant Locations", included: true },
      { name: "Up to 200 Menu Items", included: true },
      { name: "Basic AI Waiter", included: true },
      { name: "QR Code Ordering", included: true },
      { name: "Basic Analytics", included: true },
      { name: "Email Support", included: true },
      { name: "Custom AI Personality", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Phone Support", included: true },
      { name: "Custom Branding", included: true },
      { name: "Multi-Location Management", included: false },
      { name: "Staff Management", included: false },
      { name: "API Access", included: false },
      { name: "White Label", included: false }
    ],
    enterprise: [
      { name: "Unlimited Restaurant Locations", included: true },
      { name: "Unlimited Menu Items", included: true },
      { name: "Basic AI Waiter", included: true },
      { name: "QR Code Ordering", included: true },
      { name: "Basic Analytics", included: true },
      { name: "Email Support", included: true },
      { name: "Custom AI Personality", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Phone Support", included: true },
      { name: "Custom Branding", included: true },
      { name: "Multi-Location Management", included: true },
      { name: "Staff Management", included: true },
      { name: "API Access", included: true },
      { name: "White Label", included: true },
      { name: "Priority Support", included: true },
      { name: "Dedicated Account Manager", included: true }
    ]
  };

  const planIcons = {
    starter: <ChartBarIcon className="h-8 w-8" />,
    professional: <UserGroupIcon className="h-8 w-8" />,
    enterprise: <GlobeAltIcon className="h-8 w-8" />
  };

  return (
    <>
      <style jsx global>{`
        * {
          scrollbar-width: thin !important;
          scrollbar-color: ${actualTheme === 'dark' ? '#f97316 #111827' : '#f97316 #f3f4f6'} !important;
        }
        *::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
        }
        *::-webkit-scrollbar-track {
          background: ${actualTheme === 'dark' ? '#111827' : '#f3f4f6'} !important;
          border-radius: 4px !important;
        }
        *::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #f97316, #eab308) !important;
          border-radius: 4px !important;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #ea580c, #ca8a04) !important;
        }
        html, body {
          color-scheme: ${actualTheme === 'dark' ? 'dark' : 'light'} !important;
        }
      `}</style>

            <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-700 rounded-xl flex items-center justify-center">
                <ArrowUpIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-4xl font-mono font-bold bg-gradient-to-r ${actualTheme === 'dark' ? 'from-white via-amber-200 to-orange-200' : 'from-gray-900 via-amber-700 to-orange-700'} bg-clip-text text-transparent`}>
                  CHOOSE YOUR PLAN
                </h1>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono text-lg`}>
                  Upgrade your restaurant's capabilities with our powerful features
                </p>
              </div>
            </div>
            {currentSubscription && (
              <div className="mt-6 inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-amber-600/20 to-orange-700/20 border border-amber-600/30 text-amber-300 font-mono font-bold">
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                CURRENTLY ON {getCurrentPlanName().toUpperCase()} PLAN
              </div>
            )}
          </div>

          {/* Plan Comparison */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {plans?.map((plan) => {
              const planKey = plan.displayName.toLowerCase() as keyof typeof planFeatures;
              const features = planFeatures[planKey] || [];
              const isRecommended = plan.displayName === "Professional";
              const isCurrent = isCurrentPlan(plan.displayName);
              
              return (
                <div
                  key={plan.id}
                  className={`relative ${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100/50'} backdrop-blur-sm rounded-2xl border transition-all hover:scale-105 ${
                    isRecommended ? 'border-amber-600/50 shadow-[0_0_30px_rgba(217,119,6,0.3)] bg-gradient-to-br from-amber-600/10 to-orange-700/10' : actualTheme === 'dark' ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                  } ${isCurrent ? 'opacity-75' : ''}`}
                >
                  {isRecommended && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-600 to-orange-700 text-white text-sm font-mono font-bold shadow-[0_0_15px_rgba(217,119,6,0.3)]">
                        <StarIcon className="h-4 w-4 mr-1" />
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Plan Header */}
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                        isRecommended ? 'bg-gradient-to-r from-amber-600/20 to-orange-700/20 border border-amber-600/30 text-amber-400' : actualTheme === 'dark' ? 'bg-gray-800/50 border border-gray-700 text-gray-400' : 'bg-gray-200/50 border border-gray-300 text-gray-600'
                      }`}>
                        {planIcons[planKey]}
                      </div>
                      <h3 className={`text-2xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{plan.displayName.toUpperCase()}</h3>
                      <p className={`mt-2 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>{plan.description}</p>
                    </div>

                    {/* Pricing */}
                    <div className="mt-6 text-center">
                      <div className="text-4xl font-mono font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                        {formatCurrency(plan.price)}
                        <span className={`text-lg font-normal ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>/month</span>
                      </div>
                      {plan.displayName !== "Enterprise" && (
                        <p className="mt-1 text-sm text-amber-500 font-mono">14-DAY FREE TRIAL</p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="mt-8">
                      <ul className="space-y-3">
                        {features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <div className="flex-shrink-0">
                              {feature.included ? (
                                <CheckIcon className="h-5 w-5 text-green-500" />
                              ) : (
                                <XMarkIcon className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                            <span className={`ml-3 text-sm font-mono ${
                              feature.included ? (actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700') : (actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400')
                            }`}>
                              {feature.name.toUpperCase()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <div className="mt-8">
                      {isCurrent ? (
                        <div className="w-full flex items-center justify-center px-4 py-3 border border-green-500/30 bg-green-500/20 rounded-lg text-green-500 font-mono font-bold hover:bg-green-500/30 hover:border-green-500/50 transition-all duration-300">
                          <CheckIcon className="h-5 w-5 mr-2" />
                          CURRENT PLAN
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUpgrade(plan.displayName)}
                          disabled={isProcessing}
                          className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-mono font-bold transition-all duration-300 ${
                            isRecommended
                              ? 'bg-amber-500/20 text-amber-500 border border-amber-400/30 hover:bg-amber-500/30 hover:border-amber-400/50'
                              : 'bg-blue-500/20 text-blue-500 border border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isProcessing && selectedPlan === plan.displayName ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              PROCESSING...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              {currentSubscription?.status === 'ACTIVE' ? (
                                <>
                                  <ArrowUpIcon className="h-4 w-4 mr-2" />
                                  UPGRADE TO {plan.displayName.toUpperCase()}
                                </>
                              ) : (
                                <>
                                  <CreditCardIcon className="h-4 w-4 mr-2" />
                                  START {plan.displayName.toUpperCase()} TRIAL
                                </>
                              )}
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
              </div>
            );
          })}
        </div>

          {/* Feature Comparison Table */}
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100/50 border-gray-200'} backdrop-blur-sm border rounded-xl overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                <span className="bg-gradient-to-r from-green-500 to-cyan-600 text-white text-sm rounded-full w-8 h-8 inline-flex items-center justify-center font-bold">📊</span>
                DETAILED FEATURE COMPARISON
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${actualTheme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead className={`${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      FEATURE
                    </th>
                    <th className={`px-6 py-3 text-center text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      STARTER
                    </th>
                    <th className={`px-6 py-3 text-center text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      PROFESSIONAL
                    </th>
                    <th className={`px-6 py-3 text-center text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                      ENTERPRISE
                    </th>
                  </tr>
                </thead>
                <tbody className={`${actualTheme === 'dark' ? 'bg-gray-900/30 divide-gray-700' : 'bg-gray-50/30 divide-gray-200'}`}>
                  {planFeatures.starter.map((feature, index) => (
                    <tr key={index} className={`${actualTheme === 'dark' ? 'hover:bg-gray-800/30' : 'hover:bg-gray-100/30'} transition-colors`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {feature.name.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {planFeatures.starter[index]?.included ? (
                          <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {planFeatures.professional[index]?.included ? (
                          <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {planFeatures.enterprise[index]?.included ? (
                          <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100/50 border-gray-200'} backdrop-blur-sm border rounded-xl`}>
            <div className={`px-6 py-4 border-b ${actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-full w-8 h-8 inline-flex items-center justify-center font-bold">❓</span>
                FREQUENTLY ASKED QUESTIONS
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50/30 border-gray-200'} border rounded-lg p-4`}>
                  <h4 className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'}`}>CAN I CHANGE MY PLAN ANYTIME?</h4>
                  <p className={`mt-2 text-sm ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono`}>
                    Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                    and we'll prorate your billing accordingly.
                  </p>
                </div>
                <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50/30 border-gray-200'} border rounded-lg p-4`}>
                  <h4 className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'}`}>WHAT HAPPENS DURING THE FREE TRIAL?</h4>
                  <p className={`mt-2 text-sm ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono`}>
                    You get full access to all features of your selected plan for 14 days. 
                    No credit card required. You can cancel anytime during the trial.
                  </p>
                </div>
                <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50/30 border-gray-200'} border rounded-lg p-4`}>
                  <h4 className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'}`}>IS THERE A SETUP FEE?</h4>
                  <p className={`mt-2 text-sm ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono`}>
                    No setup fees. Just pay the monthly subscription fee. 
                    All features and support are included in your plan price.
                  </p>
                </div>
                <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50/30 border-gray-200'} border rounded-lg p-4`}>
                  <h4 className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'}`}>WHAT IF I NEED MORE THAN THE ENTERPRISE PLAN OFFERS?</h4>
                  <p className={`mt-2 text-sm ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono`}>
                    Contact our sales team for custom enterprise solutions. 
                    We can create a plan tailored to your specific needs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = context.req.headers.cookie || "";
  const session = getAdminSessionFromCookies(cookies);

  if (!session?.restaurantId) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      restaurantId: session.restaurantId,
    },
  };
};