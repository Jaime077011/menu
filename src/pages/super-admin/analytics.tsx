import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { type GetServerSideProps } from "next";
import { api } from "@/utils/api";
import { getSuperAdminSessionFromCookies } from "@/utils/superAdminAuth";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { useTheme } from '@/contexts/ThemeContext';

interface SuperAdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface Props {
  user: SuperAdminUser;
}

export default function AnalyticsDashboard({ user }: Props) {
  const router = useRouter();
  const { theme: actualTheme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState<'revenue' | 'activity' | 'comparison'>('revenue');

  // Fetch analytics data
  const { data: revenueData, isLoading: revenueLoading } = api.superAdmin.getRevenueAnalytics.useQuery(
    { days: selectedPeriod },
    { enabled: !!user }
  );

  const { data: activityData, isLoading: activityLoading } = api.superAdmin.getActivityAnalytics.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: comparisonData, isLoading: comparisonLoading } = api.superAdmin.getRestaurantComparison.useQuery(
    { days: selectedPeriod },
    { enabled: !!user }
  );

  // Combined loading state for initial page load
  const isInitialLoading = revenueLoading && activityLoading && comparisonLoading;

  return (
    <SuperAdminLayout user={user} title="Analytics Dashboard">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-3xl">📊</span>
            <h1 className={`text-3xl font-mono font-bold ${actualTheme === 'dark' ? 'bg-gradient-to-r from-white via-amber-200 to-orange-200' : 'bg-gradient-to-r from-gray-900 via-amber-600 to-orange-600'} bg-clip-text text-transparent`}>
              RESTAURANT ANALYTICS DASHBOARD
            </h1>
          </div>
          <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Platform-wide Insights and Performance Metrics</p>
        </div>

        {isInitialLoading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-mono`}>LOADING ANALYTICS DATA...</p>
          </div>
        ) : (
          <>
            {/* Period Selector */}
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl p-6`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-lg font-mono font-bold text-amber-400">ANALYTICS PERIOD</h2>
                <div className="flex space-x-2">
                  {[7, 30, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => setSelectedPeriod(days)}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 font-mono text-sm ${
                        selectedPeriod === days
                          ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                          : `${actualTheme === 'dark' ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white border border-gray-700' : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 border border-gray-300'}`
                      }`}
                    >
                      LAST {days} DAYS
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl overflow-hidden`}>
              <div className="flex">
                {[
                  { key: 'revenue', label: 'REVENUE', icon: '💰' },
                  { key: 'activity', label: 'ACTIVITY', icon: '📈' },
                  { key: 'comparison', label: 'COMPARISON', icon: '⚖️' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 px-6 py-4 text-center font-mono text-sm transition-all duration-300 ${
                      activeTab === tab.key
                        ? "bg-gradient-to-r from-amber-600/20 to-orange-600/20 text-amber-400 border-b-2 border-amber-600"
                        : `${actualTheme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-800/30' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/30'}`
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Revenue Analytics Content */}
            {activeTab === 'revenue' && (
              <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl p-6`}>
                <h3 className="text-lg font-mono font-bold text-amber-400 mb-6">REVENUE ANALYTICS</h3>
                
                {revenueLoading ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-mono`}>LOADING REVENUE DATA...</p>
                  </div>
                ) : (
                  <>
                    {/* Revenue Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-green-900/20 border border-green-400/30 rounded-lg p-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm text-green-400 font-mono">TOTAL REVENUE</p>
                            <p className="text-2xl font-bold text-green-300 font-mono">
                              ${(revenueData?.summary?.totalRevenue ?? 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-green-400 font-mono">
                              Last {selectedPeriod} days
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-900/20 border border-amber-400/30 rounded-lg p-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">📋</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm text-amber-400 font-mono">TOTAL ORDERS</p>
                            <p className="text-2xl font-bold text-amber-300 font-mono">
                              {revenueData?.summary?.totalOrders ?? 0}
                            </p>
                            <p className="text-xs text-amber-400 font-mono">
                              Completed orders
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-orange-900/20 border border-orange-400/30 rounded-lg p-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm text-orange-400 font-mono">AVG ORDER VALUE</p>
                            <p className="text-2xl font-bold text-orange-300 font-mono">
                              ${((revenueData?.summary?.totalRevenue ?? 0) / Math.max(revenueData?.summary?.totalOrders ?? 1, 1)).toFixed(2)}
                            </p>
                            <p className="text-xs text-orange-400 font-mono">
                              Per order
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Daily Revenue Chart Placeholder */}
                    <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100/30 border-gray-300'} border rounded-lg p-6`}>
                      <h4 className={`text-md font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>REVENUE TRENDS</h4>
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-6xl mb-4 block">📈</span>
                          <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Revenue chart visualization would go here</p>
                          <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} font-mono`}>Integration with charting library needed</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Activity Analytics Content */}
            {activeTab === 'activity' && (
              <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl p-6`}>
                <h3 className="text-lg font-mono font-bold text-amber-400 mb-6">PLATFORM ACTIVITY</h3>
                
                {activityLoading ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-mono`}>LOADING ACTIVITY DATA...</p>
                  </div>
                ) : (
                  <>
                    {/* Activity Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-amber-900/20 border border-amber-400/30 rounded-lg p-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🏪</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm text-amber-400 font-mono">ACTIVE RESTAURANTS</p>
                            <p className="text-2xl font-bold text-amber-300 font-mono">
                              {activityData?.summary?.activeRestaurants ?? activityData?.totalRestaurants ?? 0}
                            </p>
                            <p className="text-xs text-amber-400 font-mono">
                              Last 30 days
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-orange-900/20 border border-orange-400/30 rounded-lg p-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">💬</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm text-orange-400 font-mono">TOTAL CHATS</p>
                            <p className="text-2xl font-bold text-orange-300 font-mono">
                              {activityData?.summary?.totalChats ?? activityData?.totalChatSessions ?? 0}
                            </p>
                            <p className="text-xs text-orange-400 font-mono">
                              All time
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">👥</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm text-red-400 font-mono">ACTIVE USERS</p>
                            <p className="text-2xl font-bold text-red-300 font-mono">
                              {activityData?.summary?.activeUsers ?? activityData?.totalUsers ?? 0}
                            </p>
                            <p className="text-xs text-red-400 font-mono">
                              Last 7 days
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">📱</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm text-yellow-400 font-mono">AVG SESSION</p>
                            <p className="text-2xl font-bold text-yellow-300 font-mono">
                              {activityData?.summary?.avgSessionTime ?? activityData?.avgSessionTime ?? '0'}m
                            </p>
                            <p className="text-xs text-yellow-400 font-mono">
                              Minutes
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Activity Chart Placeholder */}
                    <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100/30 border-gray-300'} border rounded-lg p-6`}>
                      <h4 className={`text-md font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>ACTIVITY TRENDS</h4>
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-6xl mb-4 block">📊</span>
                          <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Activity chart visualization would go here</p>
                          <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} font-mono`}>Integration with charting library needed</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Comparison Analytics Content */}
            {activeTab === 'comparison' && (
              <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200'} backdrop-blur-sm border rounded-xl p-6`}>
                <h3 className="text-lg font-mono font-bold text-amber-400 mb-6">RESTAURANT COMPARISON</h3>
                
                {comparisonLoading ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-mono`}>LOADING COMPARISON DATA...</p>
                  </div>
                ) : (
                  <>
                    {/* Top Performers */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100/30 border-gray-300'} border rounded-lg p-6`}>
                        <h4 className="text-md font-mono font-bold text-amber-400 mb-4">TOP REVENUE PERFORMERS</h4>
                        <div className="space-y-3">
                          {comparisonData?.topRevenue?.map((restaurant, index) => (
                            <div key={restaurant.id} className={`flex items-center justify-between p-3 ${actualTheme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-50/50'} rounded-lg`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                  index === 1 ? 'bg-gray-500/20 text-gray-400' :
                                  index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-gray-600/20 text-gray-500'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className={`${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono text-sm`}>{restaurant.name}</p>
                                  <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono text-xs`}>{restaurant.subdomain}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-green-400 font-mono font-bold">${(restaurant.revenue ?? 0).toFixed(2)}</p>
                                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono text-xs`}>{restaurant.orders ?? 0} orders</p>
                              </div>
                            </div>
                          )) ?? (
                            <div className="text-center py-8">
                              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>No revenue data available</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100/30 border-gray-300'} border rounded-lg p-6`}>
                        <h4 className="text-md font-mono font-bold text-amber-400 mb-4">MOST ACTIVE RESTAURANTS</h4>
                        <div className="space-y-3">
                          {comparisonData?.mostActive?.map((restaurant, index) => (
                            <div key={restaurant.id} className={`flex items-center justify-between p-3 ${actualTheme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-50/50'} rounded-lg`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                  index === 1 ? 'bg-gray-500/20 text-gray-400' :
                                  index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-gray-600/20 text-gray-500'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className={`${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono text-sm`}>{restaurant.name}</p>
                                  <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono text-xs`}>{restaurant.subdomain}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-amber-400 font-mono font-bold">{restaurant.sessions ?? 0}</p>
                                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono text-xs`}>sessions</p>
                              </div>
                            </div>
                          )) ?? (
                            <div className="text-center py-8">
                              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>No activity data available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Comparison Chart Placeholder */}
                    <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-100/30 border-gray-300'} border rounded-lg p-6`}>
                      <h4 className={`text-md font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>PERFORMANCE COMPARISON</h4>
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-6xl mb-4 block">⚖️</span>
                          <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Comparison chart visualization would go here</p>
                          <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} font-mono`}>Integration with charting library needed</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
}

// Server-side authentication and permission check  
export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const cookies = context.req.headers.cookie || "";
  
  try {
    const session = await getSuperAdminSessionFromCookies(cookies);
    
    if (!session) {
      return {
        redirect: {
          destination: "/super-admin/login",
          permanent: false,
        },
      };
    }

    // Check if user has permission to view analytics
    const { hasPermission } = await import("@/utils/roles");
    const canViewAnalytics = await hasPermission(session.role, "canViewAnalytics");
    
    if (!canViewAnalytics) {
      return {
        redirect: {
          destination: "/super-admin?access=denied&reason=analytics&role=" + session.role,
          permanent: false,
        },
      };
    }

    return {
      props: {
        user: {
          id: session.id,
          email: session.email,
          name: session.name || null,
          role: session.role,
        },
      },
    };
  } catch (error) {
    console.error("Super admin session verification error:", error);
    return {
      redirect: {
        destination: "/super-admin/login",
        permanent: false,
      },
    };
  }
}; 