import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessAnimationProps {
  isVisible: boolean;
}

interface ProgressIndicatorProps {
  isVisible: boolean;
  progress: number;
}

interface PulseNotificationProps {
  isVisible: boolean;
  message: string;
}

interface ShakeAnimationProps {
  isActive: boolean;
  children: React.ReactNode;
}

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  className?: string;
}

interface BounceAnimationProps {
  isActive: boolean;
  children: React.ReactNode;
}

// Success Animation Component
export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1.2, 1], 
          opacity: [0, 1, 1],
          rotate: [0, 10, 0]
        }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full border-2 border-green-400/50"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-green-400 text-2xl"
        >
          ✓
        </motion.span>
      </motion.div>
    )}
  </AnimatePresence>
);

// Progress Indicator Component
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ isVisible, progress }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex flex-col items-center space-y-2"
      >
        <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full relative"
          >
            <motion.div
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute top-0 left-0 w-4 h-full bg-white/30 rounded-full blur-sm"
            />
          </motion.div>
        </div>
        <span className="text-xs text-white/70">{progress}%</span>
      </motion.div>
    )}
  </AnimatePresence>
);

// Pulse Notification Component
export const PulseNotification: React.FC<PulseNotificationProps> = ({ isVisible, message }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1.1, 1], 
          opacity: 1,
        }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-4 right-4 bg-purple-500/90 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm border border-purple-400/50 z-50"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center space-x-2"
        >
          <span className="text-sm font-medium">{message}</span>
          <motion.span
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-lg"
          >
            ✨
          </motion.span>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Shake Animation Component
export const ShakeAnimation: React.FC<ShakeAnimationProps> = ({ isActive, children }) => (
  <motion.div
    animate={isActive ? {
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.5 }
    } : {}}
  >
    {children}
  </motion.div>
);

// Floating Action Button Component
export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onClick, 
  icon, 
  label, 
  className = "" 
}) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-40 ${className}`}
    aria-label={label}
  >
    <motion.div
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
      {icon}
    </motion.div>
  </motion.button>
);

// Bounce Animation Component
export const BounceAnimation: React.FC<BounceAnimationProps> = ({ isActive, children }) => (
  <motion.div
    animate={isActive ? {
      y: [-20, 0, -10, 0],
      transition: { duration: 0.6, ease: "easeOut" }
    } : {}}
  >
    {children}
  </motion.div>
);

// Main MicroInteractions Export
export const MicroInteractions = {
  SuccessAnimation,
  ProgressIndicator,
  PulseNotification,
  ShakeAnimation,
  FloatingActionButton,
  BounceAnimation,
};

export default MicroInteractions; 