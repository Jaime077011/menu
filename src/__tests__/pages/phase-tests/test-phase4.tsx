import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingOrderSummary } from '@/components/order/FloatingOrderSummary';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { RecommendationEngine } from '@/components/order/RecommendationEngine';
import { InteractiveProductCard } from '@/components/menu/InteractiveProductCard';

// Sample order data for testing
const SAMPLE_ORDER_ITEMS = [
  {
    id: '1',
    menuItemId: '1',
    name: 'Margherita Pizza',
    price: 18.99,
    quantity: 2,
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    notes: 'Extra cheese, no basil',
    subtotal: 37.98
  },
  {
    id: '2',
    menuItemId: '2',
    name: 'Classic Cheeseburger',
    price: 16.50,
    quantity: 1,
    imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
    notes: '',
    subtotal: 16.50
  },
  {
    id: '3',
    menuItemId: '3',
    name: 'Chocolate Lava Cake',
    price: 8.99,
    quantity: 1,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop',
    notes: 'With vanilla ice cream',
    subtotal: 8.99
  }
];

const SAMPLE_MENU_ITEMS = [
  {
    id: '4',
    name: 'Quinoa Power Bowl',
    description: 'Nutrient-rich quinoa with roasted vegetables, avocado, and tahini dressing',
    price: 14.99,
    category: 'Healthy',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
    imageAlt: 'Quinoa Power Bowl',
    available: true,
    dietaryTags: [
      { id: '3', value: 'vegan' },
      { id: '4', value: 'gluten-free' }
    ]
  },
  {
    id: '5',
    name: 'Salmon Teriyaki',
    description: 'Grilled Atlantic salmon glazed with house-made teriyaki sauce',
    price: 24.99,
    category: 'Seafood',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
    imageAlt: 'Salmon Teriyaki',
    available: true,
    dietaryTags: [
      { id: '8', value: 'dairy-free' }
    ]
  },
  {
    id: '6',
    name: 'Truffle Pasta',
    description: 'Fresh pasta with truffle oil, mushrooms, and parmesan',
    price: 22.99,
    category: 'Pasta',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop',
    imageAlt: 'Truffle Pasta',
    available: true,
    dietaryTags: [
      { id: '10', value: 'vegetarian' }
    ]
  }
];

const SAMPLE_ORDER_TIMELINE = [
  {
    id: '1',
    status: 'PLACED',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    title: 'Order Placed',
    description: 'Your order has been received',
    icon: '📝'
  },
  {
    id: '2',
    status: 'CONFIRMED',
    timestamp: new Date(Date.now() - 3 * 60 * 1000),
    title: 'Order Confirmed',
    description: 'Restaurant confirmed your order',
    icon: '✅'
  },
  {
    id: '3',
    status: 'PREPARING',
    timestamp: new Date(Date.now() - 1 * 60 * 1000),
    title: 'Preparing',
    description: 'Your order is being prepared',
    icon: '👨‍🍳'
  },
  {
    id: '4',
    status: 'READY',
    timestamp: null,
    title: 'Ready for Pickup',
    description: 'Estimated time: 5-10 minutes',
    icon: '🔔',
    isEstimated: true
  }
];

const TestPhase4: React.FC = () => {
  const [orderItems, setOrderItems] = useState(SAMPLE_ORDER_ITEMS);
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const handleAddToOrder = (item: any) => {
    const newItem = {
      id: `${Date.now()}`,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
      notes: '',
      subtotal: item.price
    };
    setOrderItems([...orderItems, newItem]);
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setOrderItems(orderItems.filter(item => item.id !== itemId));
    } else {
      setOrderItems(orderItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
          : item
      ));
    }
  };

  const handleUpdateNotes = (itemId: string, notes: string) => {
    setOrderItems(orderItems.map(item => 
      item.id === itemId ? { ...item, notes } : item
    ));
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const orderTotal = orderItems.reduce((total, item) => total + item.subtotal, 0);
  const orderItemCount = orderItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            🛒 Phase 4: Enhanced Order Experience
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Testing smart order management, recommendations, and order customization
          </p>
        </motion.div>

        {/* Control Panel */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">🎛️ Demo Controls</h2>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  isOrderSummaryOpen
                    ? 'bg-green-500/20 text-green-300 border-green-400/30'
                    : 'bg-gray-500/20 text-gray-300 border-gray-400/30'
                }`}
              >
                {isOrderSummaryOpen ? 'Hide' : 'Show'} Order Summary
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTimeline(!showTimeline)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  showTimeline
                    ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                    : 'bg-gray-500/20 text-gray-300 border-gray-400/30'
                }`}
              >
                {showTimeline ? 'Hide' : 'Show'} Timeline
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowRecommendations(!showRecommendations)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  showRecommendations
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                    : 'bg-gray-500/20 text-gray-300 border-gray-400/30'
                }`}
              >
                {showRecommendations ? 'Hide' : 'Show'} Recommendations
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOrderItems([])}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg border border-red-400/30 transition-colors"
              >
                Clear Order
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Menu Items */}
          <div className="lg:col-span-2">
            {/* Recommended Items */}
            <AnimatePresence>
              {showRecommendations && (
                <motion.section
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8"
                >
                  <h2 className="text-2xl font-bold text-white mb-6">🤖 AI Recommendations</h2>
                  <RecommendationEngine
                    currentOrder={orderItems}
                    onAddToOrder={handleAddToOrder}
                  />
                </motion.section>
              )}
            </AnimatePresence>

            {/* Menu Items */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">🍽️ Add More Items</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SAMPLE_MENU_ITEMS.map((item, index) => (
                  <InteractiveProductCard
                    key={item.id}
                    item={item}
                    isRecommended={index === 1}
                    onAddToOrder={handleAddToOrder}
                  />
                ))}
              </div>
            </motion.section>
          </div>

          {/* Right Column - Order Management */}
          <div className="lg:col-span-1">
            
            {/* Order Timeline */}
            <AnimatePresence>
              {showTimeline && (
                <motion.section
                  initial={{ opacity: 0, x: 300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 300 }}
                  className="mb-8"
                >
                  <h2 className="text-xl font-bold text-white mb-4">📋 Order Timeline</h2>
                  <OrderTimeline timeline={SAMPLE_ORDER_TIMELINE} />
                </motion.section>
              )}
            </AnimatePresence>

            {/* Order Stats */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-white mb-4">📊 Order Stats</h2>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{orderItemCount}</div>
                    <div className="text-sm text-white/70">Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">${orderTotal.toFixed(2)}</div>
                    <div className="text-sm text-white/70">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{orderItems.length}</div>
                    <div className="text-sm text-white/70">Types</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">15-20</div>
                    <div className="text-sm text-white/70">Min ETA</div>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </div>

        {/* Feature Status */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">✅ Phase 4 Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-green-400 mb-4">🛒 Smart Order Management</h3>
              <ul className="space-y-2 text-white/70">
                <li>🔄 Floating order summary with live updates</li>
                <li>✏️ Order modification capabilities</li>
                <li>📋 Order timeline with status tracking</li>
                <li>⏰ Order confirmation with estimated time</li>
                <li>📝 Order notes and special instructions</li>
              </ul>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-blue-400 mb-4">🤖 Intelligent Recommendations</h3>
              <ul className="space-y-2 text-white/70">
                <li>🧠 AI-powered recommendation engine</li>
                <li>👥 "Customers also ordered" suggestions</li>
                <li>🥗 Dietary preference learning</li>
                <li>🎯 Personalized menu sorting</li>
                <li>🌟 Seasonal and special offers</li>
              </ul>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-purple-400 mb-4">⚙️ Order Customization</h3>
              <ul className="space-y-2 text-white/70">
                <li>🔧 Advanced customization modals</li>
                <li>🥄 Ingredient modification options</li>
                <li>💬 Special instructions with limits</li>
                <li>⚠️ Allergy and dietary warnings</li>
                <li>😊 Order notes with emoji support</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-white/50 text-sm"
        >
          <p>🎮 Interactive Demo • Add items to order • Modify quantities and notes • Test all order management features</p>
        </motion.div>
      </div>

      {/* Floating Order Summary */}
      <FloatingOrderSummary
        isOpen={isOrderSummaryOpen}
        onToggle={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
        orderItems={orderItems}
        total={orderTotal}
        onUpdateQuantity={handleUpdateQuantity}
        onUpdateNotes={handleUpdateNotes}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
};

export default TestPhase4; 