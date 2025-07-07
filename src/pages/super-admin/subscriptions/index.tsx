/**
 * Super Admin Subscription Management Hub
 * 
 * Central dashboard for all subscription management operations including
 * plans, restaurant subscriptions, analytics, and bulk operations.
 */

import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CogIcon,
  ArrowLeftIcon,
  PlusIcon,
  BuildingStorefrontIcon,
  DocumentChartBarIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { api } from '@/utils/api';
import { getSuperAdminSessionFromCookies } from '@/utils/superAdminAuth';
import { GetServerSideProps } from 'next';
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

export default function SubscriptionManagementHub({ user }: Props) {
  const router = useRouter();
  const { theme: actualTheme } = useTheme();

  // Fetch real data from APIs
  const { data: plansData, isLoading: plansLoading } = api.subscription.getPlans.useQuery();
  const { data: restaurantsData, isLoading: restaurantsLoading } = api.superAdmin.getRestaurants.useQuery({
    page: 1,
    limit: 100, // Get all restaurants for metrics
  });
  const { data: revenueAnalytics, isLoading: revenueLoading } = api.superAdmin.getRevenueAnalytics.useQuery({
    days: 30,
  });

  // Calculate key metrics from real data
  const totalRevenue = revenueAnalytics?.summary?.totalRevenue ?? 0;
  const restaurants = restaurantsData?.restaurants ?? [];
  const activeSubscriptions = restaurants.filter(r => r.subscriptionStatus === 'ACTIVE').length;
  const trialSubscriptions = restaurants.filter(r => r.subscriptionStatus === 'TRIAL').length; 
  const pastDueSubscriptions = restaurants.filter(r => r.subscriptionStatus === 'PAST_DUE').length;

  // Use real plans data
  const plans = plansData ?? [];

  // Use real restaurants data for restaurant section
  const subscriptions = restaurants;

  // Recent activity from analytics
  const recentActivity = revenueAnalytics?.recentActivity ?? [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <SuperAdminLayout user={user} title="Subscription Management">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <h1 className={`text-3xl font-mono font-bold bg-gradient-to-r ${actualTheme === 'dark' ? 'from-white to-amber-200' : 'from-gray-900 to-amber-600'} bg-clip-text text-transparent`}>
              RESTAURANT SUBSCRIPTION MANAGEMENT
            </h1>
            <span className="text-lg">💳</span>
          </div>
          <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Restaurant Billing & Subscription Operations Center</p>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Monthly Recurring Revenue */}
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 hover:border-amber-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>Monthly Revenue</p>
                <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{formatCurrency(totalRevenue)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-xs">+12.5%</span>
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
                <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{activeSubscriptions}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-xs">+8 this month</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg">
                <UsersIcon className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Trial Subscriptions */}
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 hover:border-amber-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>Trial Subscriptions</p>
                <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{trialSubscriptions}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <CalendarIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-400 text-xs">Converting soon</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg">
                <ClipboardDocumentListIcon className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Issues Requiring Attention */}
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 hover:border-red-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>Payment Issues</p>
                <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{pastDueSubscriptions}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 text-xs">Needs attention</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Subscription Plans Management */}
          <Link href="/super-admin/subscriptions/plans">
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 hover:border-amber-400/50 transition-all duration-300 cursor-pointer group`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-all duration-300">
                  <ChartBarIcon className="h-6 w-6 text-amber-400" />
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{plans.length}</p>
                  <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Plans</p>
                </div>
              </div>
              <h3 className={`text-lg font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2 group-hover:text-amber-400 transition-colors`}>
                Subscription Plans
              </h3>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4`}>
                Manage pricing plans, features, and plan analytics
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-green-400">{plans.filter(p => p.isActive).length} Active</span>
                <span className={`${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{plans.filter(p => !p.isActive).length} Inactive</span>
              </div>
            </div>
          </Link>

          {/* Restaurant Subscriptions */}
          <Link href="/super-admin/subscriptions/restaurants">
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 hover:border-amber-400/50 transition-all duration-300 cursor-pointer group`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg group-hover:from-orange-500/30 group-hover:to-red-500/30 transition-all duration-300">
                  <BuildingStorefrontIcon className="h-6 w-6 text-orange-400" />
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{subscriptions.length}</p>
                  <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Restaurants</p>
                </div>
              </div>
              <h3 className={`text-lg font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2 group-hover:text-orange-400 transition-colors`}>
                Restaurant Subscriptions
              </h3>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4`}>
                Manage individual restaurant subscriptions and billing
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-green-400">{activeSubscriptions} Active</span>
                <span className="text-yellow-400">{trialSubscriptions} Trial</span>
                <span className="text-red-400">{pastDueSubscriptions} Issues</span>
              </div>
            </div>
          </Link>

          {/* Analytics & Reporting */}
          <Link href="/super-admin/subscriptions/analytics">
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 hover:border-amber-400/50 transition-all duration-300 cursor-pointer group`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-green-500/20 to-amber-500/20 rounded-lg group-hover:from-green-500/30 group-hover:to-amber-500/30 transition-all duration-300">
                  <DocumentChartBarIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>
                    {formatCurrency(totalRevenue * 12).replace('$', '')}
                  </p>
                  <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>ARR</p>
                </div>
              </div>
              <h3 className={`text-lg font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2 group-hover:text-green-400 transition-colors`}>
                Analytics & Reports
              </h3>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4`}>
                Revenue analytics, conversion metrics, and forecasting
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-green-400">Revenue Tracking</span>
                <span className="text-amber-400">Forecasting</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions Bar */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 mb-8`}>
          <h3 className={`text-lg font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 font-mono`}>Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/super-admin/subscriptions/plans">
              <button className="flex items-center space-x-2 w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-lg font-medium transition-all duration-300">
                <PlusIcon className="h-5 w-5" />
                <span>Create Plan</span>
              </button>
            </Link>
            
            <Link href="/super-admin/subscriptions/restaurants">
              <button className={`flex items-center space-x-2 w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-gray-300' : 'bg-gray-200/50 border-gray-400/50 text-gray-700'} border hover:text-amber-400 hover:border-amber-400/50 rounded-lg font-medium transition-all duration-300`}>
                <UsersIcon className="h-5 w-5" />
                <span>Manage Subscriptions</span>
              </button>
            </Link>
            
            <button className={`flex items-center space-x-2 w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-gray-300' : 'bg-gray-200/50 border-gray-400/50 text-gray-700'} border hover:text-yellow-400 hover:border-yellow-400/50 rounded-lg font-medium transition-all duration-300`}>
              <BanknotesIcon className="h-5 w-5" />
              <span>Process Refunds</span>
            </button>
            
            <Link href="/super-admin/subscriptions/analytics">
              <button className={`flex items-center space-x-2 w-full px-4 py-3 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-gray-300' : 'bg-gray-200/50 border-gray-400/50 text-gray-700'} border hover:text-green-400 hover:border-green-400/50 rounded-lg font-medium transition-all duration-300`}>
                <DocumentChartBarIcon className="h-5 w-5" />
                <span>Export Reports</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>Recent Activity</h3>
            <Link 
              href="/super-admin/subscriptions/restaurants"
              className="text-amber-400 hover:text-amber-300 text-sm font-mono transition-colors"
            >
              View All →
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className={`flex items-center space-x-4 p-4 ${actualTheme === 'dark' ? 'bg-gray-800/30 border-gray-700/30' : 'bg-gray-200/30 border-gray-400/30'} rounded-lg border`}>
                <div className={`p-2 rounded-lg ${
                  activity.type === 'new_subscription' ? 'bg-green-500/20 text-green-400' :
                  activity.type === 'cancellation' ? 'bg-red-500/20 text-red-400' :
                  activity.type === 'upgrade' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {activity.type === 'new_subscription' && <PlusIcon className="h-4 w-4" />}
                  {activity.type === 'cancellation' && <ArrowTrendingDownIcon className="h-4 w-4" />}
                  {activity.type === 'upgrade' && <ArrowTrendingUpIcon className="h-4 w-4" />}
                  {activity.type === 'payment_failed' && <ExclamationTriangleIcon className="h-4 w-4" />}
                </div>
                
                <div className="flex-1">
                  <p className={`${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>
                    {activity.type === 'new_subscription' && `${activity.restaurant} started ${activity.plan} plan`}
                    {activity.type === 'cancellation' && `${activity.restaurant} cancelled ${activity.plan} plan`}
                    {activity.type === 'upgrade' && `${activity.restaurant} upgraded to ${activity.plan} plan`}
                    {activity.type === 'payment_failed' && `Payment failed for ${activity.restaurant} (${activity.plan})`}
                  </p>
                  <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>{activity.time}</p>
                </div>
                
                <button className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} hover:text-amber-400 transition-colors`}>
                  <CogIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
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
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: superAdmin.role
        }
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