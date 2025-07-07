import { TRPCError } from '@trpc/server';
import { TRPCClientError } from '@trpc/client';
import { toast } from 'react-hot-toast';

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Enhanced error interface
export interface EnhancedError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
  retryCount?: number;
  maxRetries?: number;
}

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  TIMEOUT_ERROR: 'The request took too long to complete. Please try again.',
  
  // Authentication errors
  UNAUTHORIZED: 'You need to log in to access this feature.',
  FORBIDDEN: 'You don\'t have permission to perform this action.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  
  // Validation errors
  VALIDATION_ERROR: 'Please check your input and try again.',
  INVALID_INPUT: 'The information provided is not valid.',
  MISSING_REQUIRED: 'Please fill in all required fields.',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'Something went wrong on our end. We\'re working to fix it.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
  DATABASE_ERROR: 'We\'re having trouble accessing your data. Please try again.',
  
  // Business logic errors
  RESTAURANT_NOT_FOUND: 'Restaurant not found. Please check the URL.',
  MENU_ITEM_UNAVAILABLE: 'This menu item is currently unavailable.',
  ORDER_FAILED: 'Unable to place your order. Please try again.',
  CHAT_ERROR: 'Unable to send message. Please try again.',
  
  // Default
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

// Classify tRPC errors
export const classifyTRPCError = (error: TRPCClientError<any>): EnhancedError => {
  const timestamp = new Date();
  
  // Network/Connection errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      message: error.message,
      userMessage: ERROR_MESSAGES.NETWORK_ERROR,
      timestamp,
      retryable: true,
      maxRetries: 3,
    };
  }
  
  // Timeout errors
  if (error.message.includes('timeout') || error.message.includes('aborted')) {
    return {
      type: ErrorType.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      message: error.message,
      userMessage: ERROR_MESSAGES.TIMEOUT_ERROR,
      timestamp,
      retryable: true,
      maxRetries: 2,
    };
  }
  
  // tRPC specific errors
  if (error.data?.code) {
    switch (error.data.code) {
      case 'UNAUTHORIZED':
        return {
          type: ErrorType.AUTHENTICATION,
          severity: ErrorSeverity.HIGH,
          message: error.message,
          userMessage: ERROR_MESSAGES.UNAUTHORIZED,
          code: error.data.code,
          timestamp,
          retryable: false,
        };
        
      case 'FORBIDDEN':
        return {
          type: ErrorType.AUTHORIZATION,
          severity: ErrorSeverity.HIGH,
          message: error.message,
          userMessage: ERROR_MESSAGES.FORBIDDEN,
          code: error.data.code,
          timestamp,
          retryable: false,
        };
        
      case 'NOT_FOUND':
        return {
          type: ErrorType.NOT_FOUND,
          severity: ErrorSeverity.MEDIUM,
          message: error.message,
          userMessage: error.message.includes('Restaurant') 
            ? ERROR_MESSAGES.RESTAURANT_NOT_FOUND 
            : 'The requested item was not found.',
          code: error.data.code,
          timestamp,
          retryable: false,
        };
        
      case 'BAD_REQUEST':
        return {
          type: ErrorType.VALIDATION,
          severity: ErrorSeverity.LOW,
          message: error.message,
          userMessage: ERROR_MESSAGES.VALIDATION_ERROR,
          code: error.data.code,
          details: error.data.zodError,
          timestamp,
          retryable: false,
        };
        
      case 'INTERNAL_SERVER_ERROR':
        return {
          type: ErrorType.SERVER,
          severity: ErrorSeverity.CRITICAL,
          message: error.message,
          userMessage: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
          code: error.data.code,
          timestamp,
          retryable: true,
          maxRetries: 1,
        };
        
      default:
        return {
          type: ErrorType.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          message: error.message,
          userMessage: ERROR_MESSAGES.UNKNOWN_ERROR,
          code: error.data.code,
          timestamp,
          retryable: true,
          maxRetries: 1,
        };
    }
  }
  
  // Default classification
  return {
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    message: error.message,
    userMessage: ERROR_MESSAGES.UNKNOWN_ERROR,
    timestamp,
    retryable: true,
    maxRetries: 1,
  };
};

// Enhanced error handler with retry logic
export class ErrorHandler {
  private static instance: ErrorHandler;
  private retryAttempts: Map<string, number> = new Map();
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  // Handle tRPC errors with automatic retry
  async handleTRPCError(
    error: TRPCClientError<any>,
    context?: string,
    retryFn?: () => Promise<any>
  ): Promise<void> {
    const enhancedError = classifyTRPCError(error);
    const errorKey = `${context || 'unknown'}_${enhancedError.type}`;
    
    // Log error for debugging
    console.error('🚨 tRPC Error:', {
      context,
      error: enhancedError,
      originalError: error,
    });
    
    // Track retry attempts
    const currentRetries = this.retryAttempts.get(errorKey) || 0;
    
    // Attempt retry if applicable
    if (enhancedError.retryable && retryFn && currentRetries < (enhancedError.maxRetries || 1)) {
      this.retryAttempts.set(errorKey, currentRetries + 1);
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, currentRetries), 5000);
      
      toast.loading(`Retrying... (${currentRetries + 1}/${enhancedError.maxRetries})`, {
        id: errorKey,
        duration: delay,
      });
      
      setTimeout(async () => {
        try {
          await retryFn();
          this.retryAttempts.delete(errorKey);
          toast.dismiss(errorKey);
        } catch (retryError) {
          if (retryError instanceof TRPCClientError) {
            await this.handleTRPCError(retryError, context, retryFn);
          }
        }
      }, delay);
      
      return;
    }
    
    // Reset retry count
    this.retryAttempts.delete(errorKey);
    
    // Show user-friendly error message
    this.showErrorToast(enhancedError);
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(enhancedError, context);
    }
  }
  
  // Show appropriate toast message
  private showErrorToast(error: EnhancedError): void {
    const toastOptions = {
      duration: this.getToastDuration(error.severity),
      style: this.getToastStyle(error.severity),
    };
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        toast.error(error.userMessage, {
          ...toastOptions,
          icon: '🚨',
        });
        break;
        
      case ErrorSeverity.HIGH:
        toast.error(error.userMessage, {
          ...toastOptions,
          icon: '⚠️',
        });
        break;
        
      case ErrorSeverity.MEDIUM:
        toast.error(error.userMessage, {
          ...toastOptions,
          icon: '❌',
        });
        break;
        
      case ErrorSeverity.LOW:
        toast(error.userMessage, {
          ...toastOptions,
          icon: '⚠️',
        });
        break;
    }
  }
  
  private getToastDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 8000;
      case ErrorSeverity.HIGH:
        return 6000;
      case ErrorSeverity.MEDIUM:
        return 4000;
      case ErrorSeverity.LOW:
        return 3000;
      default:
        return 4000;
    }
  }
  
  private getToastStyle(severity: ErrorSeverity): object {
    const baseStyle = {
      borderRadius: '12px',
      background: '#1e293b',
      color: '#fff',
      border: '1px solid',
    };
    
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return { ...baseStyle, borderColor: '#dc2626' };
      case ErrorSeverity.HIGH:
        return { ...baseStyle, borderColor: '#ea580c' };
      case ErrorSeverity.MEDIUM:
        return { ...baseStyle, borderColor: '#ca8a04' };
      case ErrorSeverity.LOW:
        return { ...baseStyle, borderColor: '#65a30d' };
      default:
        return baseStyle;
    }
  }
  
  // Log error to external service
  private logErrorToService(error: EnhancedError, context?: string): void {
    const errorData = {
      ...error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };
    
    // TODO: Replace with actual error tracking service (Sentry, LogRocket, etc.)
    console.log('📊 Error logged to service:', errorData);
  }
  
  private getCurrentUserId(): string | null {
    // TODO: Get current user ID from auth context
    return null;
  }
}

// Utility functions for common error scenarios
export const handleChatError = (error: TRPCClientError<any>, retryFn?: () => Promise<any>) => {
  return ErrorHandler.getInstance().handleTRPCError(error, 'chat', retryFn);
};

export const handleOrderError = (error: TRPCClientError<any>, retryFn?: () => Promise<any>) => {
  return ErrorHandler.getInstance().handleTRPCError(error, 'order', retryFn);
};

export const handleMenuError = (error: TRPCClientError<any>, retryFn?: () => Promise<any>) => {
  return ErrorHandler.getInstance().handleTRPCError(error, 'menu', retryFn);
};

export const handleAuthError = (error: TRPCClientError<any>) => {
  return ErrorHandler.getInstance().handleTRPCError(error, 'auth');
};

// Validation error helpers
export const formatValidationErrors = (zodError: any): string[] => {
  if (!zodError?.fieldErrors) return [];
  
  const errors: string[] = [];
  Object.entries(zodError.fieldErrors).forEach(([field, messages]) => {
    if (Array.isArray(messages)) {
      messages.forEach((message) => {
        errors.push(`${field}: ${message}`);
      });
    }
  });
  
  return errors;
};

// Network status utilities
export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const waitForOnline = (): Promise<void> => {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve();
      return;
    }
    
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };
    
    window.addEventListener('online', handleOnline);
  });
};

// Error boundary integration
export const reportErrorToBoundary = (error: Error, errorInfo?: any) => {
  console.error('🚨 Error reported to boundary:', error);
  
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service
  }
};

export default ErrorHandler; 