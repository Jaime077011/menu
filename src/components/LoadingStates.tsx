import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Loading Spinner Component
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray' | 'green' | 'red';
  className?: string;
}> = ({ size = 'md', color = 'blue', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    blue: 'border-blue-500',
    white: 'border-white',
    gray: 'border-gray-500',
    green: 'border-green-500',
    red: 'border-red-500',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-2 ${colorClasses[color]} border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
};

// Pulsing Dots Loader
export const PulsingDots: React.FC<{
  color?: 'blue' | 'white' | 'gray' | 'green' | 'red';
  className?: string;
}> = ({ color = 'blue', className = '' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    white: 'bg-white',
    gray: 'bg-gray-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`w-2 h-2 ${colorClasses[color]} rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  );
};

// Skeleton Loader
export const SkeletonLoader: React.FC<{
  lines?: number;
  className?: string;
  avatar?: boolean;
}> = ({ lines = 3, className = '', avatar = false }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {avatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-700 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-slate-600 rounded w-1/3"></div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`h-4 bg-slate-700 rounded ${
              index === lines - 1 ? 'w-2/3' : 'w-full'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Progress Bar
export const ProgressBar: React.FC<{
  progress: number;
  color?: 'blue' | 'green' | 'red' | 'yellow';
  showPercentage?: boolean;
  className?: string;
}> = ({ progress, color = 'blue', showPercentage = false, className = '' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        {showPercentage && (
          <span className="text-sm text-slate-400">{Math.round(clampedProgress)}%</span>
        )}
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <motion.div
          className={`h-2 ${colorClasses[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// Loading Overlay
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  message?: string;
  children?: React.ReactNode;
  blur?: boolean;
}> = ({ isVisible, message = 'Loading...', children, blur = true }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            blur ? 'backdrop-blur-sm' : ''
          } bg-black/50`}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl"
          >
            <div className="flex flex-col items-center space-y-4">
              <LoadingSpinner size="lg" color="blue" />
              <p className="text-white font-medium">{message}</p>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Character Loading State
export const CharacterLoadingState: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = 'Loading character...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="text-6xl mb-4"
      >
        🤖
      </motion.div>
      <div className="flex items-center space-x-2">
        <PulsingDots color="blue" />
        <span className="text-slate-400 text-sm">{message}</span>
      </div>
    </div>
  );
};

// Chat Loading State
export const ChatLoadingState: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = 'AI is thinking...', className = '' }) => {
  return (
    <div className={`flex items-center space-x-3 p-4 ${className}`}>
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center"
      >
        <span className="text-sm">🧠</span>
      </motion.div>
      <div className="flex items-center space-x-2">
        <PulsingDots color="blue" />
        <span className="text-slate-400 text-sm">{message}</span>
      </div>
    </div>
  );
};

// Menu Loading State
export const MenuLoadingState: React.FC<{
  items?: number;
  className?: string;
}> = ({ items = 6, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-slate-800 rounded-xl p-4 animate-pulse">
          <div className="w-full h-48 bg-slate-700 rounded-lg mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            <div className="h-3 bg-slate-600 rounded w-1/2"></div>
            <div className="h-4 bg-slate-700 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Order Loading State
export const OrderLoadingState: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="sm" color="blue" />
          <span className="text-slate-400">Processing your order...</span>
        </div>
        <PulsingDots color="green" />
      </div>
      <ProgressBar progress={75} color="green" showPercentage />
    </div>
  );
};

// Button Loading State
export const ButtonLoadingState: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}> = ({ 
  isLoading, 
  children, 
  loadingText = 'Loading...', 
  className = '', 
  disabled = false,
  onClick 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`relative overflow-hidden transition-all duration-200 ${
        isLoading || disabled ? 'opacity-70 cursor-not-allowed' : ''
      } ${className}`}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center space-x-2"
          >
            <LoadingSpinner size="sm" color="white" />
            <span>{loadingText}</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

// Page Loading State
export const PageLoadingState: React.FC<{
  message?: string;
}> = ({ message = 'Loading page...' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-6xl mb-6"
        >
          🍽️
        </motion.div>
        <div className="flex items-center justify-center space-x-3 mb-4">
          <LoadingSpinner size="lg" color="blue" />
          <span className="text-white text-lg font-medium">{message}</span>
        </div>
        <PulsingDots color="blue" />
      </div>
    </div>
  );
};

// Export all components
export default {
  LoadingSpinner,
  PulsingDots,
  SkeletonLoader,
  ProgressBar,
  LoadingOverlay,
  CharacterLoadingState,
  ChatLoadingState,
  MenuLoadingState,
  OrderLoadingState,
  ButtonLoadingState,
  PageLoadingState,
}; 