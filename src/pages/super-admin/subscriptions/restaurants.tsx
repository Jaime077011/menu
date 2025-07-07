/**
 * Super Admin Restaurant Subscriptions Management
 * 
 * NEXUS-styled interface for managing individual restaurant subscriptions,
 * billing details, and subscription status.
 */

import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  BanknotesIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { api } from '@/utils/api';
import { getSuperAdminSessionFromCookies } from '@/utils/superAdminAuth';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import { GetServerSideProps } from 'next';
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

export default function RestaurantSubscriptionsPage({ user }: Props) {
  const router = useRouter();
  const { theme: actualTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageLimit = 10;

  // Fetch real data from APIs
  const { data: restaurantsData, isLoading: restaurantsLoading, refetch } = api.superAdmin.getRestaurants.useQuery({
    page: currentPage,
    limit: pageLimit,
    search: searchTerm || undefined,
  });

  const restaurants = restaurantsData?.restaurants ?? [];
  const pagination = restaurantsData?.pagination;

  // Calculate stats from real data
  const stats = {
    total: pagination?.total ?? 0,
    active: restaurants.filter(r => r.subscriptionStatus === 'ACTIVE').length,
    trial: restaurants.filter(r => r.subscriptionStatus === 'TRIAL').length,
    pastDue: restaurants.filter(r => r.subscriptionStatus === 'PAST_DUE').length,
    cancelled: restaurants.filter(r => r.subscriptionStatus === 'CANCELLED').length,
    totalRevenue: restaurants.reduce((sum, r) => sum + (r.totalRevenue || 0), 0),
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    void refetch();
  };

  // Handle filter change
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    void refetch();
  };

  // Handle page navigation
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'ACTIVE':
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
      case 'TRIAL':
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
      case 'PAST_DUE':
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
      case 'CANCELLED':
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircleIcon className="h-4 w-4 text-green-400" />;
      case 'TRIAL':
        return <ClockIcon className="h-4 w-4 text-blue-400" />;
      case 'PAST_DUE':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />;
      case 'CANCELLED':
        return <XCircleIcon className="h-4 w-4 text-gray-400" />;
      default:
        return <BuildingStorefrontIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <SuperAdminLayout user={user} title="Restaurant Subscriptions">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <h1 className={`text-3xl font-mono font-bold bg-gradient-to-r ${actualTheme === 'dark' ? 'from-white to-amber-200' : 'from-gray-900 to-amber-600'} bg-clip-text text-transparent`}>
              RESTAURANT SUBSCRIPTIONS
            </h1>
            <span className="text-lg">🏪</span>
          </div>
          <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Individual Restaurant Billing Management</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-4 hover:border-amber-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs font-mono`}>Total</p>
                <p className={`text-xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{stats.total}</p>
              </div>
              <BuildingStorefrontIcon className={`h-6 w-6 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
          </div>

          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-4 hover:border-green-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs font-mono`}>Active</p>
                <p className="text-xl font-bold text-green-400 font-mono">{stats.active}</p>
              </div>
              <CheckCircleIcon className="h-6 w-6 text-green-400" />
            </div>
          </div>

          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-4 hover:border-amber-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs font-mono`}>Trial</p>
                <p className="text-xl font-bold text-amber-400 font-mono">{stats.trial}</p>
              </div>
              <ClockIcon className="h-6 w-6 text-amber-400" />
            </div>
          </div>

          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-4 hover:border-red-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs font-mono`}>Past Due</p>
                <p className="text-xl font-bold text-red-400 font-mono">{stats.pastDue}</p>
              </div>
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
            </div>
          </div>

          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-4 hover:border-gray-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs font-mono`}>Cancelled</p>
                <p className={`text-xl font-bold ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} font-mono`}>{stats.cancelled}</p>
              </div>
              <XCircleIcon className={`h-6 w-6 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
          </div>

          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-4 hover:border-amber-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs font-mono`}>Revenue</p>
                <p className="text-xl font-bold text-amber-400 font-mono">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <BanknotesIcon className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 mb-8`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search restaurants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-200/50 border-gray-400/50 text-gray-900 placeholder-gray-500'} rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 font-mono`}
                />
              </div>
            </form>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className={`h-5 w-5 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className={`${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white' : 'bg-gray-200/50 border-gray-400/50 text-gray-900'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 font-mono`}
              >
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Trial</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Restaurants Table */}
        <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-200/50 border-gray-400/50'} border-b`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-mono font-medium ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>
                    Restaurant
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-mono font-medium ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>
                    Plan
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-mono font-medium ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-mono font-medium ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>
                    Revenue
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-mono font-medium ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>
                    Created
                  </th>
                  <th className={`px-6 py-4 text-right text-xs font-mono font-medium ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${actualTheme === 'dark' ? 'divide-gray-700/50' : 'divide-gray-400/50'} divide-y`}>
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className={`${actualTheme === 'dark' ? 'hover:bg-gray-800/30' : 'hover:bg-gray-200/30'} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                            <BuildingStorefrontIcon className="h-5 w-5 text-amber-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{restaurant.name}</div>
                          <div className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>{restaurant.subdomain}.restaurant.com</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{restaurant.subscriptionPlan || 'No Plan'}</div>
                      <div className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                        {restaurant.subscriptionPrice ? formatCurrency(restaurant.subscriptionPrice) : 'Free'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(restaurant.subscriptionStatus)}
                        <span className={getStatusBadge(restaurant.subscriptionStatus)}>
                          {restaurant.subscriptionStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>
                        {formatCurrency(restaurant.totalRevenue || 0)}
                      </div>
                      <div className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                        {restaurant.orderCount || 0} orders
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                      {formatDate(restaurant.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRestaurant(restaurant);
                            setShowDetailsModal(true);
                          }}
                          className="text-gray-400 hover:text-amber-400 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-amber-400 transition-colors">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-gray-800/50 px-6 py-4 border-t border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400 font-mono">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of {pagination.total} restaurants
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-amber-600/20 hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-lg font-mono transition-colors ${
                        page === pagination.currentPage
                          ? 'bg-amber-600/20 text-amber-400'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-amber-600/20 hover:text-amber-400'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-amber-600/20 hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Restaurant Details Modal */}
      {showDetailsModal && selectedRestaurant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 backdrop-blur border border-gray-700/50 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white font-mono">
                  {selectedRestaurant.name}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Restaurant Info */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-cyan-400 font-mono">Restaurant Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-300 font-mono">{selectedRestaurant.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-300 font-mono">{selectedRestaurant.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BuildingStorefrontIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-300 font-mono">{selectedRestaurant.subdomain}.nexus.com</span>
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-cyan-400 font-mono">Subscription Details</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-400 font-mono">Plan: </span>
                      <span className="text-sm text-white font-mono">{selectedRestaurant.planName}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400 font-mono">Price: </span>
                      <span className="text-sm text-white font-mono">
                        {formatCurrency(selectedRestaurant.planPrice || 0)}/{(selectedRestaurant.billingInterval || 'month').toLowerCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400 font-mono">Status: </span>
                      <span className={getStatusBadge(selectedRestaurant.subscriptionStatus)}>
                        {selectedRestaurant.subscriptionStatus.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400 font-mono">Total Revenue: </span>
                      <span className="text-sm text-cyan-400 font-mono">{formatCurrency(selectedRestaurant.totalRevenue)}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400 font-mono">Member Since: </span>
                      <span className="text-sm text-white font-mono">{formatDate(selectedRestaurant.subscriptionDate)}</span>
                    </div>
                    {selectedRestaurant.lastPayment && (
                      <div>
                        <span className="text-sm text-gray-400 font-mono">Last Payment: </span>
                        <span className="text-sm text-white font-mono">{formatDate(selectedRestaurant.lastPayment)}</span>
                      </div>
                    )}
                    {selectedRestaurant.nextPayment && (
                      <div>
                        <span className="text-sm text-gray-400 font-mono">Next Payment: </span>
                        <span className="text-sm text-white font-mono">{formatDate(selectedRestaurant.nextPayment)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:text-white hover:border-gray-600/50 rounded-lg transition-all duration-300 font-mono"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-lg transition-all duration-300 font-mono">
                  Manage Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}

// Server-side authentication check
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