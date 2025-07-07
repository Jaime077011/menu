import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicroInteractions } from '@/components/ui/MicroInteractions';

// TypeScript interfaces following T3 patterns
interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  notes: string;
  subtotal: number;
}

interface FloatingOrderSummaryProps {
  isOpen: boolean;
  onToggle: () => void;
  orderItems: OrderItem[];
  total: number;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
  onRemoveItem: (itemId: string) => void;
  onPlaceOrder?: () => void;
  isLoading?: boolean;
}

interface OrderItemCardProps {
  item: OrderItem;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
  onRemoveItem: (itemId: string) => void;
}

// Individual Order Item Card Component
const OrderItemCard: React.FC<OrderItemCardProps> = ({
  item,
  onUpdateQuantity,
  onUpdateNotes,
  onRemoveItem
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState(item.notes);

  const handleNotesSubmit = () => {
    onUpdateNotes(item.id, tempNotes);
    setIsEditingNotes(false);
  };

  const handleNotesCancel = () => {
    setTempNotes(item.notes);
    setIsEditingNotes(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
    >
      <div className="flex items-start space-x-3">
        {/* Item Image */}
        <div className="flex-shrink-0">
          <img
            src={item.imageUrl || '/placeholder-food.jpg'}
            alt={item.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-white font-medium text-sm truncate">{item.name}</h3>
              <p className="text-white/60 text-xs">${item.price.toFixed(2)} each</p>
            </div>
            
            {/* Remove Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onRemoveItem(item.id)}
              className="text-red-400 hover:text-red-300 text-sm p-1"
              aria-label="Remove item"
            >
              ✕
            </motion.button>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs"
              >
                −
              </motion.button>
              <span className="text-white font-medium w-6 text-center text-sm">{item.quantity}</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs"
              >
                +
              </motion.button>
            </div>
            
            <div className="text-white font-semibold text-sm">
              ${item.subtotal.toFixed(2)}
            </div>
          </div>

          {/* Notes Section */}
          <div className="mt-2">
            {!isEditingNotes ? (
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs">
                  {item.notes || 'No special instructions'}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditingNotes(true)}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  {item.notes ? 'Edit' : 'Add'} notes
                </motion.button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="Special instructions..."
                  className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white placeholder-white/50"
                  maxLength={100}
                />
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNotesSubmit}
                    className="px-2 py-1 bg-green-500/20 text-green-300 border border-green-400/30 rounded text-xs"
                  >
                    Save
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNotesCancel}
                    className="px-2 py-1 bg-gray-500/20 text-gray-300 border border-gray-400/30 rounded text-xs"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Main Floating Order Summary Component
export const FloatingOrderSummary: React.FC<FloatingOrderSummaryProps> = ({
  isOpen,
  onToggle,
  orderItems,
  total,
  onUpdateQuantity,
  onUpdateNotes,
  onRemoveItem,
  onPlaceOrder,
  isLoading = false
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = () => {
    if (onPlaceOrder) {
      onPlaceOrder();
    }
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Floating toggle button (always visible)
  const ToggleButton = (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-50"
      aria-label={isOpen ? 'Close order summary' : 'Open order summary'}
    >
      <div className="flex flex-col items-center">
        <span className="text-lg">{isOpen ? '✕' : '🛒'}</span>
        {!isOpen && itemCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
          >
            {itemCount}
          </motion.span>
        )}
      </div>
    </motion.button>
  );

  return (
    <>
      {/* Toggle Button */}
      {ToggleButton}

      {/* Order Summary Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full md:w-96 bg-slate-900/95 backdrop-blur-lg border-l border-white/10 shadow-2xl z-40 overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Your Order</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggle}
                  className="text-white/60 hover:text-white text-xl"
                >
                  ✕
                </motion.button>
              </div>

              {/* Order Items */}
              <div className="flex-1 overflow-y-auto p-6">
                {orderItems.length === 0 ? (
                  <div className="text-center text-white/60 mt-8">
                    <div className="text-4xl mb-4">🛒</div>
                    <p>Your order is empty</p>
                    <p className="text-sm mt-2">Add some delicious items to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {orderItems.map((item) => (
                        <OrderItemCard
                          key={item.id}
                          item={item}
                          onUpdateQuantity={onUpdateQuantity}
                          onUpdateNotes={onUpdateNotes}
                          onRemoveItem={onRemoveItem}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer */}
              {orderItems.length > 0 && (
                <div className="border-t border-white/10 p-6 space-y-4">
                  {/* Order Total */}
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <div className="font-medium">Total ({itemCount} items)</div>
                      <div className="text-sm text-white/60">Tax and fees calculated at checkout</div>
                    </div>
                    <div className="text-2xl font-bold">${total.toFixed(2)}</div>
                  </div>

                  {/* Place Order Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePlaceOrder}
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:from-green-600 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Placing Order...</span>
                      </div>
                    ) : (
                      'Place Order'
                    )}
                  </motion.button>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {/* TODO: Implement save for later */}}
                      className="py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm border border-white/20"
                    >
                      Save for Later
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {/* TODO: Implement clear all */}}
                      className="py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm border border-red-400/30"
                    >
                      Clear All
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Animation */}
      <MicroInteractions.SuccessAnimation isVisible={showSuccess} />
    </>
  );
}; 