// Application-wide constants
export const APP_CONFIG = {
  name: 'Restaurant Menu Assistant',
  version: '1.0.0',
  description: 'AI-Powered Restaurant Menu Assistant',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  auth: '/api/auth',
  menu: '/api/menu',
  orders: '/api/orders',
  chat: '/api/chat',
  admin: '/api/admin',
} as const;

// Routes
export const ROUTES = {
  home: '/',
  admin: '/admin',
  login: '/admin/login',
  kitchen: '/admin/kitchen',
  menu: '/admin/menu',
  orders: '/admin/orders',
} as const;

// UI constants
export const UI_CONSTANTS = {
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
  animations: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  colors: {
    primary: '#f97316', // warm orange
    secondary: '#16a34a', // forest green
    accent: '#eab308', // golden yellow
    danger: '#dc2626', // red
  },
} as const;

// Order status - Import from centralized validation
export { ORDER_STATUS_LABELS as ORDER_STATUS } from '@/utils/orderValidation';

// Chat constants
export const CHAT_CONFIG = {
  maxMessageLength: 500,
  typingIndicatorDelay: 1000,
  reconnectAttempts: 3,
  messageHistoryLimit: 100,
} as const; 