// Global type definitions for the restaurant menu application
// export * from './api';
// export * from './database';
// export * from './ui';

// Common types used throughout the application
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Feature-specific type exports - commented out until modules exist
// export type { AuthUser } from '../features/authentication/types';
// export type { MenuItem, MenuCategory } from '../features/menu-management/types';
// export type { Order, OrderItem } from '../features/order-processing/types';
// export type { ChatMessage, ChatSession } from '../features/chat-system/types';
// export type { AdminUser, AdminRole } from '../features/admin-dashboard/types'; 