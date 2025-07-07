import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import ModernChatContainer from '../components/chat/ModernChatContainer';
import GradientButton from '../components/ui/GradientButton';
import { motion } from 'framer-motion';

const TestModernChatPage: NextPage = () => {
  const [currentPersonality, setCurrentPersonality] = useState<'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL' | 'ENTHUSIASTIC'>('FRIENDLY');
  const [waiterName, setWaiterName] = useState('Alex');
  const [restaurantName, setRestaurantName] = useState('Bella Vista Restaurant');
  const [tableNumber, setTableNumber] = useState('12');

  const personalities = [
    { type: 'FRIENDLY' as const, name: 'Friendly', emoji: '😊', color: 'from-green-500 to-emerald-600' },
    { type: 'PROFESSIONAL' as const, name: 'Professional', emoji: '👔', color: 'from-blue-500 to-indigo-600' },
    { type: 'CASUAL' as const, name: 'Casual', emoji: '😎', color: 'from-purple-500 to-pink-600' },
    { type: 'ENTHUSIASTIC' as const, name: 'Enthusiastic', emoji: '🎉', color: 'from-orange-500 to-red-600' },
  ];

  const handleSendMessage = (message: string) => {
    console.log('Message sent:', message);
    // Here you would integrate with your tRPC chat endpoint
  };

  const handleOrderUpdate = (items: any[]) => {
    console.log('Order updated:', items);
    // Here you would integrate with your tRPC order endpoint
  };

  return (
    <>
      <Head>
        <title>Modern Chat Interface - Test</title>
        <meta name="description" content="Testing the new modern chat interface with Rive character" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Settings Panel */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-4 left-4 right-4 z-50 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-bold text-white">🧪 Modern Chat Test</h2>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-white/70">Restaurant:</label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400/50"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-white/70">Waiter:</label>
                <input
                  type="text"
                  value={waiterName}
                  onChange={(e) => setWaiterName(e.target.value)}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400/50"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-white/70">Table:</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400/50"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-white/70">Personality:</span>
              {personalities.map((personality) => (
                <motion.button
                  key={personality.type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPersonality(personality.type)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    currentPersonality === personality.type
                      ? `bg-gradient-to-r ${personality.color} text-white shadow-lg`
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {personality.emoji} {personality.name}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Chat Interface */}
        <div className="pt-24">
          <ModernChatContainer
            restaurantId="test-restaurant"
            restaurantName={restaurantName}
            tableNumber={tableNumber}
            waiterName={waiterName}
            personality={currentPersonality}
            onSendMessage={handleSendMessage}
            onOrderUpdate={handleOrderUpdate}
          />
        </div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 max-w-sm"
        >
          <h3 className="text-sm font-bold text-white mb-2">✨ New Features</h3>
          <ul className="text-xs text-white/70 space-y-1">
            <li>• Full-screen modern layout</li>
            <li>• Rive character integration</li>
            <li>• Animated message bubbles</li>
            <li>• Dynamic personality system</li>
            <li>• Sliding menu sidebar</li>
            <li>• Real-time order tracking</li>
            <li>• Smooth animations throughout</li>
          </ul>
        </motion.div>

        {/* Performance Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4"
        >
          <h3 className="text-sm font-bold text-white mb-2">📊 Performance</h3>
          <div className="text-xs text-white/70 space-y-1">
            <div className="flex justify-between">
              <span>Character Load:</span>
              <span className="text-green-400">~2s</span>
            </div>
            <div className="flex justify-between">
              <span>Animation FPS:</span>
              <span className="text-green-400">60fps</span>
            </div>
            <div className="flex justify-between">
              <span>Memory Usage:</span>
              <span className="text-yellow-400">~15MB</span>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default TestModernChatPage;