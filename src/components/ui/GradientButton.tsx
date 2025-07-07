import React from 'react';
import { motion } from 'framer-motion';

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
}

const variants = {
  primary: 'from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
  secondary: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
  success: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
  warning: 'from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700',
  danger: 'from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700',
};

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  loading = false,
}) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`
        relative overflow-hidden rounded-xl font-medium text-white
        bg-gradient-to-r ${variants[variant]}
        disabled:from-gray-500 disabled:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 shadow-lg
        ${sizes[size]}
        ${className}
      `}
    >
      {/* Loading Spinner */}
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
        </motion.div>
      )}
      
      {/* Button Content */}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
      
      {/* Shine Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />
    </motion.button>
  );
};

export default GradientButton; 