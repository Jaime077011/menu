import { api } from '@/utils/api';

export interface SessionConfig {
  autoCreateOnFirstMessage: boolean;
  autoEndOnOrderServed: boolean;
  sessionTimeoutMinutes: number;
  askForNameAfterMinutes: number;
}

export interface SessionContext {
  restaurantId: string;
  tableNumber: string;
  currentSession?: any;
}

export class SessionManager {
  private config: SessionConfig;
  private context: SessionContext;
  private nameReminderTimer?: NodeJS.Timeout;
  private timeoutTimer?: NodeJS.Timeout;

  constructor(context: SessionContext, config: Partial<SessionConfig> = {}) {
    this.context = context;
    this.config = {
      autoCreateOnFirstMessage: true,
      autoEndOnOrderServed: false, // Let users manually end sessions
      sessionTimeoutMinutes: 120, // 2 hours
      askForNameAfterMinutes: 5,
      ...config,
    };
  }

  /**
   * Initialize session management
   * Should be called when the chat component loads
   */
  async initialize(): Promise<any> {
    try {
      // Check for existing active session
      const existingSession = await this.getCurrentSession();
      
      if (existingSession) {
        this.context.currentSession = existingSession;
        this.setupTimers();
        return existingSession;
      }

      return null;
    } catch (error) {
      console.error('Failed to initialize session manager:', error);
      return null;
    }
  }

  /**
   * Handle first message from user
   * Auto-creates session if configured to do so
   */
  async handleFirstMessage(userMessage: string): Promise<any> {
    if (!this.config.autoCreateOnFirstMessage || this.context.currentSession) {
      return this.context.currentSession;
    }

    try {
      const session = await this.createSession({
        notes: `First message: "${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}"`,
      });

      this.context.currentSession = session;
      this.setupTimers();
      
      return session;
    } catch (error) {
      console.error('Failed to create session on first message:', error);
      return null;
    }
  }

  /**
   * Handle order completion
   * Can auto-end session if configured
   */
  async handleOrderServed(orderId: string): Promise<void> {
    if (!this.context.currentSession || !this.config.autoEndOnOrderServed) {
      return;
    }

    try {
      // Check if all orders are served
      const session = await this.getCurrentSession();
      if (!session) return;

      const allOrdersServed = session.orders.every((order: any) => 
        order.status === 'SERVED' || order.status === 'CANCELLED'
      );

      if (allOrdersServed) {
        await this.endSession('COMPLETED', 'All orders have been served');
      }
    } catch (error) {
      console.error('Failed to handle order completion:', error);
    }
  }

  /**
   * Get current active session
   */
  private async getCurrentSession(): Promise<any> {
    try {
      // This would use the tRPC client
      // For now, return null - will be implemented when tRPC is available
      return null;
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  /**
   * Create a new session
   */
  private async createSession(options: { customerName?: string; notes?: string } = {}): Promise<any> {
    try {
      // This would use the tRPC client
      // For now, return mock session - will be implemented when tRPC is available
      return {
        id: 'mock-session-id',
        customerName: options.customerName,
        tableNumber: this.context.tableNumber,
        restaurantId: this.context.restaurantId,
        startTime: new Date(),
        status: 'ACTIVE',
        notes: options.notes,
      };
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * End current session
   */
  async endSession(status: 'COMPLETED' | 'ABANDONED' | 'CANCELLED', notes?: string): Promise<any> {
    if (!this.context.currentSession) {
      throw new Error('No active session to end');
    }

    try {
      this.clearTimers();
      
      // This would use the tRPC client
      // For now, return mock result - will be implemented when tRPC is available
      const result = {
        success: true,
        session: {
          ...this.context.currentSession,
          status,
          endTime: new Date(),
          notes: notes ? `${this.context.currentSession.notes || ''}\n${notes}`.trim() : this.context.currentSession.notes,
        },
        message: this.getEndSessionMessage(status),
      };

      this.context.currentSession = null;
      return result;
    } catch (error) {
      console.error('Failed to end session:', error);
      throw error;
    }
  }

  /**
   * Update customer information
   */
  async updateCustomerInfo(customerName: string, notes?: string): Promise<any> {
    if (!this.context.currentSession) {
      throw new Error('No active session to update');
    }

    try {
      // This would use the tRPC client
      // For now, return mock result - will be implemented when tRPC is available
      const updatedSession = {
        ...this.context.currentSession,
        customerName,
        notes: notes || this.context.currentSession.notes,
      };

      this.context.currentSession = updatedSession;
      return updatedSession;
    } catch (error) {
      console.error('Failed to update customer info:', error);
      throw error;
    }
  }

  /**
   * Setup timers for name reminder and session timeout
   */
  private setupTimers(): void {
    this.clearTimers();

    // Name reminder timer
    if (!this.context.currentSession?.customerName && this.config.askForNameAfterMinutes > 0) {
      this.nameReminderTimer = setTimeout(() => {
        this.triggerNameReminder();
      }, this.config.askForNameAfterMinutes * 60 * 1000);
    }

    // Session timeout timer
    if (this.config.sessionTimeoutMinutes > 0) {
      this.timeoutTimer = setTimeout(() => {
        this.handleSessionTimeout();
      }, this.config.sessionTimeoutMinutes * 60 * 1000);
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.nameReminderTimer) {
      clearTimeout(this.nameReminderTimer);
      this.nameReminderTimer = undefined;
    }

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = undefined;
    }
  }

  /**
   * Trigger name reminder
   */
  private triggerNameReminder(): void {
    // This would trigger a UI reminder or AI message
    console.log('Time to ask for customer name');
    
    // Could dispatch a custom event that the chat component listens to
    window.dispatchEvent(new CustomEvent('session:askForName', {
      detail: { sessionId: this.context.currentSession?.id }
    }));
  }

  /**
   * Handle session timeout
   */
  private async handleSessionTimeout(): Promise<void> {
    try {
      await this.endSession('ABANDONED', 'Session timed out due to inactivity');
      
      // Dispatch timeout event
      window.dispatchEvent(new CustomEvent('session:timeout', {
        detail: { sessionId: this.context.currentSession?.id }
      }));
    } catch (error) {
      console.error('Failed to handle session timeout:', error);
    }
  }

  /**
   * Get appropriate end session message
   */
  private getEndSessionMessage(status: 'COMPLETED' | 'ABANDONED' | 'CANCELLED'): string {
    const customerName = this.context.currentSession?.customerName || 'Guest';
    
    switch (status) {
      case 'COMPLETED':
        return `Thank you for dining with us${customerName !== 'Guest' ? `, ${customerName}` : ''}! We hope you enjoyed your experience.`;
      case 'ABANDONED':
        return `Session ended. We hope to see you again soon${customerName !== 'Guest' ? `, ${customerName}` : ''}!`;
      case 'CANCELLED':
        return `Session cancelled. If you need any assistance, please don't hesitate to ask.`;
      default:
        return 'Session has been ended.';
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): any {
    if (!this.context.currentSession) {
      return null;
    }

    const startTime = new Date(this.context.currentSession.startTime);
    const now = new Date();
    const duration = now.getTime() - startTime.getTime();

    return {
      duration,
      durationFormatted: this.formatDuration(duration),
      customerName: this.context.currentSession.customerName,
      hasName: !!this.context.currentSession.customerName,
      status: this.context.currentSession.status,
    };
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Cleanup when component unmounts
   */
  cleanup(): void {
    this.clearTimers();
  }
}

// Utility functions for session management

/**
 * Create a session manager instance
 */
export function createSessionManager(
  restaurantId: string, 
  tableNumber: string, 
  config?: Partial<SessionConfig>
): SessionManager {
  return new SessionManager(
    { restaurantId, tableNumber },
    config
  );
}

/**
 * Check if session should be auto-created
 */
export function shouldAutoCreateSession(
  userMessage: string,
  hasExistingSession: boolean,
  config: SessionConfig
): boolean {
  return !hasExistingSession && 
         config.autoCreateOnFirstMessage && 
         userMessage.trim().length > 0;
}

/**
 * Determine session end reason based on context
 */
export function determineSessionEndReason(
  orders: any[],
  sessionDuration: number,
  userRequested: boolean
): 'COMPLETED' | 'ABANDONED' | 'CANCELLED' {
  if (userRequested) {
    const hasCompletedOrders = orders.some(order => order.status === 'SERVED');
    return hasCompletedOrders ? 'COMPLETED' : 'CANCELLED';
  }

  // Auto-determined reasons
  const allOrdersServed = orders.length > 0 && orders.every(order => 
    order.status === 'SERVED' || order.status === 'CANCELLED'
  );

  if (allOrdersServed) {
    return 'COMPLETED';
  }

  // If session is very long without completion, consider it abandoned
  const twoHours = 2 * 60 * 60 * 1000;
  if (sessionDuration > twoHours) {
    return 'ABANDONED';
  }

  return 'CANCELLED';
}

export default SessionManager; 