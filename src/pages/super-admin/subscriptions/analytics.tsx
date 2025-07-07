import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  UsersIcon,
  DocumentChartBarIcon,
  BanknotesIcon,
  ClockIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { getSuperAdminSessionFromCookies } from '@/utils/superAdminAuth';
import { GetServerSideProps } from 'next';
import { api } from '@/utils/api';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { hasPermission } from '@/utils/roles';

interface Props {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

export default function SubscriptionAnalyticsPage({ user }: Props) {
  const router = useRouter();
  const { theme: actualTheme } = useTheme();
  const [timeRange, setTimeRange] = useState('30days');

  // Calculate date range based on selection
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '7days':
        start.setDate(end.getDate() - 7);
        break;
      case '30days':
        start.setDate(end.getDate() - 30);
        break;
      case '90days':
        start.setDate(end.getDate() - 90);
        break;
      case '1year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return { start, end };
  };

  const { start, end } = getDateRange();

  // Fetch real analytics data
  const { data: revenueAnalytics, isLoading: revenueLoading } = api.superAdmin.getRevenueAnalytics.useQuery({
    days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  });

  const { data: plansData, isLoading: plansLoading } = api.subscription.getPlans.useQuery();

  // Show loading state
  if (revenueLoading || plansLoading) {
    return (
      <SuperAdminLayout user={user} title="Subscription Analytics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono`}>LOADING ANALYTICS DATA...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  // Use real data from revenue analytics
  const analytics = {
    totalRevenue: revenueAnalytics?.summary?.totalRevenue ?? 0,
    monthlyRevenue: revenueAnalytics?.summary?.totalRevenue ?? 0,
    revenueGrowth: 21.7, // TODO: Calculate from historical data
    totalSubscriptions: revenueAnalytics?.restaurantRevenue?.length ?? 0,
    activeSubscriptions: revenueAnalytics?.restaurantRevenue?.filter(r => r.orderCount > 0).length ?? 0,
    trialSubscriptions: 8, // TODO: Get from real data when available
    cancelledSubscriptions: 3, // TODO: Get from real data when available
    pastDueSubscriptions: 2, // TODO: Get from real data when available
    conversionRate: 75.5, // TODO: Calculate from real data
    churnRate: 3.2, // TODO: Calculate from real data
    revenueByPlan: [], // TODO: Calculate from real data
    monthlyTrends: [], // TODO: Calculate from real data
  };

  const plans = plansData ?? [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0%';
    }
    return `${value.toFixed(1)}%`;
  };

  // Dummy analytics data
  const dummyAnalytics = {
    monthlyRevenue: {
      current: 12450.50,
      previous: 10230.75,
      growth: 21.7
    },
    subscriptions: {
      active: 45,
      trial: 8,
      cancelled: 3,
      pastDue: 2
    },
    revenue: {
      thisMonth: 12450.50,
      lastMonth: 10230.75,
      thisYear: 134567.89,
      lastYear: 98234.56
    },
    revenueByPlan: [
      { plan: 'Starter', revenue: 2999.70, count: 15, percentage: 24.1 },
      { plan: 'Professional', revenue: 7498.50, count: 18, percentage: 60.2 },
      { plan: 'Enterprise', revenue: 1952.30, count: 2, percentage: 15.7 }
    ],
    monthlyTrends: [
      { month: 'Jan', revenue: 8500, subscriptions: 28 },
      { month: 'Feb', revenue: 9200, subscriptions: 31 },
      { month: 'Mar', revenue: 9800, subscriptions: 33 },
      { month: 'Apr', revenue: 10500, subscriptions: 36 },
      { month: 'May', revenue: 11200, subscriptions: 39 },
      { month: 'Jun', revenue: 10230, subscriptions: 42 },
      { month: 'Jul', revenue: 12450, subscriptions: 45 }
    ],
    conversionRates: {
      trialToActive: 75.5,
      freeToTrial: 12.3,
      churnRate: 3.2
    }
  };

  return (
    <SuperAdminLayout user={user} title="Subscription Analytics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <h1 className={`text-3xl font-mono font-bold bg-gradient-to-r ${actualTheme === 'dark' ? 'from-white to-amber-200' : 'from-gray-900 to-amber-600'} bg-clip-text text-transparent`}>
                  RESTAURANT SUBSCRIPTION ANALYTICS
                </h1>
                <span className="text-lg">📊</span>
              </div>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Restaurant Revenue Analytics & Performance Metrics</p>
            </div>
            {/* Time Range Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className={`h-5 w-5 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>Period:</span>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className={`${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white' : 'bg-gray-200/50 border-gray-400/50 text-gray-900'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 font-mono`}
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Monthly Revenue */}
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 hover:border-amber-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>Monthly Revenue</p>
                <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>
                  {formatCurrency(analytics.monthlyRevenue)}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-xs">
                    {formatPercentage(analytics.revenueGrowth)} vs last month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500/20 to-amber-500/20 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          {/* Active Subscriptions */}
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 hover:border-amber-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>Active Subscriptions</p>
                <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{analytics.activeSubscriptions}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-xs">+7 this month</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg">
                <UsersIcon className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 hover:border-amber-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>Trial Conversion</p>
                <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{formatPercentage(analytics.conversionRate)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-xs">+2.3% improvement</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>

          {/* Churn Rate */}
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 hover:border-red-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>Churn Rate</p>
                <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{formatPercentage(analytics.churnRate)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <ArrowTrendingDownIcon className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-xs">-0.8% improvement</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg">
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue by Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Breakdown */}
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6 font-mono`}>Revenue by Plan</h3>
            <div className="space-y-4">
              {plans.map((plan, index) => (
                <div key={plan.id || index} className={`flex items-center justify-between p-4 ${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-200/30 border-gray-400/30'} rounded-lg border`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${
                      plan.name === 'Starter' ? 'bg-amber-400' :
                      plan.name === 'Professional' ? 'bg-orange-400' :
                      'bg-red-400'
                    }`}></div>
                    <div>
                      <p className={`${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium font-mono`}>{plan.name || plan.displayName}</p>
                      <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>{plan.subscriptions || 0} subscriptions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium font-mono`}>{formatCurrency(plan.revenue || 0)}</p>
                    <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>{formatPercentage(plan.revenuePercentage || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6 font-mono`}>Monthly Trends</h3>
            <div className="space-y-3">
              {analytics.monthlyTrends.slice(-4).map((month, index) => (
                <div key={index} className={`flex items-center justify-between p-3 ${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-200/30 border-gray-400/30'} rounded-lg border`}>
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className={`h-4 w-4 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{month.month}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-amber-400 text-sm font-mono">{formatCurrency(month.revenue)}</p>
                      <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs font-mono`}>{month.subscriptions} subs</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6`}>
          <h3 className={`text-lg font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6 font-mono`}>Performance Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Annual Revenue */}
            <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-200/30 border-gray-400/30'} rounded-lg p-4 border`}>
              <div className="flex items-center space-x-2 mb-2">
                <BanknotesIcon className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-mono text-sm">Annual Revenue</span>
              </div>
              <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{formatCurrency(analytics.totalRevenue)}</p>
              <p className="text-green-400 text-sm font-mono">+37% vs last year</p>
            </div>

            {/* Average Revenue Per User */}
            <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-200/30 border-gray-400/30'} rounded-lg p-4 border`}>
              <div className="flex items-center space-x-2 mb-2">
                <UsersIcon className="h-5 w-5 text-blue-400" />
                <span className="text-blue-400 font-mono text-sm">ARPU</span>
              </div>
              <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>
                {formatCurrency(analytics.monthlyRevenue / analytics.activeSubscriptions)}
              </p>
              <p className="text-blue-400 text-sm font-mono">Per active user</p>
            </div>

            {/* Growth Rate */}
            <div className={`${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-200/30 border-gray-400/30'} rounded-lg p-4 border`}>
              <div className="flex items-center space-x-2 mb-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-purple-400" />
                <span className="text-purple-400 font-mono text-sm">Growth Rate</span>
              </div>
              <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{formatPercentage(analytics.revenueGrowth)}</p>
              <p className="text-purple-400 text-sm font-mono">Month over month</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-lg font-medium transition-all duration-300 font-mono">
              <DocumentChartBarIcon className="h-4 w-4 inline mr-2" />
              Export Report
            </button>
            <button className={`px-4 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-gray-300' : 'bg-gray-200/50 border-gray-400/50 text-gray-700'} border hover:text-amber-400 hover:border-amber-400/50 rounded-lg transition-all duration-300 font-mono`}>
              <CalendarIcon className="h-4 w-4 inline mr-2" />
              Schedule Report
            </button>
            <button className={`px-4 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-gray-300' : 'bg-gray-200/50 border-gray-400/50 text-gray-700'} border hover:text-amber-400 hover:border-amber-400/50 rounded-lg transition-all duration-300 font-mono`}>
              <ChartBarIcon className="h-4 w-4 inline mr-2" />
              Advanced Analytics
            </button>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = context.req.headers.cookie;
    if (!cookies) {
      return {
        redirect: {
          destination: '/super-admin/login',
          permanent: false,
        },
      };
    }

    const superAdmin = await getSuperAdminSessionFromCookies(cookies);
    if (!superAdmin) {
      return {
        redirect: {
          destination: '/super-admin/login',
          permanent: false,
        },
      };
    }

    // Check if user has permission to view billing information
    if (!hasPermission(superAdmin.role, "canViewBilling")) {
      return {
        redirect: {
          destination: "/super-admin?access=denied",
          permanent: false,
        },
      };
    }

    return {
      props: {
        user: superAdmin,
      },
    };
  } catch (error) {
    return {
      redirect: {
        destination: '/super-admin/login',
        permanent: false,
      },
    };
  }
}; 