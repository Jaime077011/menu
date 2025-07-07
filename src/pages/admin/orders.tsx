import { type GetServerSideProps } from "next";
import { useState } from "react";
import { getAdminSessionFromCookies, type AdminSession } from "@/utils/auth";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/utils/api";
import { OrderStatus } from "@prisma/client";
import { 
  getOrderStatusLabel, 
  getOrderStatusColor, 
  formatOrderTime,
  formatPrice 
} from "@/utils/orderProcessing";
import { ORDER_STATUS_LABELS } from "@/utils/orderValidation";
import { useTheme } from "@/contexts/ThemeContext";

interface OrdersManagementProps {
  session: AdminSession;
}

export default function OrdersManagement({ session }: OrdersManagementProps) {
  const { actualTheme } = useTheme();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // tRPC queries
  const { data: ordersData, isLoading, refetch } = api.order.getRecent.useQuery({
    ...(statusFilter !== "ALL" && { status: statusFilter }),
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
  });

  const orders = ordersData?.orders || [];
  const totalCount = ordersData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const { data: stats } = api.order.getStats.useQuery();

  const updateStatusMutation = api.order.updateStatus.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleFilterChange = (newFilter: OrderStatus | "ALL") => {
    setStatusFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <AdminLayout session={session} title="NEXUS Orders Management">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          <p className={`ml-4 font-mono ${
            actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>LOADING ORDERS...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout session={session} title="NEXUS Orders Management">
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className={`backdrop-blur-sm border rounded-xl p-5 hover:border-blue-400/30 transition-all duration-300 ${
              actualTheme === 'dark' 
                ? 'bg-gray-900/50 border-gray-800' 
                : 'bg-white/50 border-gray-200'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className={`text-sm font-mono truncate ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      TODAY'S ORDERS
                    </dt>
                    <dd className={`text-xl font-mono font-bold ${
                      actualTheme === 'dark' ? 'text-blue-300' : 'text-blue-600'
                    }`}>
                      {stats.totalOrdersToday}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className={`backdrop-blur-sm border rounded-xl p-5 hover:border-yellow-400/30 transition-all duration-300 ${
              actualTheme === 'dark' 
                ? 'bg-gray-900/50 border-gray-800' 
                : 'bg-white/50 border-gray-200'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">⏳</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className={`text-sm font-mono truncate ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      PENDING
                    </dt>
                    <dd className={`text-xl font-mono font-bold ${
                      actualTheme === 'dark' ? 'text-yellow-300' : 'text-yellow-600'
                    }`}>
                      {stats.pendingOrders}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className={`backdrop-blur-sm border rounded-xl p-5 hover:border-blue-400/30 transition-all duration-300 ${
              actualTheme === 'dark' 
                ? 'bg-gray-900/50 border-gray-800' 
                : 'bg-white/50 border-gray-200'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">👨‍🍳</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className={`text-sm font-mono truncate ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      PREPARING
                    </dt>
                    <dd className={`text-xl font-mono font-bold ${
                      actualTheme === 'dark' ? 'text-blue-300' : 'text-blue-600'
                    }`}>
                      {stats.preparingOrders}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className={`backdrop-blur-sm border rounded-xl p-5 hover:border-green-400/30 transition-all duration-300 ${
              actualTheme === 'dark' 
                ? 'bg-gray-900/50 border-gray-800' 
                : 'bg-white/50 border-gray-200'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">✅</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className={`text-sm font-mono truncate ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      READY
                    </dt>
                    <dd className={`text-xl font-mono font-bold ${
                      actualTheme === 'dark' ? 'text-green-300' : 'text-green-600'
                    }`}>
                      {stats.readyOrders}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className={`backdrop-blur-sm border rounded-xl p-5 hover:border-green-400/30 transition-all duration-300 ${
              actualTheme === 'dark' 
                ? 'bg-gray-900/50 border-gray-800' 
                : 'bg-white/50 border-gray-200'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">💰</span>
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className={`text-sm font-mono truncate ${
                      actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      REVENUE TODAY
                    </dt>
                    <dd className={`text-xl font-mono font-bold ${
                      actualTheme === 'dark' ? 'text-green-300' : 'text-green-600'
                    }`}>
                      {formatPrice(stats.totalRevenueToday)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header and Filters */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm font-mono">O</span>
            </div>
            <div>
              <h2 className={`text-2xl font-mono font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                actualTheme === 'dark' 
                  ? 'from-white to-cyan-200' 
                  : 'from-gray-800 to-gray-900'
              }`}>
                RECENT ORDERS
              </h2>
              <p className={`font-mono ${
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Manage and track all restaurant orders</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value as OrderStatus | "ALL")}
              className={`border rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono ${
                actualTheme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700 text-white'
                  : 'bg-gray-50/50 border-gray-300 text-gray-900'
              }`}
            >
              <option value="ALL">ALL ORDERS</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                <option key={status} value={status}>{String(label).toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className={`backdrop-blur-sm rounded-xl overflow-hidden ${
          actualTheme === 'dark'
            ? 'bg-gray-900/50 border border-gray-800'
            : 'bg-white/50 border border-gray-200'
        }`}>
          <table className={`min-w-full ${
            actualTheme === 'dark' ? 'divide-y divide-gray-800/50' : 'divide-y divide-gray-200/50'
          }`}>
            <thead className={
              actualTheme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50/30'
            }>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-mono font-bold uppercase tracking-wider ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  ORDER DETAILS
                </th>
                <th className={`px-6 py-3 text-left text-xs font-mono font-bold uppercase tracking-wider ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  CUSTOMER
                </th>
                <th className={`px-6 py-3 text-left text-xs font-mono font-bold uppercase tracking-wider ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  ITEMS
                </th>
                <th className={`px-6 py-3 text-left text-xs font-mono font-bold uppercase tracking-wider ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  TOTAL
                </th>
                <th className={`px-6 py-3 text-left text-xs font-mono font-bold uppercase tracking-wider ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  STATUS
                </th>
                <th className={`px-6 py-3 text-right text-xs font-mono font-bold uppercase tracking-wider ${
                  actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className={
              actualTheme === 'dark' ? 'divide-y divide-gray-800/30' : 'divide-y divide-gray-200/30'
            }>
              {orders?.map((order) => (
                <tr key={order.id} className={`transition-colors ${
                  actualTheme === 'dark' ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50/30'
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className={`text-sm font-mono font-bold ${
                        actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        #{order.id.slice(-8)}
                      </div>
                      <div className={`text-sm font-mono ${
                        actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        TABLE <span className="text-cyan-500">{order.tableNumber}</span> • {formatOrderTime(order.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-mono ${
                      actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {order.customerName || "ANONYMOUS"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-mono ${
                      actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          <span className="text-cyan-500">{item.quantity}x</span>
                          <span>{item.menuItem.name}</span>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <div className={`text-sm mt-1 font-mono ${
                        actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        NOTE: <span className="text-yellow-500">{order.notes}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-mono font-bold">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-mono font-bold rounded-full border ${
                      order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-400/30' :
                      order.status === 'PREPARING' ? 'bg-blue-500/20 text-blue-500 border-blue-400/30' :
                      order.status === 'READY' ? 'bg-green-500/20 text-green-500 border-green-400/30' :
                      order.status === 'SERVED' ? 'bg-gray-500/20 text-gray-500 border-gray-400/30' :
                      'bg-red-500/20 text-red-500 border-red-400/30'
                    }`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {order.status === OrderStatus.PENDING && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, OrderStatus.PREPARING)}
                        disabled={updateStatusMutation.isPending}
                        className="bg-blue-500/20 text-blue-500 border border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-400/50 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all duration-300 mr-2"
                      >
                        START PREP
                      </button>
                    )}
                    {order.status === OrderStatus.PREPARING && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, OrderStatus.READY)}
                        disabled={updateStatusMutation.isPending}
                        className="bg-green-500/20 text-green-500 border border-green-400/30 hover:bg-green-500/30 hover:border-green-400/50 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all duration-300 mr-2"
                      >
                        MARK READY
                      </button>
                    )}
                    {order.status === OrderStatus.READY && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, OrderStatus.SERVED)}
                        disabled={updateStatusMutation.isPending}
                        className="bg-gray-500/20 text-gray-500 border border-gray-400/30 hover:bg-gray-500/30 hover:border-gray-400/50 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all duration-300 mr-2"
                      >
                        MARK SERVED
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders?.length === 0 && (
            <div className="text-center py-12">
              <div className={
                actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }>
                <svg className={`mx-auto h-12 w-12 ${
                  actualTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className={`mt-2 text-sm font-mono font-bold ${
                  actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>NO ORDERS FOUND</h3>
                <p className={`mt-1 text-sm font-mono ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {statusFilter === "ALL" 
                    ? "No orders have been placed yet." 
                    : `No orders with status "${getOrderStatusLabel(statusFilter as OrderStatus)}".`
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`backdrop-blur-sm px-4 py-3 flex items-center justify-between sm:px-6 rounded-xl ${
            actualTheme === 'dark'
              ? 'bg-gray-900/50 border border-gray-800'
              : 'bg-white/50 border border-gray-200'
          }`}>
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-mono font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  actualTheme === 'dark'
                    ? 'border-gray-700 text-gray-300 bg-gray-800/50 hover:bg-gray-700/50'
                    : 'border-gray-300 text-gray-700 bg-gray-50/50 hover:bg-gray-100/50'
                }`}
              >
                PREVIOUS
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-mono font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  actualTheme === 'dark'
                    ? 'border-gray-700 text-gray-300 bg-gray-800/50 hover:bg-gray-700/50'
                    : 'border-gray-300 text-gray-700 bg-gray-50/50 hover:bg-gray-100/50'
                }`}
              >
                NEXT
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className={`text-sm font-mono ${
                  actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  SHOWING{' '}
                  <span className="font-bold text-cyan-500">{(currentPage - 1) * itemsPerPage + 1}</span>
                  {' '}TO{' '}
                  <span className="font-bold text-cyan-500">
                    {Math.min(currentPage * itemsPerPage, totalCount)}
                  </span>
                  {' '}OF{' '}
                  <span className="font-bold text-cyan-500">{totalCount}</span>
                  {' '}RESULTS
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-lg border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      actualTheme === 'dark'
                        ? 'border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                        : 'border-gray-300 bg-gray-50/50 text-gray-700 hover:bg-gray-100/50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-mono font-bold transition-colors ${
                          pageNum === currentPage
                            ? 'z-10 bg-gradient-to-r from-cyan-500 to-purple-600 border-cyan-400 text-white'
                            : actualTheme === 'dark'
                            ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50'
                            : 'bg-gray-50/50 border-gray-300 text-gray-700 hover:bg-gray-100/50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-lg border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      actualTheme === 'dark'
                        ? 'border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                        : 'border-gray-300 bg-gray-50/50 text-gray-700 hover:bg-gray-100/50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = context.req.headers.cookie || "";
  const adminSession = getAdminSessionFromCookies(cookies);

  if (!adminSession) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session: adminSession,
    },
  };
}; 