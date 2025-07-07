import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/utils/api';

interface WaiterTemplate {
  id: string;
  name: string;
  description: string;
  tone: string;
  responseStyle: string;
  defaultWelcomeMessage: string | null;
  minimumPlan: string | null;
  isPremium: boolean;
}

interface Props {
  restaurantId: string;
  restaurantName: string;
  subdomain: string;
}

export default function SelectWaiterPage({ restaurantId, restaurantName, subdomain }: Props) {
  const router = useRouter();
  const [selectedWaiter, setSelectedWaiter] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch available waiters based on restaurant's plan
  const { data: waiters, isLoading } = api.restaurant.getWaiterTemplates.useQuery({
    restaurantId,
  });

  const handleWaiterSelect = async (waiterId: string) => {
    setSelectedWaiter(waiterId);
    setIsConnecting(true);

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Redirect to main chat page with selected waiter
    router.push(`/${subdomain}?waiter=${waiterId}`);
  };

  const getWaiterIcon = (name: string) => {
    if (name.toLowerCase().includes('friendly')) return '😊';
    if (name.toLowerCase().includes('professional')) return '👔';
    if (name.toLowerCase().includes('casual')) return '😎';
    if (name.toLowerCase().includes('enthusiastic')) return '🎉';
    return '🤖';
  };

  const getToneColor = (tone: string) => {
    switch (tone.toLowerCase()) {
      case 'formal': return 'from-blue-500 to-indigo-600';
      case 'balanced': return 'from-green-500 to-emerald-600';
      case 'casual': return 'from-purple-500 to-pink-600';
      default: return 'from-cyan-500 to-blue-600';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-300 font-mono">Loading available waiters...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Select Your Waiter - {restaurantName}</title>
        <meta name="description" content={`Choose your AI waiter for ${restaurantName}`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-transparent to-purple-900/20"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-3xl opacity-25 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-mono font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent mb-4">
              Choose Your Waiter
            </h1>
            <p className="text-xl text-gray-300 font-mono mb-2">Welcome to {restaurantName}</p>
            <p className="text-gray-400 font-mono">Select your preferred AI assistant to help with your order</p>
          </motion.div>

          {/* Waiters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
            <AnimatePresence>
              {waiters?.map((waiter, index) => (
                <motion.div
                  key={waiter.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gray-900/50 backdrop-blur border border-gray-700 rounded-2xl p-8 text-center hover:border-cyan-400/50 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                    selectedWaiter === waiter.id ? 'border-cyan-400 bg-cyan-500/10' : ''
                  }`}
                  onClick={() => handleWaiterSelect(waiter.id)}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Premium Badge */}
                  {waiter.isPremium && (
                    <div className="absolute -top-3 -right-3">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                        PREMIUM
                      </div>
                    </div>
                  )}

                  {/* Waiter Avatar */}
                  <div className={`w-24 h-24 bg-gradient-to-r ${getToneColor(waiter.tone)} rounded-full flex items-center justify-center text-4xl mb-6 mx-auto shadow-lg`}>
                    {getWaiterIcon(waiter.name)}
                  </div>

                  {/* Waiter Info */}
                  <h3 className="text-2xl font-mono font-bold text-white mb-3">{waiter.name}</h3>
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">{waiter.description}</p>

                  {/* Characteristics */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Tone:</span>
                      <span className="text-cyan-300 font-mono">{waiter.tone}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Style:</span>
                      <span className="text-cyan-300 font-mono">{waiter.responseStyle}</span>
                    </div>
                  </div>

                  {/* Welcome Message Preview */}
                  {waiter.defaultWelcomeMessage && (
                    <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                      <p className="text-gray-300 text-sm italic leading-relaxed">
                        "{waiter.defaultWelcomeMessage.substring(0, 100)}..."
                      </p>
                    </div>
                  )}

                  {/* Select Button */}
                  <motion.button
                    className={`w-full py-3 px-6 rounded-lg font-mono font-medium transition-all duration-300 ${
                      selectedWaiter === waiter.id
                        ? 'bg-cyan-500 text-black'
                        : 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 hover:from-cyan-500/30 hover:to-purple-500/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isConnecting}
                  >
                    {selectedWaiter === waiter.id && isConnecting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>Connecting...</span>
                      </div>
                    ) : (
                      'Select This Waiter'
                    )}
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Quick Start Option */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-gray-400 font-mono mb-4">In a hurry?</p>
            <button
              onClick={() => router.push(`/${subdomain}`)}
              className="px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 font-mono transition-all duration-300"
            >
              Skip Selection & Use Default Waiter
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { subdomain } = context.params!;
  
  // Here you would typically fetch restaurant data
  // For now, we'll use mock data
  const mockRestaurant = {
    id: 'restaurant-123',
    name: 'Demo Restaurant',
    subdomain: subdomain as string,
  };

  return {
    props: {
      restaurantId: mockRestaurant.id,
      restaurantName: mockRestaurant.name,
      subdomain: mockRestaurant.subdomain,
    },
  };
}; 