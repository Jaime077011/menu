import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ChatErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

interface ChatErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallbackComponent?: ReactNode;
  maxRetries?: number;
}

export class ChatErrorBoundary extends Component<ChatErrorBoundaryProps, ChatErrorBoundaryState> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: ChatErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ChatErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chat Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Auto-retry for certain types of errors
    if (this.shouldAutoRetry(error) && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    // Auto-retry for network or temporary errors
    const retryableErrors = [
      'network',
      'timeout',
      'fetch',
      'connection',
      'temporary'
    ];
    
    return retryableErrors.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }

  private scheduleRetry = () => {
    const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff, max 10s
    
    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
    }, retryDelay);
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0
    });
  };

  private getErrorType(error?: Error): string {
    if (!error) return 'unknown';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission';
    }
    if (message.includes('validation')) {
      return 'validation';
    }
    
    return 'system';
  }

  private getErrorMessage(errorType: string): { title: string; message: string; icon: string } {
    switch (errorType) {
      case 'network':
        return {
          title: 'Connection Issue',
          message: 'Having trouble connecting to our servers. Your chat history is saved.',
          icon: '🌐'
        };
      case 'timeout':
        return {
          title: 'Request Timeout',
          message: 'That took longer than expected. Let\'s try a simpler approach.',
          icon: '⏱️'
        };
      case 'permission':
        return {
          title: 'Access Issue',
          message: 'There seems to be a permission issue. Try refreshing the page.',
          icon: '🔒'
        };
      case 'validation':
        return {
          title: 'Input Error',
          message: 'There was an issue with your request. Please try rephrasing.',
          icon: '⚠️'
        };
      default:
        return {
          title: 'Unexpected Error',
          message: 'Something unexpected happened, but I\'m still here to help!',
          icon: '🤖'
        };
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      const errorType = this.getErrorType(this.state.error);
      const errorDetails = this.getErrorMessage(errorType);
      const canRetry = this.state.retryCount < (this.props.maxRetries || 3);

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-400/30 rounded-xl p-6 m-4 backdrop-blur-sm"
        >
          <div className="flex items-start space-x-4">
            <div className="text-3xl">{errorDetails.icon}</div>
            
            <div className="flex-1">
              <h3 className="text-red-300 font-semibold text-lg mb-2">
                {errorDetails.title}
              </h3>
              
              <p className="text-red-200/80 mb-4">
                {errorDetails.message}
              </p>

              {/* Retry Information */}
              {this.state.retryCount > 0 && (
                <div className="bg-red-500/20 rounded-lg p-3 mb-4">
                  <p className="text-red-200 text-sm">
                    Attempted {this.state.retryCount} time(s). 
                    {canRetry ? ' Trying again automatically...' : ' Manual retry available.'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={this.handleManualRetry}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg font-medium transition-colors border border-red-400/30"
                >
                  🔄 Try Again
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.reload()}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors border border-white/20"
                >
                  🔄 Refresh Page
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Reset to a clean state
                    localStorage.removeItem('chat-history');
                    this.handleManualRetry();
                  }}
                  className="bg-white/5 hover:bg-white/10 text-white/70 px-4 py-2 rounded-lg transition-colors border border-white/10"
                >
                  🆕 Start Fresh
                </motion.button>
              </div>

              {/* Helpful Tips */}
              <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <h4 className="text-white font-medium text-sm mb-2">💡 Helpful Tips:</h4>
                <ul className="text-white/60 text-sm space-y-1">
                  <li>• Your conversation history is automatically saved</li>
                  <li>• You can browse the menu while we fix this</li>
                  <li>• Our staff can always help you place an order manually</li>
                  {errorType === 'network' && (
                    <li>• Check your internet connection</li>
                  )}
                  {errorType === 'timeout' && (
                    <li>• Try using simpler requests</li>
                  )}
                </ul>
              </div>

              {/* Debug Info (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="text-white/60 text-sm cursor-pointer hover:text-white/80">
                    Debug Information
                  </summary>
                  <div className="mt-2 p-3 bg-black/20 rounded text-xs text-white/60 font-mono">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary in functional components
export function useChatErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Chat error handled:', error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    hasError: error !== null
  };
} 