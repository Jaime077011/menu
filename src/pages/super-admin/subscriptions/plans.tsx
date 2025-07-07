/**
 * Super Admin Subscription Plans Management
 * 
 * NEXUS-styled interface for managing subscription plans with analytics,
 * CRUD operations, and real-time statistics.
 */

import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  PlusIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowLeftIcon,
  StarIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
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

interface PlanStats {
  totalPlans: number;
  totalSubscribers: number;
  totalMonthlyRevenue: number;
  averageConversion: number;
}

export default function SubscriptionPlansPage({ user }: Props) {
  const router = useRouter();
  const { theme: actualTheme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    price: '',
    yearlyPrice: '',
    billingInterval: 'MONTHLY' as 'MONTHLY' | 'YEARLY',
    maxLocations: '1',
    maxMenuItems: '50',
    maxOrders: '100',
    maxUsers: '2',
    maxWaiters: '1',
    features: '',
    isActive: true,
    sortOrder: '0',
  });

  // Fetch real data from APIs using the correct super admin endpoint
  const { data: plansData, isLoading: plansLoading, refetch: refetchPlans } = api.superAdmin.getAllPlans.useQuery();
  const { data: restaurantsData, isLoading: restaurantsLoading } = api.superAdmin.getRestaurants.useQuery({
    page: 1,
    limit: 100, // Get all restaurants for accurate metrics
  });

  // CRUD mutations
  const createPlanMutation = api.superAdmin.createPlan.useMutation({
    onSuccess: () => {
      refetchPlans();
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const updatePlanMutation = api.superAdmin.updatePlan.useMutation({
    onSuccess: () => {
      refetchPlans();
      setShowEditModal(false);
      setSelectedPlan(null);
      resetForm();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const deletePlanMutation = api.superAdmin.deletePlan.useMutation({
    onSuccess: () => {
      refetchPlans();
      setShowDeleteModal(false);
      setSelectedPlan(null);
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const syncStripeMutation = api.superAdmin.syncPlansWithStripe.useMutation({
    onSuccess: () => {
      alert("Plans synced with Stripe successfully!");
      refetchPlans();
    },
    onError: (error) => {
      alert(`Failed to sync with Stripe: ${error.message}`);
    },
  });

  // Form helpers
  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      price: '',
      yearlyPrice: '',
      billingInterval: 'MONTHLY',
      maxLocations: '1',
      maxMenuItems: '50',
      maxOrders: '100',
      maxUsers: '2',
      maxWaiters: '1',
      features: '',
      isActive: true,
      sortOrder: '0',
    });
  };

  const fillFormWithPlan = (plan: any) => {
    setFormData({
      name: plan.name || '',
      displayName: plan.displayName || '',
      description: plan.description || '',
      price: plan.price?.toString() || '',
      yearlyPrice: plan.yearlyPrice?.toString() || '',
      billingInterval: plan.billingInterval || 'MONTHLY',
      maxLocations: plan.maxLocations?.toString() || '1',
      maxMenuItems: plan.maxMenuItems?.toString() || '50',
      maxOrders: plan.maxOrders?.toString() || '100',
      maxUsers: plan.maxUsers?.toString() || '2',
      maxWaiters: plan.maxWaiters?.toString() || '1',
      features: plan.features || '',
      isActive: plan.isActive ?? true,
      sortOrder: plan.sortOrder?.toString() || '0',
    });
  };

  // Use real plans data
  const plans = plansData ?? [];
  const restaurants = restaurantsData?.restaurants ?? [];

  // Calculate stats from real data
  const stats: PlanStats = {
    totalPlans: plans.length,
    totalSubscribers: restaurants.length,
    totalMonthlyRevenue: plans.reduce((sum, plan) => {
      const planRestaurants = restaurants.filter(r => r.subscriptionPlanId === plan.id && r.subscriptionStatus === 'ACTIVE');
      return sum + (planRestaurants.length * plan.price);
    }, 0),
    averageConversion: 75.5, // TODO: Calculate from real data when available
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPlanFeatures = (plan: any) => {
    try {
      return plan.features ? JSON.parse(plan.features) : {};
    } catch {
      return {};
    }
  };

  // Feature mapping for user-friendly display
  const featureLabels: Record<string, { label: string; icon: string; category: string }> = {
    // Core Features
    basicAI: { label: 'AI Assistant', icon: '🤖', category: 'Core' },
    qrOrdering: { label: 'QR Code Ordering', icon: '📱', category: 'Core' },
    basicAnalytics: { label: 'Basic Analytics', icon: '📊', category: 'Analytics' },
    emailSupport: { label: 'Email Support', icon: '✉️', category: 'Support' },
    
    // Advanced Features
    customPersonality: { label: 'Custom AI Personality', icon: '🎭', category: 'Advanced' },
    advancedAnalytics: { label: 'Advanced Analytics', icon: '📈', category: 'Analytics' },
    phoneSupport: { label: 'Phone Support', icon: '📞', category: 'Support' },
    customBranding: { label: 'Custom Branding', icon: '🎨', category: 'Branding' },
    
    // Enterprise Features
    multiLocation: { label: 'Multi-Location', icon: '🏢', category: 'Enterprise' },
    staffManagement: { label: 'Staff Management', icon: '👥', category: 'Enterprise' },
    advancedReporting: { label: 'Advanced Reporting', icon: '📋', category: 'Enterprise' },
    webhooks: { label: 'Webhooks', icon: '🔗', category: 'Integration' },
    apiAccess: { label: 'API Access', icon: '🔌', category: 'Integration' },
    integrations: { label: 'Third-party Integrations', icon: '🔄', category: 'Integration' },
  };

  const PlanFeaturesDisplay = ({ features, theme }: { features: any; theme: string }) => {
    const enabledFeatures = Object.entries(features).filter(([_, enabled]) => enabled);
    
    if (enabledFeatures.length === 0) {
      return (
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          No features enabled
        </div>
      );
    }

    // Get the most important features to highlight
    const keyFeatures = enabledFeatures
      .map(([key, _]) => featureLabels[key])
      .filter(Boolean)
      .slice(0, 4); // Show only top 4 features

    const remainingCount = enabledFeatures.length - keyFeatures.length;

    return (
      <div className="space-y-2">
        {keyFeatures.map(({ label, icon }) => (
          <div key={label} className="flex items-center space-x-2">
            <CheckIcon className="h-4 w-4 text-amber-400" />
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {label}
            </span>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="flex items-center space-x-2">
            <CheckIcon className="h-4 w-4 text-amber-400" />
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              +{remainingCount} more features
            </span>
          </div>
        )}
      </div>
    );
  };

  const FeaturesSelector = ({ value, onChange, theme }: { value: string; onChange: (value: string) => void; theme: string }) => {
    // Parse current features from JSON string
    const currentFeatures = React.useMemo(() => {
      try {
        return value ? JSON.parse(value) : {};
      } catch {
        return {};
      }
    }, [value]);

    // Group features by category
    const categorizedFeatures = React.useMemo(() => {
      const grouped: Record<string, Array<{ key: string; label: string; icon: string; category: string }>> = {};
      
      Object.entries(featureLabels).forEach(([key, feature]) => {
        if (!grouped[feature.category]) {
          grouped[feature.category] = [];
        }
        grouped[feature.category].push({ key, ...feature });
      });

      return grouped;
    }, []);

    const handleFeatureToggle = (featureKey: string, enabled: boolean) => {
      const newFeatures = { ...currentFeatures, [featureKey]: enabled };
      onChange(JSON.stringify(newFeatures));
    };

    return (
      <div className="space-y-4">
        {Object.entries(categorizedFeatures).map(([category, categoryFeatures]) => (
          <div key={category}>
            <h5 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
              {category}
            </h5>
            <div className="grid grid-cols-1 gap-3">
              {categoryFeatures.map(({ key, label, icon }) => (
                <div key={key} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`feature-${key}`}
                    checked={currentFeatures[key] || false}
                    onChange={(e) => handleFeatureToggle(key, e.target.checked)}
                    className={`w-4 h-4 text-amber-600 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} rounded focus:ring-amber-400/50`}
                  />
                  <label htmlFor={`feature-${key}`} className={`flex items-center space-x-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} cursor-pointer`}>
                    <span>{icon}</span>
                    <span>{label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* JSON Preview */}
        <div className="mt-4 pt-4 border-t border-gray-300/50">
          <h5 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            JSON Preview
          </h5>
          <pre className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} bg-gray-100/50 p-3 rounded-lg overflow-x-auto`}>
            {JSON.stringify(currentFeatures, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  const getPlanSubscribers = (planId: string) => {
    return restaurants.filter(r => r.subscriptionPlanId === planId).length;
  };

  // Form submission handlers
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createPlanMutation.mutateAsync({
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        yearlyPrice: formData.yearlyPrice ? parseFloat(formData.yearlyPrice) : undefined,
        billingInterval: formData.billingInterval,
        maxLocations: parseInt(formData.maxLocations),
        maxMenuItems: parseInt(formData.maxMenuItems),
        maxOrders: parseInt(formData.maxOrders),
        maxUsers: parseInt(formData.maxUsers),
        maxWaiters: parseInt(formData.maxWaiters),
        features: formData.features || undefined,
        isActive: formData.isActive,
        sortOrder: parseInt(formData.sortOrder),
      });
    } catch (error) {
      // Error handling is done in mutation onError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    
    setIsSubmitting(true);

    try {
      await updatePlanMutation.mutateAsync({
        id: selectedPlan.id,
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        yearlyPrice: formData.yearlyPrice ? parseFloat(formData.yearlyPrice) : undefined,
        billingInterval: formData.billingInterval,
        maxLocations: parseInt(formData.maxLocations),
        maxMenuItems: parseInt(formData.maxMenuItems),
        maxOrders: parseInt(formData.maxOrders),
        maxUsers: parseInt(formData.maxUsers),
        maxWaiters: parseInt(formData.maxWaiters),
        features: formData.features || undefined,
        isActive: formData.isActive,
        sortOrder: parseInt(formData.sortOrder),
      });
    } catch (error) {
      // Error handling is done in mutation onError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (force = false) => {
    if (!selectedPlan) return;

    try {
      await deletePlanMutation.mutateAsync({
        id: selectedPlan.id,
        force,
      });
    } catch (error) {
      // Error handling is done in mutation onError
    }
  };

  // Helper to open edit modal with pre-filled data
  const openEditModal = (plan: any) => {
    setSelectedPlan(plan);
    fillFormWithPlan(plan);
    setShowEditModal(true);
  };

  // Show loading state
  if (plansLoading || restaurantsLoading) {
    return (
      <SuperAdminLayout user={user} title="Subscription Plans Management">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-mono`}>LOADING SUBSCRIPTION PLANS...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout user={user} title="Subscription Plans Management">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <h1 className={`text-3xl font-mono font-bold bg-gradient-to-r ${actualTheme === 'dark' ? 'from-white to-amber-200' : 'from-gray-900 to-amber-600'} bg-clip-text text-transparent`}>
                  RESTAURANT SUBSCRIPTION PLANS
                </h1>
                <span className="text-lg">⭐</span>
              </div>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Restaurant Pricing Plans & Features Management</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => syncStripeMutation.mutate()}
                disabled={syncStripeMutation.isPending}
                className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white rounded-lg font-mono text-sm transition-all duration-300 shadow-[0_0_20px_rgba(147,51,234,0.3)] ${
                  syncStripeMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{syncStripeMutation.isPending ? 'SYNCING...' : 'SYNC STRIPE'}</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-lg font-mono text-sm transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                <PlusIcon className="h-4 w-4" />
                <span>CREATE PLAN</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 hover:border-amber-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>Total Plans</p>
                <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{stats.totalPlans}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </div>

          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 hover:border-amber-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>Monthly Revenue</p>
                <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>
                  {formatCurrency(stats.totalMonthlyRevenue)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500/20 to-amber-500/20 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 hover:border-amber-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>Total Subscribers</p>
                <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{stats.totalSubscribers}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg">
                <UsersIcon className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>

          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-6 hover:border-amber-400/50 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>Active Plans</p>
                <p className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>
                  {plans.filter(p => p.isActive).length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const subscriberCount = getPlanSubscribers(plan.id);
            const features = getPlanFeatures(plan);
            const isPopular = plan.name.toLowerCase().includes('professional') || plan.name.toLowerCase().includes('pro');

            return (
              <div
                key={plan.id}
                className={`relative ${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-100/50'} backdrop-blur border rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
                  isPopular 
                    ? 'border-amber-400/50 shadow-lg shadow-amber-400/25' 
                    : actualTheme === 'dark' ? 'border-gray-700/50 hover:border-amber-400/50' : 'border-gray-300/50 hover:border-amber-400/50'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      <StarSolidIcon className="h-3 w-3" />
                      <span>POPULAR</span>
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className={`text-xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{plan.displayName}</h3>
                      <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm font-mono`}>{plan.name}</p>
                    </div>
                                      <div className="flex items-center space-x-2">
                    {plan.isActive ? (
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    ) : (
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    )}
                    {plan.stripeProductId ? (
                      <div className="flex items-center space-x-1" title="Synced with Stripe">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <span className="text-xs text-purple-400 font-mono">STRIPE</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1" title="Not synced with Stripe">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-400 font-mono">NO STRIPE</span>
                      </div>
                    )}
                  </div>
                  </div>
                  
                  {plan.description && (
                    <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4`}>{plan.description}</p>
                  )}

                  <div className="flex items-baseline space-x-2">
                    <span className={`text-3xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>
                      {formatCurrency(Number(plan.price))}
                    </span>
                    <span className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                      /{plan.billingInterval.toLowerCase()}
                    </span>
                  </div>
                </div>

                                  {/* Plan Limits */}
                  <div className="mb-6">
                    <h4 className={`text-xs font-semibold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Plan Limits</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckIcon className="h-4 w-4 text-amber-400" />
                        <span className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {plan.maxMenuItems === -1 ? 'Unlimited' : plan.maxMenuItems} Menu Items
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckIcon className="h-4 w-4 text-amber-400" />
                        <span className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {plan.maxUsers} Admin Users
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckIcon className="h-4 w-4 text-amber-400" />
                        <span className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {plan.maxOrders === -1 ? 'Unlimited' : plan.maxOrders} Orders/month
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckIcon className="h-4 w-4 text-amber-400" />
                        <span className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {plan.maxLocations === -1 ? 'Unlimited' : plan.maxLocations} Location{plan.maxLocations > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckIcon className="h-4 w-4 text-amber-400" />
                        <span className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {plan.maxWaiters === -1 ? 'Unlimited' : plan.maxWaiters} AI Waiters
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Features */}
                  <div className="mb-6">
                    <h4 className={`text-xs font-semibold ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Features</h4>
                    <PlanFeaturesDisplay features={features} theme={actualTheme} />
                  </div>

                {/* Plan Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-200/50'} rounded-lg p-3`}>
                    <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Subscribers</p>
                    <p className={`text-lg font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{subscriberCount}</p>
                  </div>
                  <div className={`${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-200/50'} rounded-lg p-3`}>
                    <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Monthly Revenue</p>
                    <p className={`text-lg font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>
                      {formatCurrency(Number(plan.price) * subscriberCount)}
                    </p>
                  </div>
                  <div className={`${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-200/50'} rounded-lg p-3`}>
                    <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Sort Order</p>
                    <p className={`text-lg font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>{plan.sortOrder}</p>
                  </div>
                  <div className={`${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-200/50'} rounded-lg p-3`}>
                    <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Status</p>
                    <p className={`text-lg font-bold font-mono ${plan.isActive ? 'text-green-400' : 'text-red-400'}`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>

                {/* Plan Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(plan)}
                    className={`flex items-center space-x-1 px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-gray-300' : 'bg-gray-200/50 border-gray-400/50 text-gray-700'} border hover:text-cyan-400 hover:border-cyan-400/50 rounded-lg text-sm transition-all duration-300`}
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  
                  <button
                    onClick={() => router.push(`/super-admin/subscriptions/plans/${plan.id}`)}
                    className={`flex items-center space-x-1 px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-gray-300' : 'bg-gray-200/50 border-gray-400/50 text-gray-700'} border hover:text-cyan-400 hover:border-cyan-400/50 rounded-lg text-sm transition-all duration-300`}
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowDeleteModal(true);
                    }}
                    disabled={subscriberCount > 0}
                    className="flex items-center space-x-1 px-3 py-2 bg-red-900/50 border border-red-700/50 text-red-300 hover:text-red-200 hover:border-red-500/50 rounded-lg text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* Warning for plans with subscribers */}
                {subscriberCount > 0 && (
                  <div className="mt-3 flex items-center space-x-2 text-xs text-amber-400">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>Cannot delete plan with active subscribers</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {plans.length === 0 && (
          <div className="text-center py-12">
            <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} backdrop-blur border rounded-xl p-8 max-w-md mx-auto`}>
              <ChartBarIcon className={`h-12 w-12 ${actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mx-auto mb-4`} />
              <h3 className={`text-lg font-medium ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>No subscription plans</h3>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-4`}>Create your first subscription plan to get started.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-lg font-medium transition-all duration-300"
              >
                Create Plan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center p-4 z-50">
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/95 border-cyan-500/50' : 'bg-white/95 border-amber-400/50'} backdrop-blur border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            <form onSubmit={handleCreateSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>Create New Plan</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className={`${actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-amber-400 font-mono">Basic Information</h4>
                  
                  <div>
                    <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Plan Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      placeholder="e.g., STARTER, PROFESSIONAL"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Display Name</label>
                    <input
                      type="text"
                      required
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      placeholder="e.g., Starter Plan"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      rows={3}
                      placeholder="Plan description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                        placeholder="29.99"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Billing</label>
                      <select
                        value={formData.billingInterval}
                        onChange={(e) => setFormData(prev => ({ ...prev, billingInterval: e.target.value as 'MONTHLY' | 'YEARLY' }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white' : 'bg-gray-100/50 border-gray-300/50 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="YEARLY">Yearly</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Limits & Features */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-amber-400 font-mono">Limits & Features</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Max Locations</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.maxLocations}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxLocations: e.target.value }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Max Users</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.maxUsers}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: e.target.value }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Max Waiters</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.maxWaiters}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxWaiters: e.target.value }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Max Menu Items</label>
                      <input
                        type="number"
                        min="-1"
                        required
                        value={formData.maxMenuItems}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxMenuItems: e.target.value }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                        placeholder="-1 for unlimited"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Max Orders/Month</label>
                      <input
                        type="number"
                        min="-1"
                        required
                        value={formData.maxOrders}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxOrders: e.target.value }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                        placeholder="-1 for unlimited"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-3`}>Features</label>
                    <div className={`${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} border rounded-lg p-4`}>
                      <FeaturesSelector
                        value={formData.features}
                        onChange={(value) => setFormData(prev => ({ ...prev, features: value }))}
                        theme={actualTheme}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Sort Order</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: e.target.value }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      />
                    </div>

                    <div className="flex items-center space-x-2 mt-6">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className={`w-4 h-4 text-amber-600 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} rounded focus:ring-amber-400/50`}
                      />
                      <label htmlFor="isActive" className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Active Plan</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`flex items-center justify-end space-x-4 mt-8 pt-6 border-t ${actualTheme === 'dark' ? 'border-gray-700/50' : 'border-gray-300/50'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className={`px-6 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:text-white hover:border-gray-600/50' : 'bg-gray-200/50 border-gray-400/50 text-gray-700 hover:text-gray-900 hover:border-gray-500/50'} border rounded-lg transition-all duration-300`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center p-4 z-50">
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/95 border-cyan-500/50' : 'bg-white/95 border-amber-400/50'} backdrop-blur border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} font-mono`}>Edit Plan: {selectedPlan.displayName}</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPlan(null);
                    resetForm();
                  }}
                  className={`${actualTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Same form fields as create modal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-amber-400 font-mono">Basic Information</h4>
                  
                  <div>
                    <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Plan Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      placeholder="e.g., STARTER, PROFESSIONAL"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Display Name</label>
                    <input
                      type="text"
                      required
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      placeholder="e.g., Starter Plan"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      rows={3}
                      placeholder="Plan description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                        placeholder="29.99"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Billing</label>
                      <select
                        value={formData.billingInterval}
                        onChange={(e) => setFormData(prev => ({ ...prev, billingInterval: e.target.value as 'MONTHLY' | 'YEARLY' }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white' : 'bg-gray-100/50 border-gray-300/50 text-gray-900'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="YEARLY">Yearly</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Limits & Features */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-amber-400 font-mono">Limits & Features</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Max Locations</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.maxLocations}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxLocations: e.target.value }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Max Users</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.maxUsers}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: e.target.value }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Max Menu Items</label>
                      <input
                        type="number"
                        min="-1"
                        required
                        value={formData.maxMenuItems}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxMenuItems: e.target.value }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                        placeholder="-1 for unlimited"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Max Orders/Month</label>
                      <input
                        type="number"
                        min="-1"
                        required
                        value={formData.maxOrders}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxOrders: e.target.value }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                        placeholder="-1 for unlimited"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-3`}>Features</label>
                    <div className={`${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} border rounded-lg p-4`}>
                      <FeaturesSelector
                        value={formData.features}
                        onChange={(value) => setFormData(prev => ({ ...prev, features: value }))}
                        theme={actualTheme}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Sort Order</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: e.target.value }))}
                        className={`w-full px-3 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400' : 'bg-gray-100/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50`}
                      />
                    </div>

                    <div className="flex items-center space-x-2 mt-6">
                      <input
                        type="checkbox"
                        id="isActiveEdit"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className={`w-4 h-4 text-amber-600 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-300/50'} rounded focus:ring-amber-400/50`}
                      />
                      <label htmlFor="isActiveEdit" className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Active Plan</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`flex items-center justify-end space-x-4 mt-8 pt-6 border-t ${actualTheme === 'dark' ? 'border-gray-700/50' : 'border-gray-300/50'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPlan(null);
                    resetForm();
                  }}
                  className={`px-6 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:text-white hover:border-gray-600/50' : 'bg-gray-200/50 border-gray-400/50 text-gray-700 hover:text-gray-900 hover:border-gray-500/50'} border rounded-lg transition-all duration-300`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating...' : 'Update Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center p-4 z-50">
          <div className={`${actualTheme === 'dark' ? 'bg-gray-900/90 border-red-500/50' : 'bg-white/90 border-red-400/50'} backdrop-blur border rounded-xl p-6 max-w-md w-full`}>
            <div className="text-center">
              <div className="bg-red-500/20 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                <TrashIcon className="h-6 w-6 text-red-400 mx-auto" />
              </div>
              <h3 className={`text-lg font-medium ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Delete Plan</h3>
              <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                Are you sure you want to delete "{selectedPlan.displayName}"?
                {getPlanSubscribers(selectedPlan.id) > 0 && (
                  <span className="text-amber-400 block mt-2">
                    Warning: This plan has {getPlanSubscribers(selectedPlan.id)} active subscribers.
                  </span>
                )}
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPlan(null);
                  }}
                  className={`flex-1 px-4 py-2 ${actualTheme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/50' : 'bg-gray-200/50 border-gray-400/50 text-gray-700 hover:bg-gray-300/50'} border rounded-lg transition-all duration-300`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(false)}
                  disabled={getPlanSubscribers(selectedPlan.id) > 0}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
                {getPlanSubscribers(selectedPlan.id) > 0 && (
                  <button
                    onClick={() => handleDelete(true)}
                    className="flex-1 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-all duration-300"
                  >
                    Force Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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

    // Check if user has permission to manage plans
    if (!hasPermission(superAdmin.role, "canManagePlans")) {
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