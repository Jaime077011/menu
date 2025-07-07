import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/utils/api';

interface CustomerSessionPanelProps {
  restaurantId: string;
  tableNumber: string;
  onSessionUpdate?: (session: any) => void;
  className?: string;
  refreshTrigger?: number; // Used to trigger manual refresh
}

interface SessionFormData {
  customerName: string;
  notes: string;
}

export const CustomerSessionPanel: React.FC<CustomerSessionPanelProps> = ({
  restaurantId,
  tableNumber,
  onSessionUpdate,
  className = '',
  refreshTrigger = 0,
}) => {
  const [showNameForm, setShowNameForm] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [formData, setFormData] = useState<SessionFormData>({
    customerName: '',
    notes: '',
  });

  // Get current session with automatic polling for real-time updates
  const { data: currentSession, refetch: refetchSession } = api.session.getCurrent.useQuery({
    restaurantId,
    tableNumber,
  }, {
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchIntervalInBackground: true, // Continue polling when tab is not active
  });

  // Trigger manual refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      refetchSession();
    }
  }, [refreshTrigger, refetchSession]);

  // Mutations
  const createSession = api.session.create.useMutation({
    onSuccess: (data) => {
      refetchSession();
      onSessionUpdate?.(data.session);
    },
  });

  const updateCustomer = api.session.updateCustomer.useMutation({
    onSuccess: (data) => {
      refetchSession();
      onSessionUpdate?.(data.session);
      setShowNameForm(false);
      setFormData({ customerName: '', notes: '' });
    },
  });

  const endSession = api.session.end.useMutation({
    onSuccess: (data) => {
      refetchSession();
      onSessionUpdate?.(data.session);
      setShowEndConfirmation(false);
    },
  });

  const handleStartSession = () => {
    createSession.mutate({
      restaurantId,
      tableNumber,
    });
  };

  const handleUpdateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) return;

    updateCustomer.mutate({
      sessionId: currentSession.id,
      customerName: formData.customerName.trim(),
      notes: formData.notes.trim() || undefined,
    });
  };

  const handleEndSession = (status: 'COMPLETED' | 'ABANDONED' | 'CANCELLED') => {
    if (!currentSession) return;

    endSession.mutate({
      sessionId: currentSession.id,
      status,
    });
  };

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // No session - show start session button
  if (!currentSession) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-lg ${className}`}
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl">👋</span>
          </div>
          <h3 className="text-blue-900 font-bold text-lg mb-2">
            Welcome to Table {tableNumber}
          </h3>
          <p className="text-blue-700 text-sm mb-4">
            Start your dining session to get personalized service and track your orders
          </p>
          <button
            onClick={handleStartSession}
            disabled={createSession.isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createSession.isLoading ? 'Starting...' : 'Start Session'}
          </button>
        </div>
      </motion.div>
    );
  }

  // Active session - show session info
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-lg ${className}`}
    >
      {/* Session Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🍽️</span>
          </div>
          <div>
            <h3 className="text-green-900 font-bold text-lg">
              {currentSession.customerName || 'Guest'}
            </h3>
            <p className="text-green-700 text-sm">
              Table {tableNumber} • {formatDuration(currentSession.statistics.duration)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ● Active
          </span>
        </div>
      </div>

      {/* Session Statistics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/60 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-900">
            {currentSession.statistics.totalOrders}
          </p>
          <p className="text-green-700 text-xs">Orders</p>
        </div>
        <div className="bg-white/60 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(currentSession.statistics.totalSpent)}
          </p>
          <p className="text-green-700 text-xs">Total</p>
        </div>
      </div>

      {/* Current Orders */}
      {currentSession.orders && currentSession.orders.length > 0 && (
        <div className="mb-4">
          <h4 className="text-green-900 font-medium text-sm mb-2 flex items-center">
            <span className="mr-2">🛒</span>
            Current Orders
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {currentSession.orders.map((order: any) => {
              const statusEmoji = {
                'PENDING': '⏳',
                'PREPARING': '👨‍🍳', 
                'READY': '🔔',
                'SERVED': '✨',
                'CANCELLED': '❌'
              }[order.status] || '📋';

              const canEdit = order.status === 'PENDING';

              return (
                <div key={order.id} className="bg-white/60 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span>{statusEmoji}</span>
                      <span className="font-medium text-green-900">
                        Order #{order.id.slice(-6).toUpperCase()}
                      </span>
                      {canEdit && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Can Edit
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-green-900">
                      {formatCurrency(typeof order.total === 'number' ? order.total : parseFloat(order.total.toString()))}
                    </span>
                  </div>
                  
                  <div className="text-green-700 text-xs mb-2">
                    {new Date(order.createdAt).toLocaleString()} • {order.status}
                  </div>
                  
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-1">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs text-green-700">
                          <span>{item.quantity}x {item.menuItem.name}</span>
                          <span>{formatCurrency(typeof item.priceAtTime === 'number' ? item.priceAtTime : parseFloat(item.priceAtTime.toString()))}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Name Section */}
      <div className="mb-4">
        {!currentSession.customerName ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm mb-2">
              Help us personalize your experience!
            </p>
            <button
              onClick={() => setShowNameForm(true)}
              className="text-yellow-700 hover:text-yellow-900 text-sm font-medium underline"
            >
              Add your name
            </button>
          </div>
        ) : (
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-900 font-medium">
                  Welcome, {currentSession.customerName}!
                </p>
                <p className="text-green-700 text-sm">
                  Enjoying your dining experience
                </p>
              </div>
              <button
                onClick={() => {
                  setFormData({
                    customerName: currentSession.customerName || '',
                    notes: currentSession.notes || '',
                  });
                  setShowNameForm(true);
                }}
                className="text-green-600 hover:text-green-800 text-sm"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowEndConfirmation(true)}
          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          End Session
        </button>
      </div>

      {/* Name Form Modal */}
      <AnimatePresence>
        {showNameForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNameForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {currentSession.customerName ? 'Update Information' : 'Tell us your name'}
              </h3>
              
              <form onSubmit={handleUpdateCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any dietary restrictions or preferences?"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={updateCustomer.isLoading || !formData.customerName.trim()}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateCustomer.isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNameForm(false)}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End Session Confirmation */}
      <AnimatePresence>
        {showEndConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEndConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                End Your Session
              </h3>
              
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Session Summary</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Duration: {formatDuration(currentSession.statistics.duration)}</p>
                    <p>Orders: {currentSession.statistics.totalOrders}</p>
                    <p>Total Spent: {formatCurrency(currentSession.statistics.totalSpent)}</p>
                  </div>
                </div>
                
                <p className="text-gray-700 text-sm">
                  How would you like to end your session?
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleEndSession('COMPLETED')}
                  disabled={endSession.isLoading}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✅ Complete Session (Everything was great!)
                </button>
                
                <button
                  onClick={() => handleEndSession('ABANDONED')}
                  disabled={endSession.isLoading}
                  className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🚶 Leave Early (Had to go)
                </button>
                
                <button
                  onClick={() => handleEndSession('CANCELLED')}
                  disabled={endSession.isLoading}
                  className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ❌ Cancel Session (Something went wrong)
                </button>
                
                <button
                  onClick={() => setShowEndConfirmation(false)}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Keep Session Active
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}; 