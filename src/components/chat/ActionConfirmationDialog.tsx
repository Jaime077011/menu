import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PendingAction, ActionButton } from '@/types/chatActions';
import { generateActionButtons } from '@/utils/actionDetection';

interface ActionConfirmationDialogProps {
  action: PendingAction;
  onConfirm: (actionId: string) => void;
  onDecline: (actionId: string) => void;
  onModify?: (actionId: string, modifications: any) => void;
  onCustomAction?: (actionId: string, customAction: string) => void;
  className?: string;
}

export const ActionConfirmationDialog: React.FC<ActionConfirmationDialogProps> = ({
  action,
  onConfirm,
  onDecline,
  onModify,
  onCustomAction,
  className = '',
}) => {
  const actionButtons = generateActionButtons(action);

  const handleButtonClick = (button: ActionButton) => {
    switch (button.action) {
      case 'confirm':
        onConfirm(action.id);
        break;
      case 'decline':
        onDecline(action.id);
        break;
      case 'modify':
        onModify?.(action.id, {});
        break;
      case 'custom':
        onCustomAction?.(action.id, button.customAction || button.label);
        break;
    }
  };

  const getButtonStyles = (variant: ActionButton['variant']) => {
    const baseStyles = "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95";
    
    switch (variant) {
      case 'success':
        return `${baseStyles} bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/25`;
      case 'danger':
        return `${baseStyles} bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/25`;
      case 'secondary':
        return `${baseStyles} bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-gray-500/25`;
      case 'primary':
      default:
        return `${baseStyles} bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25`;
    }
  };

  const getActionIcon = (actionType: PendingAction['type']) => {
    switch (actionType) {
      case 'ADD_TO_ORDER':
        return '🍽️';
      case 'REMOVE_FROM_ORDER':
        return '🗑️';
      case 'CONFIRM_ORDER':
        return '📋';
      case 'REQUEST_CLARIFICATION':
        return '❓';
      case 'REQUEST_RECOMMENDATION':
        return '💡';
      case 'MODIFY_ORDER_ITEM':
        return '✏️';
      case 'CANCEL_ORDER':
        return '❌';
      case 'BOOK_TABLE':
        return '🪑';
      case 'SPECIAL_REQUEST':
        return '⭐';
      case 'CHECK_ORDERS':
        return '🔍';
      case 'EDIT_ORDER':
        return '✏️';
      case 'SPECIFIC_ORDER_EDIT':
        return '🎯';
      default:
        return '🤖';
    }
  };

  const renderOrderComparison = () => {
    // Show before/after comparison for order editing actions
    if ((action.type === 'MODIFY_ORDER_ITEM' || action.type === 'SPECIFIC_ORDER_EDIT') && action.data?.beforeAfter) {
      const { before, after } = action.data.beforeAfter;
      
      return (
        <div className="bg-white/80 rounded-lg p-3 border border-blue-200/50 mt-3">
          <h4 className="text-blue-900 font-medium text-sm mb-2">Order Changes:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Before */}
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <h5 className="text-red-800 font-medium text-xs mb-2 flex items-center">
                <span className="mr-1">❌</span> Before
              </h5>
              <div className="space-y-1">
                {before.items?.map((item: any, index: number) => (
                  <div key={index} className="text-xs text-red-700">
                    {item.quantity}× {item.name} (${item.price?.toFixed(2)})
                  </div>
                ))}
                <div className="border-t border-red-300 pt-1 mt-2">
                  <div className="text-xs font-medium text-red-800">
                    Total: ${before.total?.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* After */}
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <h5 className="text-green-800 font-medium text-xs mb-2 flex items-center">
                <span className="mr-1">✅</span> After
              </h5>
              <div className="space-y-1">
                {after.items?.map((item: any, index: number) => (
                  <div key={index} className="text-xs text-green-700">
                    {item.quantity}× {item.name} (${item.price?.toFixed(2)})
                  </div>
                ))}
                <div className="border-t border-green-300 pt-1 mt-2">
                  <div className="text-xs font-medium text-green-800">
                    Total: ${after.total?.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Price difference */}
          {before.total !== undefined && after.total !== undefined && (
            <div className="mt-3 text-center">
              <div className={`text-sm font-medium ${
                after.total > before.total ? 'text-red-600' : 
                after.total < before.total ? 'text-green-600' : 
                'text-gray-600'
              }`}>
                {after.total > before.total ? '+' : ''}
                ${(after.total - before.total).toFixed(2)} difference
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 my-3 shadow-lg max-w-full box-border ${className}`}
      style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
    >
      <div className="flex items-start space-x-3">
        {/* Action Icon */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
          className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0"
        >
          <span className="text-white text-lg">{getActionIcon(action.type)}</span>
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-full overflow-hidden">
          {/* Action Description */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-3"
          >
            <p className="text-blue-900 font-medium text-sm mb-1">
              {action.description}
            </p>
            <div className="bg-white/60 rounded-lg p-3 border border-blue-200/50 max-w-full overflow-hidden">
              <p className="text-blue-800 text-sm whitespace-pre-line break-words">
                {action.confirmationMessage}
              </p>
            </div>
            
            {/* Order Comparison for Editing Actions */}
            {renderOrderComparison()}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            {actionButtons.map((button, index) => (
              <motion.button
                key={button.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + (index * 0.05) }}
                onClick={() => handleButtonClick(button)}
                className={getButtonStyles(button.variant)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                {button.icon && <span className="mr-1">{button.icon}</span>}
                {button.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Fallback Options */}
          {action.fallbackOptions && action.fallbackOptions.length > 0 && action.type === 'REQUEST_CLARIFICATION' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.3 }}
              className="mt-3 pt-3 border-t border-blue-200"
            >
              <p className="text-blue-700 text-xs font-medium mb-2">Available options:</p>
              <div className="flex flex-wrap gap-1">
                {action.fallbackOptions.map((option, index) => (
                  <motion.button
                    key={`${action.id}-option-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 + (index * 0.03) }}
                    onClick={() => onCustomAction?.(action.id, option)}
                    className="px-2 py-1 bg-white/80 hover:bg-white text-blue-700 text-xs rounded-md border border-blue-200 hover:border-blue-300 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Timestamp */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-xs text-blue-600/70"
          >
            {new Date(action.timestamp).toLocaleTimeString()}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ActionConfirmationDialog; 