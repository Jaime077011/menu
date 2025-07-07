import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

interface LoadingSkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

interface LoadingPulseProps {
  className?: string;
}

// Spinning Loader
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-blue-500',
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizes[size]} ${className}`}
    >
      <div className={`w-full h-full border-2 border-transparent border-t-current rounded-full ${color}`} />
    </motion.div>
  );
};

// Animated Dots
export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  color = 'bg-blue-500',
  className = '',
}) => {
  const sizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
          }}
          className={`${sizes[size]} ${color} rounded-full`}
        />
      ))}
    </div>
  );
};

// Skeleton Loader
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = 'w-full',
  height = 'h-4',
  className = '',
}) => {
  return (
    <motion.div
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`${width} ${height} bg-white/10 rounded-lg ${className}`}
    />
  );
};

// Pulse Effect
export const LoadingPulse: React.FC<LoadingPulseProps> = ({
  className = '',
}) => {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl ${className}`}
    />
  );
};

// Character Loading State
export const CharacterLoading: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
      >
        <span className="text-3xl">🤖</span>
      </motion.div>
      
      <div className="text-center">
        <motion.h3
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-lg font-medium text-white"
        >
          Loading Character...
        </motion.h3>
        <LoadingDots className="mt-2 justify-center" />
      </div>
    </div>
  );
};

// Menu Loading State
export const MenuLoading: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4"
        >
          <div className="flex space-x-4">
            <LoadingSkeleton width="w-16" height="h-16" className="rounded-lg" />
            <div className="flex-1 space-y-2">
              <LoadingSkeleton width="w-3/4" height="h-4" />
              <LoadingSkeleton width="w-1/2" height="h-3" />
              <LoadingSkeleton width="w-1/4" height="h-3" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Chat Loading State
export const ChatLoading: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Waiter message skeleton */}
      <div className="flex justify-start">
        <div className="flex space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full" />
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 max-w-xs">
            <LoadingSkeleton width="w-full" height="h-3" className="mb-2" />
            <LoadingSkeleton width="w-3/4" height="h-3" />
          </div>
        </div>
      </div>
      
      {/* User message skeleton */}
      <div className="flex justify-end">
        <div className="bg-blue-500/20 rounded-2xl p-4 max-w-xs">
          <LoadingSkeleton width="w-full" height="h-3" className="mb-2" />
          <LoadingSkeleton width="w-1/2" height="h-3" />
        </div>
      </div>
    </div>
  );
};

// Full Page Loading
export const FullPageLoading: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4"
        >
          <span className="text-2xl">🍽️</span>
        </motion.div>
        
        <motion.h2
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xl font-bold text-white mb-2"
        >
          Loading Restaurant Experience...
        </motion.h2>
        
        <LoadingDots size="md" color="bg-blue-400" className="justify-center" />
      </div>
    </div>
  );
};

export default {
  LoadingSpinner,
  LoadingDots,
  LoadingSkeleton,
  LoadingPulse,
  CharacterLoading,
  MenuLoading,
  ChatLoading,
  FullPageLoading,
}; 