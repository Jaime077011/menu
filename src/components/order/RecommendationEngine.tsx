import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveProductCard } from '@/components/menu/InteractiveProductCard';

// TypeScript interfaces following T3 patterns
interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  imageAlt?: string;
  category?: string;
  available?: boolean;
  dietaryTags?: { id: string; value: string }[];
}

interface RecommendationReason {
  type: 'popular' | 'dietary' | 'pairing' | 'seasonal' | 'ai';
  message: string;
  confidence: number;
}

interface RecommendedItem extends MenuItem {
  reason: RecommendationReason;
  score: number;
}

interface RecommendationEngineProps {
  currentOrder: OrderItem[];
  onAddToOrder: (item: MenuItem) => void;
  className?: string;
}

// Mock recommendation data (in real app, this would come from tRPC)
const SAMPLE_RECOMMENDATIONS: RecommendedItem[] = [
  {
    id: '7',
    name: 'Truffle Fries',
    description: 'Crispy fries with truffle oil, parmesan, and fresh herbs',
    price: 12.99,
    category: 'Sides',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
    imageAlt: 'Truffle Fries',
    available: true,
    dietaryTags: [{ id: '10', value: 'vegetarian' }],
    reason: {
      type: 'pairing',
      message: 'Perfect side for your burger',
      confidence: 85
    },
    score: 8.5
  },
  {
    id: '8',
    name: 'Craft Beer Selection',
    description: 'Locally brewed IPA with citrus notes',
    price: 8.99,
    category: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop',
    imageAlt: 'Craft Beer',
    available: true,
    dietaryTags: [],
    reason: {
      type: 'popular',
      message: '90% of customers also ordered this',
      confidence: 90
    },
    score: 9.0
  },
  {
    id: '9',
    name: 'Vegan Caesar Salad',
    description: 'Crisp romaine with cashew-based dressing and croutons',
    price: 14.99,
    category: 'Salads',
    imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
    imageAlt: 'Vegan Caesar Salad',
    available: true,
    dietaryTags: [
      { id: '3', value: 'vegan' },
      { id: '4', value: 'gluten-free' }
    ],
    reason: {
      type: 'dietary',
      message: 'Matches your dietary preferences',
      confidence: 75
    },
    score: 7.5
  }
];

const RECOMMENDATION_TYPES = {
  popular: { icon: '🔥', color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-400/30' },
  dietary: { icon: '🥗', color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-400/30' },
  pairing: { icon: '🍽️', color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-400/30' },
  seasonal: { icon: '🌟', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-400/30' },
  ai: { icon: '🤖', color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-400/30' },
};

export const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  currentOrder,
  onAddToOrder,
  className = ""
}) => {
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate AI recommendation generation based on current order
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      // In real app, this would be a tRPC call to generate recommendations
      // based on current order, user preferences, and AI analysis
      setRecommendations(SAMPLE_RECOMMENDATIONS);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentOrder]);

  const filteredRecommendations = selectedType 
    ? recommendations.filter(item => item.reason.type === selectedType)
    : recommendations;

  const getReasonStyle = (type: string) => RECOMMENDATION_TYPES[type as keyof typeof RECOMMENDATION_TYPES];

  const handleRefreshRecommendations = () => {
    setIsLoading(true);
    // Simulate refreshing recommendations
    setTimeout(() => {
      // In real app, this would make a new tRPC call
      setRecommendations(prev => [...prev].sort(() => Math.random() - 0.5));
      setIsLoading(false);
    }, 800);
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-white mb-2">Generating Recommendations</h3>
            <p className="text-white/60">Our AI is analyzing your order to suggest perfect additions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">🤖 Recommended for You</h2>
          <p className="text-white/60 text-sm">Based on your current order and preferences</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefreshRecommendations}
          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-400/30 transition-colors text-sm"
        >
          🔄 Refresh
        </motion.button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedType(null)}
          className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
            selectedType === null
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
          }`}
        >
          All ({recommendations.length})
        </motion.button>
        
        {Object.entries(RECOMMENDATION_TYPES).map(([type, style]) => {
          const count = recommendations.filter(item => item.reason.type === type).length;
          if (count === 0) return null;
          
          return (
            <motion.button
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedType(selectedType === type ? null : type)}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                selectedType === type
                  ? `${style.bgColor} ${style.color} ${style.borderColor}`
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
              }`}
            >
              {style.icon} {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
            </motion.button>
          );
        })}
      </div>

      {/* Recommendations Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedType || 'all'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredRecommendations.map((item, index) => {
            const reasonStyle = getReasonStyle(item.reason.type);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Recommendation Badge */}
                <div className={`absolute top-2 left-2 z-10 px-2 py-1 rounded-full text-xs font-medium ${reasonStyle.bgColor} ${reasonStyle.color} ${reasonStyle.borderColor} border backdrop-blur-sm`}>
                  {reasonStyle.icon} {item.reason.message}
                </div>

                {/* Confidence Score */}
                <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-xs font-bold bg-black/50 text-white backdrop-blur-sm">
                  {item.reason.confidence}% match
                </div>

                {/* Product Card */}
                <InteractiveProductCard
                  item={item}
                  isRecommended={true}
                  onAddToOrder={onAddToOrder}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredRecommendations.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-lg font-semibold text-white mb-2">No recommendations found</h3>
          <p className="text-white/60">Try adding more items to your order for better suggestions</p>
        </motion.div>
      )}

      {/* AI Insights */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">💡 AI Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(recommendations.reduce((sum, item) => sum + item.score, 0) / recommendations.length * 10)}%
              </div>
              <div className="text-sm text-white/60">Average Match</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {recommendations.filter(item => item.reason.type === 'popular').length}
              </div>
              <div className="text-sm text-white/60">Popular Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                ${(recommendations.reduce((sum, item) => sum + item.price, 0) / recommendations.length).toFixed(2)}
              </div>
              <div className="text-sm text-white/60">Avg Price</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}; 