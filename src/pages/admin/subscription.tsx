import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { getAdminSessionFromCookies } from "@/utils/auth";
import { api } from "@/utils/api";
import { loadStripe } from "@stripe/stripe-js";
import { env } from "@/env.js";
import AdminLayout from "@/components/AdminLayout";
import { useTheme } from "@/contexts/ThemeContext";

// Initialize Stripe
const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface SubscriptionPageProps {
  restaurantId: string;
}

export default function SubscriptionPage({ restaurantId }: SubscriptionPageProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { theme, actualTheme } = useTheme();

  // API calls
  const { data: plans } = api.subscription.getPlans.useQuery();
  const { data: currentSubscription, refetch: refetchSubscription } = 
    api.subscription.getCurrentSubscription.useQuery();
  const { data: features } = api.subscription.getFeatures.useQuery();
  const { data: billingHistory } = api.subscription.getBillingHistory.useQuery();
  const { data: upcomingInvoice } = api.subscription.getUpcomingInvoice.useQuery();

  const createCheckoutSession = api.subscription.createCheckoutSession.useMutation();
  const createBillingPortal = api.subscription.createBillingPortal.useMutation();
  const cancelSubscription = api.subscription.cancel.useMutation();
  const reactivateSubscription = api.subscription.reactivate.useMutation();

  const handleSubscribe = async (planName: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setSelectedPlan(planName);

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe not loaded");

      const result = await createCheckoutSession.mutateAsync({
        restaurantId,
        planName: planName as "STARTER" | "PROFESSIONAL" | "ENTERPRISE",
        successUrl: `${window.location.origin}/admin/subscription?success=true`,
        cancelUrl: `${window.location.origin}/admin/subscription?canceled=true`,
        trialDays: 14,
      });

      if (result.clientSecret) {
        console.log("Subscription created:", result);
        await refetchSubscription();
      }

    } catch (error) {
      console.error("Error creating subscription:", error);
      alert("Failed to create subscription. Please try again.");
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleManageBilling = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);

    try {
      const result = await createBillingPortal.mutateAsync({
        returnUrl: `${window.location.origin}/admin/subscription`,
      });

      window.location.href = result.url;

    } catch (error) {
      console.error("Error creating billing portal:", error);
      alert("Failed to open billing portal. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? It will remain active until the end of your billing period.")) {
      return;
    }

    setIsProcessing(true);

    try {
      await cancelSubscription.mutateAsync({
        cancelAtPeriodEnd: true,
        reason: "User requested cancellation",
      });

      await refetchSubscription();
      alert("Subscription cancelled successfully. It will remain active until the end of your billing period.");

    } catch (error) {
      console.error("Error cancelling subscription:", error);
      alert("Failed to cancel subscription. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!confirm("Are you sure you want to reactivate your subscription?")) {
      return;
    }

    setIsProcessing(true);

    try {
      await reactivateSubscription.mutateAsync();
      await refetchSubscription();
      alert("Subscription reactivated successfully!");

    } catch (error) {
      console.error("Error reactivating subscription:", error);
      alert("Failed to reactivate subscription. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle success/cancel redirects
  useEffect(() => {
    const { success, canceled } = router.query;
    
    if (success) {
      refetchSubscription();
      router.replace("/admin/subscription", undefined, { shallow: true });
    }
    
    if (canceled) {
      router.replace("/admin/subscription", undefined, { shallow: true });
    }
  }, [router.query, refetchSubscription, router]);

  const formatCurrency = (amount: number | string | any, currency = "USD") => {
    const numericAmount = typeof amount === 'object' && amount.toNumber ? amount.toNumber() : Number(amount);
    
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(numericAmount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return "text-green-300 bg-green-500/20 border border-green-500/30";
      case 'trialing':
        return "text-amber-300 bg-amber-600/20 border border-amber-600/30";
      case 'canceled':
        return "text-red-300 bg-red-500/20 border border-red-500/30";
      case 'past_due':
        return "text-yellow-300 bg-yellow-500/20 border border-yellow-500/30";
      default:
        return "text-gray-300 bg-gray-500/20 border border-gray-500/30";
    }
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
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-3xl font-mono font-bold bg-gradient-to-r ${actualTheme === 'dark' ? 'from-white to-amber-200' : 'from-gray-900 to-amber-700'} bg-clip-text text-transparent`}>
                SUBSCRIPTION MANAGEMENT
              </h1>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                Manage your restaurant subscription plan and billing information
              </p>
            </div>
          </div>

          {/* Current Subscription Status */}
          {currentSubscription && (
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100/50 border-gray-200'} backdrop-blur-sm border rounded-xl`}>
              <div className={`px-6 py-4 border-b ${actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <span className="bg-gradient-to-r from-amber-600 to-orange-700 text-white text-sm rounded-full w-8 h-8 inline-flex items-center justify-center font-bold">✓</span>
                  CURRENT SUBSCRIPTION
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`text-lg font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {currentSubscription.plan?.displayName || "TRIAL"}
                    </h3>
                    <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                      {currentSubscription.plan?.description || "14-day free trial"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-mono font-bold ${getStatusColor(currentSubscription.status)}`}>
                      {currentSubscription.status}
                    </span>
                    {currentSubscription.plan && (
                      <p className={`text-2xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mt-1`}>
                        {formatCurrency(currentSubscription.plan.price)}/{currentSubscription.plan.billingInterval}
                      </p>
                    )}
                  </div>
                </div>

                {currentSubscription.isTrialActive && currentSubscription.trialEndsAt && (
                  <div className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className={`text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>TRIAL PERIOD ACTIVE</h3>
                        <p className={`text-sm font-mono ${actualTheme === 'dark' ? 'text-amber-200' : 'text-amber-600'}`}>
                          Your trial ends on {formatDate(currentSubscription.trialEndsAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {currentSubscription.currentPeriodEnd && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100/50 border-gray-200'} border rounded-lg p-4`}>
                      <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>CURRENT PERIOD</p>
                      <p className={`font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {formatDate(currentSubscription.currentPeriodStart!)} - {formatDate(currentSubscription.currentPeriodEnd)}
                      </p>
                    </div>
                    {upcomingInvoice && (
                      <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100/50 border-gray-200'} border rounded-lg p-4`}>
                        <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>NEXT BILLING</p>
                        <p className={`font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(upcomingInvoice.amount)} on {formatDate(upcomingInvoice.periodEnd)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-4">
                  {currentSubscription.status === "ACTIVE" && (
                    <>
                      <button
                        onClick={handleManageBilling}
                        disabled={isProcessing}
                        className="bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-mono font-bold disabled:opacity-50 transition-all duration-300 shadow-[0_0_15px_rgba(217,119,6,0.3)]"
                      >
                        {isProcessing ? "LOADING..." : "MANAGE BILLING"}
                      </button>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={isProcessing}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-mono font-bold disabled:opacity-50 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                      >
                        CANCEL SUBSCRIPTION
                      </button>
                    </>
                  )}
                  
                  {currentSubscription.cancelAtPeriodEnd && (
                    <button
                      onClick={handleReactivateSubscription}
                      disabled={isProcessing}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-mono font-bold disabled:opacity-50 transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    >
                      REACTIVATE SUBSCRIPTION
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Available Plans */}
          {(!currentSubscription || currentSubscription.status !== "ACTIVE") && plans && (
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100/50 border-gray-200'} backdrop-blur-sm border rounded-xl`}>
              <div className={`px-6 py-4 border-b ${actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm rounded-full w-8 h-8 inline-flex items-center justify-center font-bold">📋</span>
                  CHOOSE YOUR PLAN
                </h2>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Select the plan that best fits your restaurant needs</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border rounded-xl p-6 backdrop-blur-sm transition-all hover:scale-105 ${
                        plan.name === "PROFESSIONAL" 
                          ? "border-amber-600/50 bg-gradient-to-br from-amber-600/10 to-orange-700/10 shadow-[0_0_30px_rgba(217,119,6,0.3)]" 
                          : actualTheme === 'dark' 
                            ? "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                            : "border-gray-200 bg-gray-50/50 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-center">
                        <h3 className={`text-xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{plan.displayName}</h3>
                        <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono mt-2`}>{plan.description}</p>
                        <div className="mt-4">
                          <span className="text-4xl font-mono font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                            {formatCurrency(plan.price)}
                          </span>
                          <span className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>/{plan.billingInterval}</span>
                        </div>
                      </div>

                      <div className="mt-6">
                        <ul className="space-y-3">
                          <li className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                            <span className={`text-sm ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono`}>
                              {plan.maxLocations === -1 ? "UNLIMITED" : plan.maxLocations} LOCATION{plan.maxLocations !== 1 ? "S" : ""}
                            </span>
                          </li>
                          <li className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                            <span className={`text-sm ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono`}>
                              {plan.maxMenuItems === -1 ? "UNLIMITED" : plan.maxMenuItems} MENU ITEMS
                            </span>
                          </li>
                        </ul>
                      </div>

                      <div className="mt-6">
                        <button
                          onClick={() => handleSubscribe(plan.name)}
                          disabled={isProcessing || selectedPlan === plan.name}
                          className={`w-full py-3 px-4 rounded-lg font-mono font-bold transition-all duration-300 ${
                            plan.name === "PROFESSIONAL"
                              ? "bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white shadow-[0_0_20px_rgba(217,119,6,0.3)]"
                              : actualTheme === 'dark'
                                ? "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white shadow-[0_0_15px_rgba(107,114,128,0.3)]"
                                : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white shadow-[0_0_15px_rgba(107,114,128,0.3)]"
                          } disabled:opacity-50`}
                        >
                          {isProcessing && selectedPlan === plan.name
                            ? "PROCESSING..."
                            : "START 14-DAY TRIAL"
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Usage & Features */}
          {features && (
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100/50 border-gray-200'} backdrop-blur-sm border rounded-xl`}>
              <div className={`px-6 py-4 border-b ${actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <span className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-sm rounded-full w-8 h-8 inline-flex items-center justify-center font-bold">📈</span>
                  USAGE & FEATURES
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100/50 border-gray-200'} border rounded-lg p-4`}>
                    <h3 className={`font-mono font-bold ${actualTheme === 'dark' ? 'text-amber-300' : 'text-amber-600'} mb-3`}>CURRENT USAGE</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm font-mono mb-1">
                          <span className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>MENU ITEMS</span>
                          <span className={`${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{features.usage.menuItems.current} / {features.usage.menuItems.limit === -1 ? "∞" : features.usage.menuItems.limit}</span>
                        </div>
                        <div className={`w-full ${actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded-full h-2`}>
                          <div
                            className="bg-gradient-to-r from-amber-600 to-orange-700 h-2 rounded-full"
                            style={{
                              width: features.usage.menuItems.limit === -1 ? "20%" : `${Math.min((features.usage.menuItems.current / features.usage.menuItems.limit) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100/50 border-gray-200'} border rounded-lg p-4`}>
                    <h3 className={`font-mono font-bold ${actualTheme === 'dark' ? 'text-green-300' : 'text-green-600'} mb-3`}>AVAILABLE FEATURES</h3>
                    <div className="space-y-2">
                      {Object.entries(features.features as Record<string, boolean>).map(([feature, enabled]) => (
                        <div key={feature} className="flex items-center">
                          {enabled ? (
                            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                            </svg>
                          )}
                          <span className={`text-sm font-mono capitalize ${enabled ? (actualTheme === 'dark' ? "text-gray-300" : "text-gray-700") : (actualTheme === 'dark' ? "text-gray-500" : "text-gray-400")}`}>
                            {feature.replace(/([A-Z])/g, " $1").toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing History */}
          {billingHistory && billingHistory.length > 0 && (
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100/50 border-gray-200'} backdrop-blur-sm border rounded-xl`}>
              <div className={`px-6 py-4 border-b ${actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-full w-8 h-8 inline-flex items-center justify-center font-bold">📊</span>
                  BILLING HISTORY
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className={`${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/80'}`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                        DATE
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                        DESCRIPTION
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                        AMOUNT
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                        STATUS
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                        INVOICE
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${actualTheme === 'dark' ? 'bg-gray-900/30 divide-gray-700' : 'bg-gray-50/30 divide-gray-200'} divide-y`}>
                    {billingHistory.map((invoice) => (
                      <tr key={invoice.id} className={`${actualTheme === 'dark' ? 'hover:bg-gray-800/30' : 'hover:bg-gray-100/30'} transition-colors`}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {formatDate(invoice.date)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {invoice.description}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-mono font-bold rounded-full ${
                            invoice.status === "paid" 
                              ? "bg-green-500/20 text-green-500 border border-green-400/30"
                              : invoice.status === "open"
                              ? "bg-yellow-500/20 text-yellow-500 border border-yellow-400/30"
                              : "bg-red-500/20 text-red-500 border border-red-400/30"
                          }`}>
                            {invoice.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {invoice.hostedInvoiceUrl && (
                            <a
                              href={invoice.hostedInvoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white py-1 px-3 rounded font-mono font-bold text-xs transition-all duration-300"
                            >
                              VIEW INVOICE
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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