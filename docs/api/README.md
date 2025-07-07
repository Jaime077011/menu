# 🔗 API Documentation

## 📋 Overview

This section contains comprehensive documentation about the tRPC API endpoints, authentication methods, and integration guides for the AI-Powered Restaurant Ordering System.

## 🏗️ API Architecture

### Core Technology
- **tRPC** - Type-safe API with automatic TypeScript inference
- **Zod** - Runtime type validation and schema definition
- **Next.js API Routes** - Server-side API endpoint handling
- **Prisma** - Database ORM with type safety
- **Custom JWT Authentication** - Multi-layered security

### Base URL Structure
```
https://your-domain.com/api/trpc/[procedure]
```

## 🔐 Authentication

### Authentication Layers

#### 1. Customer Sessions (Anonymous)
- **Purpose**: Table-based ordering without registration
- **Method**: Session-based with table number
- **Usage**: Customer chat interface

#### 2. Restaurant Admins
- **Purpose**: Restaurant management access
- **Method**: JWT tokens with email/password
- **Usage**: Admin dashboard, menu management

#### 3. Super Admins
- **Purpose**: Platform-wide management
- **Method**: JWT tokens with elevated permissions
- **Usage**: Super admin dashboard, system management

### Authentication Headers
```typescript
// For restaurant admin endpoints
Authorization: Bearer <jwt_token>

// For customer sessions
Cookie: session-token=<session_token>
```

## 📚 API Endpoints

### 🏪 Restaurant Router (`restaurant`)

#### `restaurant.getAll`
- **Description**: Get all restaurants (debugging)
- **Method**: Query
- **Auth**: Public
- **Response**: `{ id, name, subdomain }[]`

#### `restaurant.getWaiterTemplates`
- **Description**: Get available waiter personality templates
- **Method**: Query
- **Auth**: Public
- **Input**: `{ restaurantId: string }`
- **Response**: `WaiterPersonalityTemplate[]`

### 🍽️ Menu Router (`menu`)

#### `menu.getAll`
- **Description**: Get all menu items for restaurant
- **Method**: Query
- **Auth**: Restaurant Admin
- **Response**: `MenuItem[]`

#### `menu.create`
- **Description**: Create new menu item
- **Method**: Mutation
- **Auth**: Restaurant Admin
- **Input**: `MenuItemCreateInput`
- **Response**: `MenuItem`

#### `menu.update`
- **Description**: Update existing menu item
- **Method**: Mutation
- **Auth**: Restaurant Admin
- **Input**: `{ id: string, data: MenuItemUpdateInput }`
- **Response**: `MenuItem`

#### `menu.delete`
- **Description**: Delete menu item
- **Method**: Mutation
- **Auth**: Restaurant Admin
- **Input**: `{ id: string }`
- **Response**: `{ success: boolean }`

#### `menu.getByRestaurant`
- **Description**: Get menu items for specific restaurant
- **Method**: Query
- **Auth**: Public
- **Input**: `{ restaurantId: string }`
- **Response**: `MenuItem[]`

### 📦 Order Router (`order`)

#### `order.create`
- **Description**: Create new order
- **Method**: Mutation
- **Auth**: Customer Session
- **Input**: `OrderCreateInput`
- **Response**: `Order`

#### `order.getRecent`
- **Description**: Get recent orders for restaurant
- **Method**: Query
- **Auth**: Restaurant Admin
- **Response**: `Order[]`

#### `order.getForKitchen`
- **Description**: Get active orders for kitchen display
- **Method**: Query
- **Auth**: Restaurant Admin
- **Response**: `Order[]`

#### `order.updateStatus`
- **Description**: Update order status
- **Method**: Mutation
- **Auth**: Restaurant Admin
- **Input**: `{ id: string, status: OrderStatus }`
- **Response**: `Order`

#### `order.getStats`
- **Description**: Get order statistics
- **Method**: Query
- **Auth**: Restaurant Admin
- **Response**: `OrderStats`

#### `order.getById`
- **Description**: Get specific order details
- **Method**: Query
- **Auth**: Restaurant Admin
- **Input**: `{ id: string }`
- **Response**: `Order`

### 💬 Chat Router (`chat`)

#### `chat.sendMessage`
- **Description**: Process chat message with AI
- **Method**: Mutation
- **Auth**: Customer Session
- **Input**: `ChatMessageInput`
- **Response**: `ChatResponse`

#### `chat.getHistory`
- **Description**: Get conversation history
- **Method**: Query
- **Auth**: Customer Session
- **Input**: `{ sessionId: string }`
- **Response**: `ChatMessage[]`

### 🎫 Session Router (`session`)

#### `session.create`
- **Description**: Create customer session
- **Method**: Mutation
- **Auth**: Public
- **Input**: `SessionCreateInput`
- **Response**: `CustomerSession`

#### `session.get`
- **Description**: Get current session
- **Method**: Query
- **Auth**: Customer Session
- **Response**: `CustomerSession`

#### `session.update`
- **Description**: Update session information
- **Method**: Mutation
- **Auth**: Customer Session
- **Input**: `SessionUpdateInput`
- **Response**: `CustomerSession`

### 💳 Subscription Router (`subscription`)

#### `subscription.getCurrent`
- **Description**: Get current subscription details
- **Method**: Query
- **Auth**: Restaurant Admin
- **Response**: `RestaurantSubscription`

#### `subscription.getPlans`
- **Description**: Get available subscription plans
- **Method**: Query
- **Auth**: Public
- **Response**: `SubscriptionPlan[]`

#### `subscription.createCheckout`
- **Description**: Create Stripe checkout session
- **Method**: Mutation
- **Auth**: Restaurant Admin
- **Input**: `CheckoutCreateInput`
- **Response**: `{ checkoutUrl: string }`

#### `subscription.cancelSubscription`
- **Description**: Cancel active subscription
- **Method**: Mutation
- **Auth**: Restaurant Admin
- **Response**: `{ success: boolean }`

### 👑 Super Admin Router (`superAdmin`)

#### `superAdmin.getRestaurants`
- **Description**: Get all restaurants
- **Method**: Query
- **Auth**: Super Admin
- **Response**: `Restaurant[]`

#### `superAdmin.getSubscriptions`
- **Description**: Get all subscriptions
- **Method**: Query
- **Auth**: Super Admin
- **Response**: `RestaurantSubscription[]`

#### `superAdmin.getAnalytics`
- **Description**: Get platform analytics
- **Method**: Query
- **Auth**: Super Admin
- **Response**: `PlatformAnalytics`

#### `superAdmin.manageSubscription`
- **Description**: Manage restaurant subscription
- **Method**: Mutation
- **Auth**: Super Admin
- **Input**: `SubscriptionManageInput`
- **Response**: `RestaurantSubscription`

### 🔍 QR Router (`qr`)

#### `qr.generate`
- **Description**: Generate QR code for table
- **Method**: Mutation
- **Auth**: Restaurant Admin
- **Input**: `{ tableNumber: number }`
- **Response**: `{ qrCode: string, url: string }`

### 📊 AI Analytics Router (`aiAnalytics`)

#### `aiAnalytics.getPerformance`
- **Description**: Get AI performance metrics
- **Method**: Query
- **Auth**: Restaurant Admin
- **Response**: `AIPerformanceMetrics`

#### `aiAnalytics.getConversations`
- **Description**: Get conversation analytics
- **Method**: Query
- **Auth**: Restaurant Admin
- **Response**: `ConversationAnalytics`

## 🔧 Data Types

### Core Types

#### Restaurant
```typescript
interface Restaurant {
  id: string;
  name: string;
  subdomain: string;
  waiterName?: string;
  waiterPersonality?: string;
  welcomeMessage?: string;
  subscriptionStatus: SubscriptionStatus;
  createdAt: Date;
}
```

#### MenuItem
```typescript
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  imageUrl?: string;
  dietaryTags: DietaryTag[];
  restaurantId: string;
}
```

#### Order
```typescript
interface Order {
  id: string;
  restaurantId: string;
  sessionId: string;
  tableNumber: number;
  customerName?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### CustomerSession
```typescript
interface CustomerSession {
  id: string;
  restaurantId: string;
  tableNumber: number;
  startTime: Date;
  endTime?: Date;
  status: SessionStatus;
  conversationHistory: ChatMessage[];
  orders: Order[];
}
```

### Input Types

#### MenuItemCreateInput
```typescript
interface MenuItemCreateInput {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  dietaryTagIds?: string[];
}
```

#### OrderCreateInput
```typescript
interface OrderCreateInput {
  sessionId: string;
  tableNumber: number;
  customerName?: string;
  items: OrderItemInput[];
  notes?: string;
}
```

#### ChatMessageInput
```typescript
interface ChatMessageInput {
  sessionId: string;
  message: string;
  tableNumber: number;
  restaurantId: string;
}
```

## 🚨 Error Handling

### Error Types
- **UNAUTHORIZED**: Authentication required
- **FORBIDDEN**: Insufficient permissions
- **NOT_FOUND**: Resource not found
- **BAD_REQUEST**: Invalid input data
- **INTERNAL_SERVER_ERROR**: Server error

### Error Response Format
```typescript
interface APIError {
  code: string;
  message: string;
  details?: any;
}
```

## 📈 Rate Limiting

### Limits by Plan
- **Trial**: 100 requests/hour
- **Starter**: 1,000 requests/hour
- **Professional**: 10,000 requests/hour
- **Enterprise**: 100,000 requests/hour

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

## 🔍 Query Examples

### Creating a Menu Item
```typescript
const menuItem = await trpc.menu.create.mutate({
  name: "Margherita Pizza",
  description: "Fresh tomatoes, mozzarella, basil",
  price: 12.99,
  category: "Pizza",
  dietaryTagIds: ["vegetarian"]
});
```

### Processing a Chat Message
```typescript
const response = await trpc.chat.sendMessage.mutate({
  sessionId: "session_123",
  message: "I'd like to order a pizza",
  tableNumber: 5,
  restaurantId: "restaurant_456"
});
```

### Getting Order Statistics
```typescript
const stats = await trpc.order.getStats.query();
// Returns: { totalOrders, totalRevenue, averageOrderValue, ... }
```

## 🛠️ SDK & Integration

### TypeScript Client
```typescript
import { createTRPCNext } from '@trpc/next';
import type { AppRouter } from '../server/api/root';

const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      url: '/api/trpc',
      transformer: superjson,
    };
  },
});
```

### React Hooks
```typescript
// Query hook
const { data, isLoading, error } = trpc.menu.getAll.useQuery();

// Mutation hook
const createOrder = trpc.order.create.useMutation();

// Usage
await createOrder.mutateAsync(orderData);
```

## 📋 Best Practices

### API Usage
- **Type Safety**: Use TypeScript for full type safety
- **Error Handling**: Always handle potential errors
- **Loading States**: Show loading indicators for async operations
- **Caching**: Utilize tRPC's built-in caching
- **Optimistic Updates**: Use optimistic updates for better UX

### Performance
- **Batch Requests**: Group related queries when possible
- **Pagination**: Use pagination for large data sets
- **Selective Fetching**: Only fetch required fields
- **Caching Strategy**: Implement appropriate caching

### Security
- **Input Validation**: Validate all inputs with Zod schemas
- **Authentication**: Always verify authentication where required
- **Authorization**: Check permissions before operations
- **Rate Limiting**: Respect rate limits to avoid blocking

---

**Last Updated**: January 2025  
**Maintained by**: API Team 