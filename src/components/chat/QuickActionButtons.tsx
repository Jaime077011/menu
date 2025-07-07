import React from 'react';
import { motion } from 'framer-motion';

interface QuickAction {
  id: string;
  label: string;
  action: string;
  icon?: string;
  variant: 'primary' | 'secondary' | 'danger' | 'success';
  description?: string;
}

interface QuickActionButtonsProps {
  actions: QuickAction[];
  onActionClick: (action: string) => void;
  className?: string;
  title?: string;
  maxVisible?: number;
}

export const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
  actions,
  onActionClick,
  className = '',
  title = 'Quick Actions',
  maxVisible = 4,
}) => {
  const visibleActions = actions.slice(0, maxVisible);
  const hasMore = actions.length > maxVisible;

  const getButtonStyles = (variant: QuickAction['variant']) => {
    const baseStyles = "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm";
    
    switch (variant) {
      case 'success':
        return `${baseStyles} bg-green-100 hover:bg-green-200 text-green-800 border border-green-300`;
      case 'danger':
        return `${baseStyles} bg-red-100 hover:bg-red-200 text-red-800 border border-red-300`;
      case 'secondary':
        return `${baseStyles} bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300`;
      case 'primary':
      default:
        return `${baseStyles} bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300`;
    }
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-3 my-2 shadow-lg ${className}`}
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center mb-2"
      >
        <span className="text-gray-700 text-sm font-medium">{title}</span>
        {hasMore && (
          <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
            +{actions.length - maxVisible} more
          </span>
        )}
      </motion.div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {visibleActions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + (index * 0.05) }}
            onClick={() => onActionClick(action.action)}
            className={getButtonStyles(action.variant)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            title={action.description}
          >
            {action.icon && (
              <span className="mr-1 text-base">{action.icon}</span>
            )}
            {action.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// Predefined quick action sets
export const commonQuickActions: QuickAction[] = [
  {
    id: 'yes',
    label: 'Yes',
    action: 'yes',
    icon: '✅',
    variant: 'success',
    description: 'Confirm the action'
  },
  {
    id: 'no',
    label: 'No',
    action: 'no',
    icon: '❌',
    variant: 'danger',
    description: 'Decline the action'
  },
  {
    id: 'maybe',
    label: 'Maybe',
    action: 'maybe',
    icon: '🤔',
    variant: 'secondary',
    description: 'Need more information'
  },
  {
    id: 'help',
    label: 'Help',
    action: 'help',
    icon: '❓',
    variant: 'primary',
    description: 'Get help or more options'
  }
];

export const orderQuickActions: QuickAction[] = [
  {
    id: 'add_to_order',
    label: 'Add to Order',
    action: 'add_to_order',
    icon: '🛒',
    variant: 'success',
    description: 'Add item to current order'
  },
  {
    id: 'see_menu',
    label: 'See Menu',
    action: 'see_menu',
    icon: '📋',
    variant: 'primary',
    description: 'View the full menu'
  },
  {
    id: 'recommendations',
    label: 'Recommendations',
    action: 'recommendations',
    icon: '💡',
    variant: 'primary',
    description: 'Get personalized recommendations'
  },
  {
    id: 'check_order',
    label: 'Check Order',
    action: 'check_order',
    icon: '📄',
    variant: 'secondary',
    description: 'Review current order'
  }
];

export const clarificationQuickActions: QuickAction[] = [
  {
    id: 'tell_me_more',
    label: 'Tell me more',
    action: 'tell_me_more',
    icon: '📖',
    variant: 'primary',
    description: 'Get more details'
  },
  {
    id: 'show_options',
    label: 'Show options',
    action: 'show_options',
    icon: '📝',
    variant: 'primary',
    description: 'See all available options'
  },
  {
    id: 'something_else',
    label: 'Something else',
    action: 'something_else',
    icon: '🔄',
    variant: 'secondary',
    description: 'Look for different options'
  }
];

export default QuickActionButtons; 