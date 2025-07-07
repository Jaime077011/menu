import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateOrderCanBeModified, ORDER_STATUS_LABELS } from '@/utils/orderValidation';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface EditableOrder {
  id: string;
  status: string;
  total: number;
  createdAt: Date;
  items: OrderItem[];
}

interface OrderEditingDialogProps {
  orders: EditableOrder[];
  onEditOrder: (orderId: string, action: 'add_item' | 'remove_item' | 'modify_quantity' | 'cancel_order', itemData?: any) => void;
  onClose: () => void;
}

interface OrderChanges {
  [orderId: string]: {
    [itemId: string]: {
      originalQuantity: number;
      newQuantity: number;
      action: 'modify' | 'remove';
    };
  };
}

export const OrderEditingDialog: React.FC<OrderEditingDialogProps> = ({
  orders,
  onEditOrder,
  onClose
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<OrderChanges>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Add validation function inside component
  const validateOrderEditability = (order: EditableOrder) => {
    const validation = validateOrderCanBeModified(order.status as any);
    
    if (!validation.canModify) {
      return {
        canEdit: false,
        message: `Order #${order.id.slice(-6)} cannot be edited - ${validation.reason}`,
        suggestedActions: order.status === 'PREPARING' ? 
          ['Contact staff for assistance', 'Place a new order'] :
          ['Place a new order']
      };
    }
    
    return { canEdit: true };
  };

  if (orders.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 my-4 shadow-lg"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">📋</span>
          </div>
          <h3 className="text-yellow-900 font-bold text-lg mb-2">
            No Orders Available for Editing
          </h3>
          <p className="text-yellow-700 mb-4">
            Orders can only be edited while they have PENDING status. Once the kitchen starts preparing your order, modifications require staff assistance.
          </p>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Place New Order
          </button>
        </div>
      </motion.div>
    );
  }

  const selectedOrder = selectedOrderId ? orders.find(o => o.id === selectedOrderId) : null;

  const handleQuantityChange = (orderId: string, itemId: string, newQuantity: number, originalQuantity: number) => {
    setPendingChanges(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [itemId]: {
          originalQuantity,
          newQuantity,
          action: newQuantity === 0 ? 'remove' : 'modify'
        }
      }
    }));
  };

  const getItemNewQuantity = (orderId: string, itemId: string, originalQuantity: number) => {
    return pendingChanges[orderId]?.[itemId]?.newQuantity ?? originalQuantity;
  };

  const hasChanges = (orderId: string) => {
    const changes = pendingChanges[orderId];
    if (!changes) return false;
    return Object.values(changes).some(change => 
      change.newQuantity !== change.originalQuantity
    );
  };

  const calculateNewTotal = (order: EditableOrder) => {
    let newTotal = 0;
    order.items.forEach(item => {
      const newQuantity = getItemNewQuantity(order.id, item.id, item.quantity);
      newTotal += (typeof item.price === 'number' ? item.price : parseFloat(item.price || '0')) * newQuantity;
    });
    return newTotal;
  };

  const applyChanges = (orderId: string) => {
    const changes = pendingChanges[orderId];
    if (!changes) return;

    Object.entries(changes).forEach(([itemId, change]) => {
      if (change.action === 'remove') {
        onEditOrder(orderId, 'remove_item', { orderItemId: itemId });
      } else if (change.action === 'modify') {
        onEditOrder(orderId, 'modify_quantity', { 
          orderItemId: itemId, 
          quantity: change.newQuantity 
        });
      }
    });

    // Clear pending changes for this order
    setPendingChanges(prev => {
      const newChanges = { ...prev };
      delete newChanges[orderId];
      return newChanges;
    });
    
    setSelectedOrderId(null);
  };

  const cancelChanges = (orderId: string) => {
    setPendingChanges(prev => {
      const newChanges = { ...prev };
      delete newChanges[orderId];
      return newChanges;
    });
    setSelectedOrderId(null);
  };

  // Order Selection View
  if (!selectedOrderId) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 my-4 shadow-lg max-w-2xl"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✏️</span>
          </div>
          <h3 className="text-blue-900 font-bold text-xl mb-2">
            Edit Your Orders
          </h3>
          <p className="text-blue-700">
            Select an order to modify items, quantities, or cancel
          </p>
        </div>
        
        <div className="space-y-4">
          {orders.map((order) => {
            const editability = validateOrderEditability(order);
            
            if (!editability.canEdit) {
              return (
                <motion.div
                  key={order.id}
                  className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-red-900">Order #{order.id.slice(-6)}</h4>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                      {ORDER_STATUS_LABELS[order.status as any] || order.status}
                    </span>
                  </div>
                  <p className="text-red-700 text-sm mb-3">{editability.message}</p>
                  <div className="flex gap-2">
                    {editability.suggestedActions?.map((action, index) => (
                      <button 
                        key={index}
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        onClick={() => {
                          if (action.includes('Contact staff')) {
                            alert('Please speak with restaurant staff for assistance with this order.');
                          } else {
                            onClose();
                          }
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </motion.div>
              );
            }
            
            return (
              <motion.div 
                key={order.id} 
                className="bg-white rounded-lg p-4 border border-blue-100 hover:border-blue-300 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedOrderId(order.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">
                      Order #{order.id.slice(-6).toUpperCase()}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} • ${(typeof order.total === 'number' ? order.total : parseFloat(order.total.toString())).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2">
                      ✓ Can Edit
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Edit Order →
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item, index) => (
                      <span 
                        key={item.id}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {item.quantity}× {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  // Order Editing View
  if (!selectedOrder) return null;

  // Validate the selected order before showing editing interface
  const selectedOrderEditability = validateOrderEditability(selectedOrder);
  
  if (!selectedOrderEditability.canEdit) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 border-2 border-red-200 rounded-xl p-6 my-4 shadow-lg max-w-3xl"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🔒</span>
          </div>
          <h3 className="text-red-900 font-bold text-xl mb-2">
            Order Cannot Be Edited
          </h3>
          <p className="text-red-700 mb-4">
            {selectedOrderEditability.message}
          </p>
          <div className="flex justify-center gap-3">
            {selectedOrderEditability.suggestedActions?.map((action, index) => (
              <button 
                key={index}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                onClick={() => {
                  if (action.includes('Contact staff')) {
                    alert('Please speak with restaurant staff for assistance with this order.');
                  } else {
                    onClose();
                  }
                }}
              >
                {action}
              </button>
            ))}
            <button
              onClick={() => setSelectedOrderId(null)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 my-4 shadow-lg max-w-3xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSelectedOrderId(null)}
            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h3 className="text-blue-900 font-bold text-xl">
              Edit Order #{selectedOrder.id.slice(-6).toUpperCase()}
            </h3>
            <p className="text-blue-700 text-sm">
              Modify quantities or remove items
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Can Edit
        </span>
      </div>

      {/* Items List */}
      <div className="space-y-3 mb-6">
        {selectedOrder.items.map((item) => {
          const newQuantity = getItemNewQuantity(selectedOrder.id, item.id, item.quantity);
          const isChanged = newQuantity !== item.quantity;
          const isRemoved = newQuantity === 0;
          
          return (
            <motion.div 
              key={item.id}
              className={`bg-white rounded-lg p-4 border-2 transition-all ${
                isRemoved ? 'border-red-200 bg-red-50' : 
                isChanged ? 'border-yellow-200 bg-yellow-50' : 
                'border-gray-200'
              }`}
              layout
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className={`font-medium ${isRemoved ? 'text-red-600 line-through' : 'text-gray-900'}`}>
                    {item.name}
                  </h4>
                  <p className={`text-sm ${isRemoved ? 'text-red-500' : 'text-gray-600'}`}>
                    ${(typeof item.price === 'number' ? item.price : parseFloat(item.price || '0')).toFixed(2)} each
                  </p>
                  {isChanged && !isRemoved && (
                    <p className="text-xs text-yellow-600 font-medium mt-1">
                      Quantity changed: {item.quantity} → {newQuantity}
                    </p>
                  )}
                  {isRemoved && (
                    <p className="text-xs text-red-600 font-medium mt-1">
                      Will be removed from order
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(
                        selectedOrder.id, 
                        item.id, 
                        Math.max(0, newQuantity - 1), 
                        item.quantity
                      )}
                      className="w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center font-bold"
                    >
                      −
                    </button>
                    <span className={`font-bold text-lg min-w-[2rem] text-center ${isRemoved ? 'text-red-600' : 'text-gray-900'}`}>
                      {newQuantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(
                        selectedOrder.id, 
                        item.id, 
                        newQuantity + 1, 
                        item.quantity
                      )}
                      className="w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right min-w-[4rem]">
                    <p className={`font-bold ${isRemoved ? 'text-red-600 line-through' : 'text-gray-900'}`}>
                      ${((typeof item.price === 'number' ? item.price : parseFloat(item.price || '0')) * newQuantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg p-4 border-2 border-blue-200 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold text-gray-900">Order Total</h4>
            {hasChanges(selectedOrder.id) && (
              <p className="text-sm text-blue-600">
                Original: ${(typeof selectedOrder.total === 'number' ? selectedOrder.total : parseFloat(selectedOrder.total.toString())).toFixed(2)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${hasChanges(selectedOrder.id) ? 'text-blue-600' : 'text-gray-900'}`}>
              ${calculateNewTotal(selectedOrder).toFixed(2)}
            </p>
            {hasChanges(selectedOrder.id) && (
              <p className="text-sm text-blue-600">
                {calculateNewTotal(selectedOrder) > (typeof selectedOrder.total === 'number' ? selectedOrder.total : parseFloat(selectedOrder.total.toString())) ? '+' : ''}
                ${(calculateNewTotal(selectedOrder) - (typeof selectedOrder.total === 'number' ? selectedOrder.total : parseFloat(selectedOrder.total.toString()))).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {hasChanges(selectedOrder.id) ? (
          <>
            <button
              onClick={() => applyChanges(selectedOrder.id)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>✓</span>
              <span>Save Changes</span>
            </button>
            <button
              onClick={() => cancelChanges(selectedOrder.id)}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel Changes
            </button>
          </>
        ) : (
          <button
            onClick={() => setSelectedOrderId(null)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Orders
          </button>
        )}
        
        <button
          onClick={() => onEditOrder(selectedOrder.id, 'cancel_order')}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <span>❌</span>
          <span>Cancel Entire Order</span>
        </button>
      </div>
    </motion.div>
  );
}; 