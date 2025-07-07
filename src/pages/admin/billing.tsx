import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { getAdminSessionFromCookies } from "@/utils/auth";
import { api } from "@/utils/api";
import AdminLayout from "@/components/AdminLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  CreditCardIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentTextIcon,
  CogIcon
} from "@heroicons/react/24/outline";

interface BillingPageProps {
  restaurantId: string;
}

export default function BillingPage({ restaurantId }: BillingPageProps) {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<'1' | '3' | '6' | '12'>('3');
  const { theme, actualTheme } = useTheme();

  // API calls
  const { data: currentSubscription, refetch: refetchSubscription } = 
    api.subscription.getCurrentSubscription.useQuery();
  const { data: features } = api.subscription.getFeatures.useQuery();
  const { data: billingHistory } = api.subscription.getBillingHistory.useQuery();
  const { data: upcomingInvoice } = api.subscription.getUpcomingInvoice.useQuery();
  const { data: usageMetrics } = api.subscription.getUsageMetrics.useQuery({
    months: parseInt(selectedPeriod)
  });

  const createBillingPortal = api.subscription.createBillingPortal.useMutation();

  const handleManageBilling = async () => {
    try {
      const result = await createBillingPortal.mutateAsync({
        returnUrl: `${window.location.origin}/admin/billing`,
      });
      window.location.href = result.url;
    } catch (error) {
      console.error("Error opening billing portal:", error);
      alert("Failed to open billing portal. Please try again.");
    }
  };

  const formatCurrency = (amount: number | string | any, currency = "USD") => {
    // Convert Prisma Decimal to number
    const numericAmount = typeof amount === 'object' && amount.toNumber ? amount.toNumber() : Number(amount);
    
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(numericAmount); // Amounts are already in dollars
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-500 bg-green-500/20 border border-green-500/30";
      case "TRIAL":
        return "text-amber-500 bg-amber-500/20 border border-amber-500/30";
      case "PAST_DUE":
        return "text-yellow-500 bg-yellow-500/20 border border-yellow-500/30";
      case "CANCELLED":
        return "text-red-500 bg-red-500/20 border border-red-500/30";
      default:
        return "text-gray-500 bg-gray-500/20 border border-gray-500/30";
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-orange-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-green-500";
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
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
                <CreditCardIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-mono font-bold bg-gradient-to-r ${actualTheme === 'dark' ? 'from-white to-amber-200' : 'from-gray-900 to-amber-700'} bg-clip-text text-transparent`}>
                  BILLING & USAGE
                </h1>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                  Manage your subscription, view usage metrics, and billing history
                </p>
              </div>
            </div>
            <button
              onClick={handleManageBilling}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white rounded-lg font-mono font-bold transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.3)]"
            >
              <CogIcon className="h-4 w-4 mr-2" />
              MANAGE BILLING
            </button>
          </div>

          {/* Current Subscription Overview */}
          {currentSubscription && (
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100/50 border-gray-200'} backdrop-blur-sm border overflow-hidden shadow-xl rounded-lg`}>
              <div className="px-6 py-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
                        <CreditCardIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className={`text-xl leading-6 font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {currentSubscription.plan?.displayName || "Current Plan"}
                      </h3>
                      <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                        {currentSubscription.plan?.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-mono font-bold bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent">
                      {formatCurrency(currentSubscription.plan?.price || 0)}
                      <span className={`text-sm font-normal ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>/month</span>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold ${getStatusColor(currentSubscription.status)}`}>
                      {currentSubscription.status?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Billing Cycle Info */}
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className={`${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'} backdrop-blur-sm border px-4 py-4 rounded-lg`}>
                    <div className="text-sm font-mono font-bold text-amber-500">CURRENT PERIOD</div>
                    <div className={`mt-2 text-sm ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono`}>
                      {currentSubscription.currentPeriodStart && currentSubscription.currentPeriodEnd
                        ? `${formatDate(new Date(currentSubscription.currentPeriodStart))} - ${formatDate(new Date(currentSubscription.currentPeriodEnd))}`
                        : "N/A"
                      }
                    </div>
                  </div>
                  <div className={`${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'} backdrop-blur-sm border px-4 py-4 rounded-lg`}>
                    <div className="text-sm font-mono font-bold text-orange-500">NEXT BILLING DATE</div>
                    <div className={`mt-2 text-sm ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono`}>
                      {currentSubscription.currentPeriodEnd
                        ? formatDate(new Date(currentSubscription.currentPeriodEnd))
                        : "N/A"
                      }
                    </div>
                  </div>
                  <div className={`${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'} backdrop-blur-sm border px-4 py-4 rounded-lg`}>
                    <div className="text-sm font-mono font-bold text-green-500">PAYMENT METHOD</div>
                    <div className={`mt-2 text-sm ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono`}>
                      •••• •••• •••• {currentSubscription.paymentMethod?.last4 || "****"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Usage Metrics */}
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100/50 border-gray-200'} backdrop-blur-sm border shadow-xl rounded-lg`}>
            <div className="px-6 py-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl leading-6 font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>USAGE OVERVIEW</h3>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as '1' | '3' | '6' | '12')}
                  className={`block w-36 pl-3 pr-10 py-2 text-sm ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 rounded-md`}
                >
                  <option value="1">LAST MONTH</option>
                  <option value="3">LAST 3 MONTHS</option>
                  <option value="6">LAST 6 MONTHS</option>
                  <option value="12">LAST YEAR</option>
                </select>
              </div>

              {usageMetrics && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Menu Items */}
                  <div className={`${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'} backdrop-blur-sm border p-6 rounded-lg hover:border-amber-600/50 transition-all duration-300`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-mono font-bold text-amber-500">MENU ITEMS</p>
                        <p className={`text-2xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mt-2`}>
                          {usageMetrics.menuItems?.current || 0}
                          {usageMetrics.menuItems?.limit !== -1 && (
                            <span className={`text-sm font-normal ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              /{usageMetrics.menuItems?.limit}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
                        <ChartBarIcon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    {usageMetrics.menuItems?.limit !== -1 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>USAGE</span>
                          <span className={`font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {Math.round(getUsagePercentage(usageMetrics.menuItems?.current || 0, usageMetrics.menuItems?.limit || 0))}%
                          </span>
                        </div>
                        <div className={`mt-2 w-full ${actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-amber-600 to-orange-700"
                            style={{
                              width: `${getUsagePercentage(usageMetrics.menuItems?.current || 0, usageMetrics.menuItems?.limit || 0)}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Orders */}
                  <div className={`${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'} backdrop-blur-sm border p-6 rounded-lg hover:border-red-500/50 transition-all duration-300`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-mono font-bold text-red-500">ORDERS (THIS MONTH)</p>
                        <p className={`text-2xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mt-2`}>
                          {usageMetrics.orders?.current || 0}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      {usageMetrics.orders?.trend === 'up' ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span className={`font-mono ${usageMetrics.orders?.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                        {usageMetrics.orders?.changePercent || 0}% from last period
                      </span>
                    </div>
                  </div>

                  {/* API Calls */}
                  <div className={`${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'} backdrop-blur-sm border p-6 rounded-lg hover:border-green-500/50 transition-all duration-300`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-mono font-bold text-green-500">API CALLS</p>
                        <p className={`text-2xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mt-2`}>
                          {usageMetrics.apiCalls?.current || 0}
                          {usageMetrics.apiCalls?.limit !== -1 && (
                            <span className={`text-sm font-normal ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              /{usageMetrics.apiCalls?.limit}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                        <ClockIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Admin Users */}
                  <div className={`${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'} backdrop-blur-sm border p-6 rounded-lg hover:border-amber-600/50 transition-all duration-300`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-mono font-bold text-amber-500">ADMIN USERS</p>
                        <p className={`text-2xl font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mt-2`}>
                          {usageMetrics.adminUsers?.current || 0}
                          {usageMetrics.adminUsers?.limit !== -1 && (
                            <span className={`text-sm font-normal ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              /{usageMetrics.adminUsers?.limit}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
                        <ChartBarIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Invoice */}
          {upcomingInvoice && (
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100/50 border-gray-200'} backdrop-blur-sm border shadow-xl rounded-lg`}>
              <div className="px-6 py-8">
                <h3 className={`text-xl leading-6 font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>UPCOMING INVOICE</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono font-bold text-amber-500">NEXT BILLING DATE</p>
                    <p className={`text-lg font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mt-2`}>
                      {formatDate(new Date(upcomingInvoice.periodEnd))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-orange-500">AMOUNT DUE</p>
                    <p className="text-3xl font-mono font-bold bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent mt-2">
                      {formatCurrency(upcomingInvoice.amount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing History */}
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100/50 border-gray-200'} backdrop-blur-sm border shadow-xl rounded-lg`}>
            <div className="px-6 py-8">
              <h3 className={`text-xl leading-6 font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>BILLING HISTORY</h3>
              {billingHistory && billingHistory.length > 0 ? (
                <div className="overflow-hidden">
                  <table className={`min-w-full divide-y ${actualTheme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <thead className={`${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                      <tr>
                        <th className={`px-6 py-4 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'} uppercase tracking-wider`}>
                          DATE
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-orange-400' : 'text-orange-600'} uppercase tracking-wider`}>
                          DESCRIPTION
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'} uppercase tracking-wider`}>
                          AMOUNT
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-green-400' : 'text-green-600'} uppercase tracking-wider`}>
                          STATUS
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-mono font-bold ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>
                          INVOICE
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${actualTheme === 'dark' ? 'bg-gray-800/25 divide-gray-700' : 'bg-gray-50/25 divide-gray-200'}`}>
                      {billingHistory.map((invoice) => (
                        <tr key={invoice.id} className={`${actualTheme === 'dark' ? 'hover:bg-gray-800/40' : 'hover:bg-gray-100/40'} transition-colors duration-200`}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formatDate(new Date(invoice.created * 1000))}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {invoice.description || "Monthly subscription"}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(invoice.amountPaid)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold ${
                              invoice.status === 'paid' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 
                              invoice.status === 'open' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                              'bg-red-500/20 text-red-500 border border-red-500/30'
                            }`}>
                              {invoice.status?.toUpperCase()}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {invoice.invoicePdf && (
                              <a 
                                href={invoice.invoicePdf} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`${actualTheme === 'dark' ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-500'} flex items-center font-mono font-bold transition-colors duration-200`}
                              >
                                <DocumentTextIcon className="h-4 w-4 mr-2" />
                                DOWNLOAD
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-center py-8 font-mono`}>NO BILLING HISTORY AVAILABLE</p>
              )}
            </div>
          </div>

          {/* Feature Access */}
          {features && (
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100/50 border-gray-200'} backdrop-blur-sm border shadow-xl rounded-lg`}>
              <div className="px-6 py-8">
                <h3 className={`text-xl leading-6 font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>FEATURE ACCESS</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(features).map(([feature, enabled]) => (
                    <div key={feature} className={`flex items-center p-3 ${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50/30 border-gray-200'} rounded-lg border`}>
                      {enabled ? (
                        <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                          <CheckCircleIcon className="h-3 w-3 text-white" />
                        </div>
                      ) : (
                        <div className={`w-5 h-5 ${actualTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'} rounded-full flex items-center justify-center mr-3`}>
                          <ExclamationTriangleIcon className={`h-3 w-3 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                        </div>
                      )}
                      <span className={`text-sm font-mono font-bold ${enabled ? (actualTheme === 'dark' ? 'text-white' : 'text-gray-900') : (actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}>
                        {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
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