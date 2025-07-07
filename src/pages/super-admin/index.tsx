import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { type GetServerSideProps } from "next";
import { api } from "@/utils/api";
import { getSuperAdminSessionFromCookies } from "@/utils/superAdminAuth";
import SuperAdminLayout from "@/components/SuperAdminLayout";
import { useTheme } from '@/contexts/ThemeContext';
import { hasPermission, getRoleDisplayName } from '@/utils/roles';

interface SuperAdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface Props {
  user: SuperAdminUser;
}

export default function SuperAdminDashboard({ user }: Props) {
  const router = useRouter();
  const { theme: actualTheme } = useTheme();
  const [ordersPage, setOrdersPage] = useState(1);
  const [restaurantsPage, setRestaurantsPage] = useState(1);

  // Check for access denied parameter
  const accessDenied = router.query.access === 'denied';

  // Fetch dashboard stats with pagination
  const { data: dashboardData, isLoading: statsLoading } = api.superAdmin.getDashboardStats.useQuery({
    ordersPage,
    ordersLimit: 10,
    restaurantsPage,
    restaurantsLimit: 5,
  });

  return (
    <>
      <Head>
        <title>👑 Super Admin Dashboard - Restaurant Platform</title>
        <meta name="description" content="Super Admin Dashboard - Platform Management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <SuperAdminLayout user={user}>
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <span className="text-4xl">👑</span>
              <h1 className={`text-4xl font-mono font-bold ${actualTheme === 'dark' ? 'bg-gradient-to-r from-white via-amber-200 to-orange-200' : 'bg-gradient-to-r from-gray-900 via-amber-600 to-orange-600'} bg-clip-text text-transparent`}>
                {hasPermission(user.role, 'canManageSettings') ? 'RESTAURANT COMMAND CENTER' : 'CUSTOMER SUPPORT CENTER'}
              </h1>
            </div>
            <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono text-lg`}>
              {hasPermission(user.role, 'canManageSettings') ? 'Platform Administration Interface' : 'Customer Support Dashboard'}
            </p>
            {!hasPermission(user.role, 'canManageSettings') && (
              <div className={`mt-4 mx-auto max-w-2xl p-4 rounded-lg ${actualTheme === 'dark' ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
                <p className={`text-sm ${actualTheme === 'dark' ? 'text-blue-300' : 'text-blue-700'} font-mono`}>
                  Welcome, {getRoleDisplayName(user.role)}! You have access to customer support features including restaurant management, subscription assistance, and knowledge base management.
                </p>
              </div>
            )}
            {accessDenied && (
              <div className={`mt-4 mx-auto max-w-2xl p-4 rounded-lg ${actualTheme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${actualTheme === 'dark' ? 'text-red-300' : 'text-red-700'} font-mono`}>
                      <strong>Access Denied:</strong> You don't have permission to access that page. As a {getRoleDisplayName(user.role)}, you can only access the features shown in the navigation menu.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          {statsLoading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className={`${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-mono`}>LOADING SYSTEM DATA...</p>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-xl p-6 hover:border-amber-600/50 transition-all duration-300`}>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🏪</span>
                    </div>
                    <div className="ml-4">
                      <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>RESTAURANTS</p>
                      <p className="text-3xl font-bold text-amber-400 font-mono">
                        {dashboardData?.stats.totalRestaurants ?? 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-xl p-6 hover:border-orange-600/50 transition-all duration-300`}>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="ml-4">
                      <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>ADMINS</p>
                      <p className="text-3xl font-bold text-orange-400 font-mono">
                        {dashboardData?.stats.totalAdmins ?? 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-xl p-6 hover:border-green-400/50 transition-all duration-300`}>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🍽️</span>
                    </div>
                    <div className="ml-4">
                      <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>MENU ITEMS</p>
                      <p className="text-3xl font-bold text-green-300 font-mono">
                        {dashboardData?.stats.totalMenuItems ?? 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-xl p-6 hover:border-yellow-400/50 transition-all duration-300`}>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📋</span>
                    </div>
                    <div className="ml-4">
                      <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>ORDERS</p>
                      <p className="text-3xl font-bold text-yellow-300 font-mono">
                        {dashboardData?.stats.totalOrders ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders and Top Restaurants */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-xl`}>
                  <div className={`px-6 py-4 border-b ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} flex justify-between items-center`}>
                    <h3 className="text-lg font-mono font-bold text-amber-400">RECENT ORDERS</h3>
                    {dashboardData?.ordersPagination && (
                      <span className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                        {dashboardData.ordersPagination.page}/{dashboardData.ordersPagination.pages}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    {dashboardData?.recentOrders && dashboardData.recentOrders.length > 0 ? (
                      <>
                        <div className="space-y-4">
                          {dashboardData.recentOrders.map((order) => (
                            <div key={order.id} className={`flex items-center justify-between p-4 ${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'} rounded-xl border ${actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} hover:border-amber-600/50 transition-all duration-300`}>
                              <div>
                                <p className={`font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>#{order.id.slice(-6)}</p>
                                <p className="text-sm text-amber-400 font-mono">{order.restaurant.name}</p>
                                <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-bold text-green-300">${Number(order.total).toFixed(2)}</p>
                                <span className={`inline-block px-3 py-1 text-xs rounded-full font-mono ${
                                  order.status === 'SERVED' ? 'bg-gray-500/20 text-gray-500 border border-gray-400/30' :
                                  order.status === 'PREPARING' ? 'bg-blue-500/20 text-blue-500 border border-blue-400/30' :
                                  order.status === 'READY' ? 'bg-green-500/20 text-green-500 border border-green-400/30' :
                                  'bg-yellow-500/20 text-yellow-500 border border-yellow-400/30'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Orders Pagination */}
                        {dashboardData.ordersPagination && dashboardData.ordersPagination.pages > 1 && (
                          <div className="mt-6 flex justify-between items-center">
                            <div className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                              {dashboardData.ordersPagination.total} total orders
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setOrdersPage(prev => Math.max(1, prev - 1))}
                                disabled={ordersPage === 1}
                                className={`px-3 py-1 ${actualTheme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'} border rounded-lg hover:border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm transition-all duration-300`}
                              >
                                PREV
                              </button>
                              <button
                                onClick={() => setOrdersPage(prev => prev + 1)}
                                disabled={ordersPage >= (dashboardData.ordersPagination?.pages ?? 1)}
                                className={`px-3 py-1 ${actualTheme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'} border rounded-lg hover:border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm transition-all duration-300`}
                              >
                                NEXT
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>NO RECENT ORDERS</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Restaurants */}
                <div className={`${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-xl`}>
                  <div className={`px-6 py-4 border-b ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} flex justify-between items-center`}>
                    <h3 className="text-lg font-mono font-bold text-orange-400">TOP RESTAURANTS</h3>
                    {dashboardData?.restaurantsPagination && (
                      <span className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                        {dashboardData.restaurantsPagination.page}/{dashboardData.restaurantsPagination.pages}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    {dashboardData?.topRestaurants && dashboardData.topRestaurants.length > 0 ? (
                      <>
                        <div className="space-y-4">
                          {dashboardData.topRestaurants.map((restaurant, index) => (
                            <div key={restaurant.id} className={`flex items-center justify-between p-4 ${actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'} rounded-xl border ${actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} hover:border-orange-600/50 transition-all duration-300`}>
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center mr-3">
                                  <span className="text-white font-mono font-bold text-sm">#{index + 1}</span>
                                </div>
                                <div>
                                  <p className={`font-mono font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{restaurant.name}</p>
                                  <p className="text-sm text-orange-400 font-mono">{restaurant.subdomain}.restaurant.com</p>
                                  <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                                    {restaurant._count.orders} orders
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-bold text-green-300">
                                  ${restaurant._count.orders > 0 ? '2,500' : '0'}.00
                                </p>
                                <p className={`text-xs ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Revenue</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Restaurants Pagination */}
                        {dashboardData.restaurantsPagination && dashboardData.restaurantsPagination.pages > 1 && (
                          <div className="mt-6 flex justify-between items-center">
                            <div className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>
                              {dashboardData.restaurantsPagination.total} total restaurants
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setRestaurantsPage(prev => Math.max(1, prev - 1))}
                                disabled={restaurantsPage === 1}
                                className={`px-3 py-1 ${actualTheme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'} border rounded-lg hover:border-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm transition-all duration-300`}
                              >
                                PREV
                              </button>
                              <button
                                onClick={() => setRestaurantsPage(prev => prev + 1)}
                                disabled={restaurantsPage >= (dashboardData.restaurantsPagination?.pages ?? 1)}
                                className={`px-3 py-1 ${actualTheme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'} border rounded-lg hover:border-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm transition-all duration-300`}
                              >
                                NEXT
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>NO RESTAURANTS FOUND</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <button 
                  onClick={() => router.push('/super-admin/restaurants')}
                  className={`p-6 ${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-xl hover:border-amber-600/50 transition-all duration-300 text-left group`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-xl">🏪</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-mono font-bold text-amber-400">MANAGE RESTAURANTS</h3>
                      <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>View and configure restaurants</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/super-admin/subscriptions')}
                  className={`p-6 ${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-xl hover:border-yellow-400/50 transition-all duration-300 text-left group`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-xl">💳</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-mono font-bold text-yellow-300">SUBSCRIPTION MANAGEMENT</h3>
                      <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Billing, plans & analytics</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/super-admin/admins')}
                  className={`p-6 ${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-xl hover:border-orange-600/50 transition-all duration-300 text-left group`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-xl">👥</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-mono font-bold text-orange-400">MANAGE ADMINS</h3>
                      <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>User administration panel</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/super-admin/settings')}
                  className={`p-6 ${actualTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white/50'} backdrop-blur-sm border ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-xl hover:border-green-400/50 transition-all duration-300 text-left group`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-xl">⚙️</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-mono font-bold text-green-300">SYSTEM SETTINGS</h3>
                      <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Platform configuration</p>
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </SuperAdminLayout>
    </>
  );
}

// Server-side authentication check
export const getServerSideProps: GetServerSideProps = async (context) => {
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

    return {
      props: {
        user: {
          id: session.id,
          email: session.email,
          name: session.name,
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