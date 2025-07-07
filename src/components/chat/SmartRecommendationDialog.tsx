import React from 'react';
import { motion } from 'framer-motion';
import { api } from '@/utils/api';

interface RecommendationItem {
  id: string;
  name: string;
  price: number;
  reason: string;
}

interface SmartRecommendation {
  type: 'drink' | 'side' | 'dessert' | 'upgrade' | 'complement' | 'dietary' | 'popular';
  priority: number;
  message: string;
  confidence: number;
  items: RecommendationItem[];
}

interface SmartRecommendationDialogProps {
  recommendations: SmartRecommendation[];
  onSelectItem: (item: RecommendationItem) => void;
  onDismiss: () => void;
  onDecline: () => void;
}

const RECOMMENDATION_ICONS = {
  drink: '🥤',
  side: '🍟',
  dessert: '🍰',
  upgrade: '⭐',
  complement: '🍽️',
  dietary: '🥗',
  popular: '🔥'
};

const RECOMMENDATION_COLORS = {
  drink: 'from-blue-500/20 to-cyan-500/20 border-blue-400/30',
  side: 'from-orange-500/20 to-yellow-500/20 border-orange-400/30',
  dessert: 'from-pink-500/20 to-purple-500/20 border-pink-400/30',
  upgrade: 'from-yellow-500/20 to-orange-500/20 border-yellow-400/30',
  complement: 'from-green-500/20 to-emerald-500/20 border-green-400/30',
  dietary: 'from-emerald-500/20 to-teal-500/20 border-emerald-400/30',
  popular: 'from-red-500/20 to-orange-500/20 border-red-400/30'
};

export const SmartRecommendationDialog: React.FC<SmartRecommendationDialogProps> = ({
  recommendations,
  onSelectItem,
  onDismiss,
  onDecline
}) => {
  if (recommendations.length === 0) return null;

  const topRecommendation = recommendations[0];
  const icon = RECOMMENDATION_ICONS[topRecommendation.type];
  const colorClass = RECOMMENDATION_COLORS[topRecommendation.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`bg-gradient-to-br ${colorClass} border rounded-xl p-4 my-3 backdrop-blur-sm`}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl flex-shrink-0">
          {icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="text-white font-medium text-sm">
              Smart Recommendation
            </h4>
            <div className="bg-white/20 px-2 py-1 rounded text-xs text-white/80">
              {Math.round(topRecommendation.confidence * 100)}% match
            </div>
          </div>
          
          {/* Message */}
          <p className="text-white/90 text-sm mb-3">
            {topRecommendation.message}
          </p>
          
          {/* Items */}
          <div className="space-y-2 mb-4">
            {topRecommendation.items.slice(0, 3).map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectItem(item)}
                className="w-full bg-white/10 hover:bg-white/20 rounded-lg p-3 text-left transition-colors border border-white/10 hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium text-sm">
                      {item.name}
                    </div>
                    <div className="text-white/60 text-xs">
                      {item.reason}
                    </div>
                  </div>
                  <div className="text-white font-semibold text-sm">
                    ${item.price.toFixed(2)}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDismiss}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-white/20"
            >
              ✨ Show me more
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDecline}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 rounded-lg text-sm transition-colors border border-white/10"
            >
              No thanks
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Hook for using smart recommendations
export function useSmartRecommendations({
  restaurantId,
  tableNumber,
  currentOrder = [],
  conversationHistory = [],
  userMessage = ""
}: {
  restaurantId: string;
  tableNumber?: number;
  currentOrder?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage?: string;
}) {
  const recommendationsQuery = api.chat.getRecommendations.useQuery({
    restaurantId,
    tableNumber,
    currentOrder,
    conversationHistory,
    userMessage
  }, {
    enabled: currentOrder.length > 0, // Only fetch when there's an order
    staleTime: 30000, // Cache for 30 seconds
  });

  return {
    recommendations: recommendationsQuery.data?.recommendations || [],
    isLoading: recommendationsQuery.isLoading,
    error: recommendationsQuery.error,
    refetch: recommendationsQuery.refetch
  };
} 