import { type GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import { getAdminSessionFromCookies, type AdminSession } from "@/utils/auth";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/utils/api";
import { OrderStatus } from "@prisma/client";
import { 
  getOrderStatusLabel, 
  getOrderStatusColor, 
  formatOrderTime,
  formatPrice,
  estimatePreparationTime 
} from "@/utils/orderProcessing";
import { getMenuItemImageUrl, getMenuItemImageAlt } from "@/utils/fallback-image";
import { useTheme } from "@/contexts/ThemeContext";
import Head from "next/head";

interface KitchenDashboardProps {
  session: AdminSession;
}

export default function KitchenDashboard({ session }: KitchenDashboardProps) {
  const { actualTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Separate pagination for each status
  const [pendingPage, setPendingPage] = useState(1);
  const [preparingPage, setPreparingPage] = useState(1);
  const [readyPage, setReadyPage] = useState(1);
  const itemsPerPage = 10; // Smaller per column since we have 3 columns

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Separate queries for each status
  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } = api.order.getRecent.useQuery({
    status: OrderStatus.PENDING,
    limit: itemsPerPage,
    offset: (pendingPage - 1) * itemsPerPage,
  }, {
    refetchInterval: 10000, // Refresh every 10 seconds for live updates
  });

  const { data: preparingData, isLoading: preparingLoading, refetch: refetchPreparing } = api.order.getRecent.useQuery({
    status: OrderStatus.PREPARING,
    limit: itemsPerPage,
    offset: (preparingPage - 1) * itemsPerPage,
  }, {
    refetchInterval: 10000,
  });

  const { data: readyData, isLoading: readyLoading, refetch: refetchReady } = api.order.getRecent.useQuery({
    status: OrderStatus.READY,
    limit: itemsPerPage,
    offset: (readyPage - 1) * itemsPerPage,
  }, {
    refetchInterval: 10000,
  });

  const pendingOrders = pendingData?.orders || [];
  const preparingOrders = preparingData?.orders || [];
  const readyOrders = readyData?.orders || [];

  const pendingTotal = pendingData?.totalCount || 0;
  const preparingTotal = preparingData?.totalCount || 0;
  const readyTotal = readyData?.totalCount || 0;

  const pendingPages = Math.ceil(pendingTotal / itemsPerPage);
  const preparingPages = Math.ceil(preparingTotal / itemsPerPage);
  const readyPages = Math.ceil(readyTotal / itemsPerPage);

  const isLoading = pendingLoading || preparingLoading || readyLoading;

  const updateStatusMutation = api.order.updateStatus.useMutation({
    onSuccess: () => {
      // Refetch all status queries to ensure data consistency
      void refetchPending();
      void refetchPreparing();
      void refetchReady();
    },
  });

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handlePendingPageChange = (page: number) => {
    setPendingPage(page);
  };

  const handlePreparingPageChange = (page: number) => {
    setPreparingPage(page);
  };

  const handleReadyPageChange = (page: number) => {
    setReadyPage(page);
  };

  const getTimeSinceOrder = (orderTime: Date) => {
    const diffInMinutes = Math.floor((currentTime.getTime() - orderTime.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes === 1) return "1 min ago";
    return `${diffInMinutes} mins ago`;
  };

  const getUrgencyColor = (orderTime: Date, status: OrderStatus) => {
    const diffInMinutes = Math.floor((currentTime.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (status === OrderStatus.PENDING && diffInMinutes > 15) return "border-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
    if (status === OrderStatus.PREPARING && diffInMinutes > 30) return "border-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
    if (status === OrderStatus.READY && diffInMinutes > 10) return "border-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
    
    if (diffInMinutes > 10) return "border-yellow-400/50 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.3)]";
    return actualTheme === 'dark' 
      ? "border-gray-700/50 bg-gray-900/50 hover:bg-gray-800/50"
      : "border-gray-300/50 bg-white/50 hover:bg-gray-100/50";
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <style jsx global>{`
            * {
              scrollbar-width: thin !important;
              scrollbar-color: ${actualTheme === 'dark' ? '#f97316 #111827' : '#6b7280 #f3f4f6'} !important;
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
              background: ${actualTheme === 'dark' ? 'linear-gradient(45deg, #f97316, #eab308)' : 'linear-gradient(45deg, #9ca3af, #6b7280)'} !important;
              border-radius: 4px !important;
            }
            *::-webkit-scrollbar-thumb:hover {
              background: ${actualTheme === 'dark' ? 'linear-gradient(45deg, #ea580c, #ca8a04)' : 'linear-gradient(45deg, #6b7280, #4b5563)'} !important;
            }
            html, body {
              color-scheme: ${actualTheme === 'dark' ? 'dark' : 'light'} !important;
            }
          `}</style>
        </Head>
        <AdminLayout session={session} title="NEXUS Kitchen Dashboard">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
            <p className={`ml-4 font-mono ${
              actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>LOADING KITCHEN...</p>
          </div>
        </AdminLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <style jsx global>{`
          * {
            scrollbar-width: thin !important;
            scrollbar-color: ${actualTheme === 'dark' ? '#f97316 #111827' : '#6b7280 #f3f4f6'} !important;
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
            background: ${actualTheme === 'dark' ? 'linear-gradient(45deg, #f97316, #eab308)' : 'linear-gradient(45deg, #9ca3af, #6b7280)'} !important;
            border-radius: 4px !important;
          }
          *::-webkit-scrollbar-thumb:hover {
            background: ${actualTheme === 'dark' ? 'linear-gradient(45deg, #ea580c, #ca8a04)' : 'linear-gradient(45deg, #6b7280, #4b5563)'} !important;
          }
          html, body {
            color-scheme: ${actualTheme === 'dark' ? 'dark' : 'light'} !important;
          }
        `}</style>
      </Head>
      
      <AdminLayout session={session} title="NEXUS Kitchen Dashboard">
        <div className="space-y-6">
          {/* Header with Live Clock */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm font-mono">K</span>
              </div>
              <div>
                <h2 className={`text-2xl font-mono font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                  actualTheme === 'dark' 
                    ? 'from-white to-cyan-200' 
                    : 'from-gray-800 to-gray-900'
                }`}>
                  KITCHEN DASHBOARD
                </h2>
                <p className={`font-mono ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Live order management for kitchen staff</p>
              </div>
            </div>
            <div className={`text-right backdrop-blur-sm border rounded-xl p-4 ${
              actualTheme === 'dark'
                ? 'bg-gray-900/50 border-gray-800'
                : 'bg-white/50 border-gray-200'
            }`}>
              <div className={`text-2xl font-mono font-bold ${
                actualTheme === 'dark' ? 'text-blue-300' : 'text-blue-600'
              }`}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className={`text-sm font-mono ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <span className={actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}>{pendingTotal + preparingTotal + readyTotal}</span> TOTAL ACTIVE ORDERS
              </div>
              <div className={`text-xs mt-1 font-mono ${
                actualTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>
                <span className="text-yellow-500">{pendingTotal}</span> PENDING • <span className="text-blue-500">{preparingTotal}</span> PREPARING • <span className="text-green-500">{readyTotal}</span> READY
              </div>
            </div>
          </div>

          {/* Order Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen">
            {/* Pending Orders */}
            <div className="space-y-4">
              <div className={`px-6 py-4 rounded-xl ${
                actualTheme === 'dark'
                  ? 'bg-yellow-500/20 border border-yellow-400/30'
                  : 'bg-yellow-100 border border-yellow-300'
              }`}>
                <h3 className={`text-lg font-mono font-bold ${
                  actualTheme === 'dark' ? 'text-yellow-300' : 'text-yellow-800'
                }`}>
                  🕐 PENDING ({pendingTotal})
                </h3>
                <p className={`text-sm font-mono ${
                  actualTheme === 'dark' ? 'text-yellow-200' : 'text-yellow-700'
                }`}>New orders waiting to start</p>
                {pendingPages > 1 && (
                  <p className={`text-xs mt-1 font-mono ${
                    actualTheme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                  }`}>
                    PAGE {pendingPage} OF {pendingPages}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {pendingOrders.map((order) => {
                  const diffInMinutes = Math.floor((currentTime.getTime() - order.createdAt.getTime()) / (1000 * 60));
                  const isUrgent = diffInMinutes > 15;
                  
                  return (
                    <div key={order.id} className={`p-4 rounded-xl border-2 backdrop-blur-sm transition-all ${
                      isUrgent 
                        ? 'border-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                        : actualTheme === 'dark'
                        ? 'border-gray-700 bg-gray-900/50 hover:bg-gray-800/50'
                        : 'border-gray-300 bg-white/50 hover:bg-gray-100/50'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className={`text-lg font-mono font-bold ${
                            actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            TABLE {order.tableNumber}
                          </div>
                          <div className={`text-sm font-mono ${
                            isUrgent 
                              ? 'text-red-500' 
                              : actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {getTimeSinceOrder(order.createdAt)}
                          </div>
                          {order.customerName && (
                            <div className="text-sm text-blue-500 font-mono">
                              {order.customerName}
                            </div>
                          )}
                        </div>
                        <div className="text-lg font-mono font-bold text-green-500">
                          {formatPrice(order.total)}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {order.items.map((item, index) => (
                          <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${
                            actualTheme === 'dark'
                              ? 'bg-gray-800/30 border-gray-700/50'
                              : 'bg-gray-100/50 border-gray-300/50'
                          }`}>
                            <img
                              src={getMenuItemImageUrl(item.menuItem)}
                              alt={getMenuItemImageAlt(item.menuItem)}
                              className={`w-12 h-12 object-cover rounded-lg border ${
                                actualTheme === 'dark' ? 'border-gray-600/50' : 'border-gray-400/50'
                              }`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-400/30 text-xs rounded-full w-6 h-6 inline-flex items-center justify-center font-bold">
                                  {item.quantity}
                                </span>
                                <span className={`font-mono ${
                                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>{item.menuItem.name}</span>
                              </div>
                              {item.notes && (
                                <div className={`text-sm italic mt-1 ${
                                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  &quot;{item.notes}&quot;
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className={`mb-4 p-2 border-l-4 border-yellow-500 rounded ${
                          actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-yellow-50'
                        }`}>
                          <div className={`text-sm font-mono ${
                            actualTheme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'
                          }`}>
                            <strong>Order Note:</strong> {order.notes}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate(order.id, OrderStatus.PREPARING)}
                          disabled={updateStatusMutation.isPending}
                          className="flex-1 bg-blue-500/20 text-blue-500 border border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50 py-2 px-4 rounded-lg font-mono font-medium disabled:opacity-50 transition-all duration-300"
                        >
                          START PREP
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, OrderStatus.CANCELLED)}
                          disabled={updateStatusMutation.isPending}
                          className="bg-red-500/20 text-red-500 border border-red-400/30 hover:bg-red-500/30 hover:border-red-400/50 py-2 px-3 rounded-lg disabled:opacity-50 transition-all duration-300"
                          title="Cancel Order"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {pendingOrders.length === 0 && (
                  <div className={`text-center py-8 rounded-xl border ${
                    actualTheme === 'dark'
                      ? 'text-gray-400 bg-gray-900/50 border-gray-800'
                      : 'text-gray-600 bg-white/50 border-gray-200'
                  }`}>
                    <div className="text-4xl mb-2">✅</div>
                    <div className="font-mono">No pending orders</div>
                  </div>
                )}

                {/* Pending Pagination */}
                {pendingPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-4">
                    <button
                      onClick={() => handlePendingPageChange(pendingPage - 1)}
                      disabled={pendingPage <= 1}
                      className={`px-3 py-1 text-sm border rounded hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed font-mono ${
                        actualTheme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      ←
                    </button>
                    <span className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-500 border border-yellow-400/30 rounded font-mono">
                      {pendingPage} / {pendingPages}
                    </span>
                    <button
                      onClick={() => handlePendingPageChange(pendingPage + 1)}
                      disabled={pendingPage >= pendingPages}
                      className={`px-3 py-1 text-sm border rounded hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed font-mono ${
                        actualTheme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Preparing Orders */}
            <div className="space-y-4">
              <div className={`px-6 py-4 rounded-xl ${
                actualTheme === 'dark'
                  ? 'bg-blue-500/20 border border-blue-400/30'
                  : 'bg-blue-100 border border-blue-300'
              }`}>
                <h3 className={`text-lg font-mono font-bold ${
                  actualTheme === 'dark' ? 'text-blue-300' : 'text-blue-800'
                }`}>
                  👨‍🍳 PREPARING ({preparingTotal})
                </h3>
                <p className={`text-sm font-mono ${
                  actualTheme === 'dark' ? 'text-blue-200' : 'text-blue-700'
                }`}>Orders currently being made</p>
                {preparingPages > 1 && (
                  <p className={`text-xs mt-1 font-mono ${
                    actualTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    PAGE {preparingPage} OF {preparingPages}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {preparingOrders.map((order) => {
                  const diffInMinutes = Math.floor((currentTime.getTime() - order.createdAt.getTime()) / (1000 * 60));
                  const isUrgent = diffInMinutes > 30;
                  
                  return (
                    <div key={order.id} className={`p-4 rounded-xl border-2 backdrop-blur-sm transition-all ${
                      isUrgent 
                        ? 'border-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                        : actualTheme === 'dark'
                        ? 'border-gray-700 bg-gray-900/50 hover:bg-gray-800/50'
                        : 'border-gray-300 bg-white/50 hover:bg-gray-100/50'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className={`text-lg font-mono font-bold ${
                            actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            TABLE {order.tableNumber}
                          </div>
                          <div className={`text-sm font-mono ${
                            isUrgent 
                              ? 'text-red-500' 
                              : actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {getTimeSinceOrder(order.createdAt)}
                          </div>
                          {order.customerName && (
                            <div className="text-sm text-blue-500 font-mono">
                              {order.customerName}
                            </div>
                          )}
                        </div>
                        <div className="text-lg font-mono font-bold text-green-500">
                          {formatPrice(order.total)}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {order.items.map((item, index) => (
                          <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${
                            actualTheme === 'dark'
                              ? 'bg-gray-800/30 border-gray-700/50'
                              : 'bg-gray-100/50 border-gray-300/50'
                          }`}>
                            <img
                              src={getMenuItemImageUrl(item.menuItem)}
                              alt={getMenuItemImageAlt(item.menuItem)}
                              className={`w-12 h-12 object-cover rounded-lg border ${
                                actualTheme === 'dark' ? 'border-gray-600/50' : 'border-gray-400/50'
                              }`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-500/20 text-blue-500 border border-blue-400/30 text-xs rounded-full w-6 h-6 inline-flex items-center justify-center font-bold">
                                  {item.quantity}
                                </span>
                                <span className={`font-mono ${
                                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>{item.menuItem.name}</span>
                              </div>
                              {item.notes && (
                                <div className={`text-sm italic mt-1 ${
                                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  &quot;{item.notes}&quot;
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className={`mb-4 p-2 border-l-4 border-blue-500 rounded ${
                          actualTheme === 'dark' ? 'bg-gray-800/50' : 'bg-blue-50'
                        }`}>
                          <div className={`text-sm font-mono ${
                            actualTheme === 'dark' ? 'text-blue-200' : 'text-blue-800'
                          }`}>
                            <strong>Order Note:</strong> {order.notes}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate(order.id, OrderStatus.READY)}
                          disabled={updateStatusMutation.isPending}
                          className="flex-1 bg-green-500/20 text-green-500 border border-green-400/30 hover:bg-green-500/30 hover:border-green-400/50 py-2 px-4 rounded-lg font-mono font-medium disabled:opacity-50 transition-all duration-300"
                        >
                          MARK READY
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, OrderStatus.CANCELLED)}
                          disabled={updateStatusMutation.isPending}
                          className="bg-red-500/20 text-red-500 border border-red-400/30 hover:bg-red-500/30 hover:border-red-400/50 py-2 px-3 rounded-lg disabled:opacity-50 transition-all duration-300"
                          title="Cancel Order"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {preparingOrders.length === 0 && (
                  <div className={`text-center py-8 rounded-xl border ${
                    actualTheme === 'dark'
                      ? 'text-gray-400 bg-gray-900/50 border-gray-800'
                      : 'text-gray-600 bg-white/50 border-gray-200'
                  }`}>
                    <div className="text-4xl mb-2">👨‍🍳</div>
                    <div className="font-mono">No orders being prepared</div>
                  </div>
                )}

                {/* Preparing Pagination */}
                {preparingPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-4">
                    <button
                      onClick={() => handlePreparingPageChange(preparingPage - 1)}
                      disabled={preparingPage <= 1}
                      className={`px-3 py-1 text-sm border rounded hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed font-mono ${
                        actualTheme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      ←
                    </button>
                    <span className="px-3 py-1 text-sm bg-blue-500/20 text-blue-500 border border-blue-400/30 rounded font-mono">
                      {preparingPage} / {preparingPages}
                    </span>
                    <button
                      onClick={() => handlePreparingPageChange(preparingPage + 1)}
                      disabled={preparingPage >= preparingPages}
                      className={`px-3 py-1 text-sm border rounded hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed font-mono ${
                        actualTheme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Ready Orders */}
            <div className="space-y-4">
              <div className={`px-6 py-4 rounded-xl ${
                actualTheme === 'dark'
                  ? 'bg-green-500/20 border border-green-400/30'
                  : 'bg-green-100 border border-green-300'
              }`}>
                <h3 className={`text-lg font-mono font-bold ${
                  actualTheme === 'dark' ? 'text-green-300' : 'text-green-800'
                }`}>
                  ✅ READY ({readyTotal})
                </h3>
                <p className={`text-sm font-mono ${
                  actualTheme === 'dark' ? 'text-green-200' : 'text-green-700'
                }`}>Orders ready for pickup</p>
                {readyPages > 1 && (
                  <p className={`text-xs mt-1 font-mono ${
                    actualTheme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`}>
                    PAGE {readyPage} OF {readyPages}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {readyOrders.map((order) => {
                  const diffInMinutes = Math.floor((currentTime.getTime() - order.createdAt.getTime()) / (1000 * 60));
                  const isOverdue = diffInMinutes > 10;
                  
                  return (
                    <div key={order.id} className={`p-4 rounded-xl border-2 backdrop-blur-sm transition-all ${
                      isOverdue 
                        ? 'border-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                        : 'border-green-400/50 bg-gray-900/50 hover:bg-gray-800/50'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-lg font-mono font-bold text-white">
                            TABLE {order.tableNumber}
                          </div>
                          <div className={`text-sm font-mono ${isOverdue ? 'text-red-300' : 'text-gray-400'}`}>
                            {getTimeSinceOrder(order.createdAt)}
                          </div>
                          {order.customerName && (
                            <div className="text-sm text-amber-300 font-mono">
                              {order.customerName}
                            </div>
                          )}
                        </div>
                        <div className="text-lg font-mono font-bold text-green-300">
                          {formatPrice(order.total)}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-3 bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
                            <img
                              src={getMenuItemImageUrl(item.menuItem)}
                              alt={getMenuItemImageAlt(item.menuItem)}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-600/50"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full w-6 h-6 inline-flex items-center justify-center font-bold">
                                  {item.quantity}
                                </span>
                                <span className="font-mono text-white">{item.menuItem.name}</span>
                              </div>
                              {item.notes && (
                                <div className="text-sm text-gray-400 italic mt-1">
                                  &quot;{item.notes}&quot;
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className="mb-4 p-2 bg-gray-800/50 border-l-4 border-green-400 rounded">
                          <div className="text-sm text-green-200 font-mono">
                            <strong>Order Note:</strong> {order.notes}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate(order.id, OrderStatus.DELIVERED)}
                          disabled={updateStatusMutation.isPending}
                          className="flex-1 bg-gray-500/20 text-gray-500 border border-gray-400/30 hover:bg-gray-500/30 hover:border-gray-400/50 py-2 px-4 rounded-lg font-mono font-medium disabled:opacity-50 transition-all duration-300"
                        >
                          MARK SERVED
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order.id, OrderStatus.CANCELLED)}
                          disabled={updateStatusMutation.isPending}
                          className="bg-red-500/20 text-red-500 border border-red-400/30 hover:bg-red-500/30 hover:border-red-400/50 py-2 px-3 rounded-lg disabled:opacity-50 transition-all duration-300"
                          title="Cancel Order"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {readyOrders.length === 0 && (
                  <div className="text-center py-8 text-gray-400 bg-gray-900/50 rounded-xl border border-gray-800">
                    <div className="text-4xl mb-2">🍽️</div>
                    <div className="font-mono">No orders ready</div>
                  </div>
                )}

                {/* Ready Pagination */}
                {readyPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-4">
                    <button
                      onClick={() => handleReadyPageChange(readyPage - 1)}
                      disabled={readyPage <= 1}
                      className="px-3 py-1 text-sm bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono"
                    >
                      ←
                    </button>
                    <span className="px-3 py-1 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white border border-green-400 rounded font-mono">
                      {readyPage} / {readyPages}
                    </span>
                    <button
                      onClick={() => handleReadyPageChange(readyPage + 1)}
                      disabled={readyPage >= readyPages}
                      className="px-3 py-1 text-sm bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono"
                    >
                      →
                    </button>
                  </div>
                )}
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
  
  if (!session) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
}; 