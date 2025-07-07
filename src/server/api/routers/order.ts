import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getAdminSessionFromCookies } from "@/utils/auth";
import { TRPCError } from "@trpc/server";
import { OrderStatus } from "@prisma/client";
import { validateStatusTransition, ORDER_STATUS_LABELS } from "@/utils/orderValidation";

// Zod schemas for validation
const orderItemSchema = z.object({
  menuItemId: z.string().cuid(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(50, "Quantity too high"),
  notes: z.string().optional(),
});

const createOrderSchema = z.object({
  tableNumber: z.number().int().min(1, "Table number must be at least 1").max(999, "Table number too high"),
  customerName: z.string().min(1, "Customer name is required").max(100, "Customer name too long").optional(),
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
  notes: z.string().max(500, "Notes too long").optional(),
});

const updateOrderStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.nativeEnum(OrderStatus),
});

const getOrdersSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Helper function to update session statistics
const updateSessionStatistics = async (sessionId: string, ctx: any) => {
  try {
    // Get all orders for this session (excluding cancelled)
    const sessionOrders = await ctx.db.order.findMany({
      where: {
        sessionId: sessionId,
        status: { not: OrderStatus.CANCELLED },
      },
    });

    const totalOrders = sessionOrders.length;
    const totalSpent = sessionOrders.reduce((sum, order) => sum + Number(order.total), 0);

    // Update session with current statistics
    await ctx.db.customerSession.update({
      where: { id: sessionId },
      data: {
        totalOrders,
        totalSpent,
      },
    });

    console.log(`📊 Updated session ${sessionId} statistics: ${totalOrders} orders, $${totalSpent.toFixed(2)} total`);
  } catch (error) {
    console.error("❌ Failed to update session statistics:", error);
  }
};

// Helper function to get admin session from context
const getAdminFromContext = (ctx: { req: { headers: { cookie?: string } } }) => {
  const cookies = ctx.req.headers.cookie || "";
  const adminSession = getAdminSessionFromCookies(cookies);
  
  if (!adminSession) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Admin authentication required",
    });
  }
  
  return adminSession;
};

// Helper function to get restaurant from subdomain (for customer orders)
const getRestaurantFromSubdomain = async (
  ctx: { req: { headers: { host?: string } } },
  db: any
) => {
  const host = ctx.req.headers.host;
  if (!host) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Host header is required",
    });
  }

  // Extract subdomain (e.g., pizza-palace.localhost:3000 -> pizza-palace)
  const subdomain = host.split('.')[0];
  if (!subdomain || subdomain === 'localhost' || subdomain.includes(':')) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid subdomain",
    });
  }

  const restaurant = await db.restaurant.findUnique({
    where: { subdomain },
  });

  if (!restaurant) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Restaurant not found",
    });
  }

  return restaurant;
};

export const orderRouter = createTRPCRouter({
  // Create a new order (for customers)
  create: publicProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      // Get restaurant from subdomain for customer orders
      const restaurant = await getRestaurantFromSubdomain(ctx, ctx.db);

      // Validate all menu items exist and are available
      const menuItems = await ctx.db.menuItem.findMany({
        where: {
          id: { in: input.items.map(item => item.menuItemId) },
          restaurantId: restaurant.id,
          available: true,
        },
      });

      if (menuItems.length !== input.items.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more menu items are not available",
        });
      }

      // Calculate total
      let total = 0;
      const orderItemsData = input.items.map(inputItem => {
        const menuItem = menuItems.find(mi => mi.id === inputItem.menuItemId);
        if (!menuItem) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Menu item not found",
          });
        }
        const itemTotal = Number(menuItem.price) * inputItem.quantity;
        total += itemTotal;
        
        return {
          menuItemId: inputItem.menuItemId,
          quantity: inputItem.quantity,
          priceAtTime: menuItem.price,
          notes: inputItem.notes,
        };
      });

      // Get or create current session for this table
      let currentSession = await ctx.db.customerSession.findFirst({
        where: {
          restaurantId: restaurant.id,
          tableNumber: input.tableNumber.toString(),
          status: "ACTIVE",
        },
      });

      // If no active session exists, create one
      if (!currentSession) {
        console.log(`📝 Creating new session for table ${input.tableNumber}`);
        currentSession = await ctx.db.customerSession.create({
          data: {
            restaurantId: restaurant.id,
            tableNumber: input.tableNumber.toString(),
            customerName: input.customerName,
            status: "ACTIVE",
            startTime: new Date(),
          },
        });
      } else if (input.customerName && !currentSession.customerName) {
        // Update session with customer name if provided
        currentSession = await ctx.db.customerSession.update({
          where: { id: currentSession.id },
          data: { customerName: input.customerName },
        });
      }

      // Create the order with items and link to session
      const order = await ctx.db.order.create({
        data: {
          restaurantId: restaurant.id,
          sessionId: currentSession.id, // Link to session
          tableNumber: `Table ${input.tableNumber}`,
          customerName: input.customerName || currentSession.customerName,
          total,
          status: OrderStatus.PENDING,
          notes: input.notes,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      // Update session statistics
      await updateSessionStatistics(currentSession.id, ctx);

      return {
        ...order,
        total: Number(order.total),
        items: order.items.map(item => ({
          ...item,
          priceAtTime: Number(item.priceAtTime),
          menuItem: {
            ...item.menuItem,
            price: Number(item.menuItem.price),
          },
        })),
      };
    }),

  // Get recent orders for admin dashboard
  getRecent: publicProcedure
    .input(getOrdersSchema)
    .query(async ({ ctx, input }) => {
      const admin = getAdminFromContext(ctx);

      const where = {
        restaurantId: admin.restaurantId,
        ...(input.status && { status: input.status }),
      };

      const [orders, totalCount] = await Promise.all([
        ctx.db.order.findMany({
          where,
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.order.count({ where }),
      ]);

      return {
        orders: orders.map(order => ({
          ...order,
          total: Number(order.total),
          items: order.items.map(item => ({
            ...item,
            priceAtTime: Number(item.priceAtTime),
            menuItem: {
              ...item.menuItem,
              price: Number(item.menuItem.price),
            },
          })),
        })),
        totalCount,
        hasMore: input.offset + input.limit < totalCount,
      };
    }),

  // Get orders for kitchen dashboard (active orders only)
  getForKitchen: publicProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const admin = getAdminFromContext(ctx);
      const { limit = 50, offset = 0 } = input || {};

      const where = {
        restaurantId: admin.restaurantId,
        status: {
          in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY],
        },
      };

      const [orders, totalCount] = await Promise.all([
        ctx.db.order.findMany({
          where,
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
          orderBy: [
            { status: "asc" }, // PENDING first, then PREPARING, then READY
            { createdAt: "asc" }, // Oldest first within each status
          ],
          take: limit,
          skip: offset,
        }),
        ctx.db.order.count({ where }),
      ]);

      return {
        orders: orders.map(order => ({
          ...order,
          total: Number(order.total),
          items: order.items.map(item => ({
            ...item,
            priceAtTime: Number(item.priceAtTime),
            menuItem: {
              ...item.menuItem,
              price: Number(item.menuItem.price),
            },
          })),
        })),
        totalCount,
        hasMore: offset + limit < totalCount,
      };
    }),

  // Update order status (for kitchen)
  updateStatus: publicProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const admin = getAdminFromContext(ctx);

      // Verify the order belongs to the admin's restaurant
      const existingOrder = await ctx.db.order.findUnique({
        where: { id: input.id },
      });

      if (!existingOrder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      if (existingOrder.restaurantId !== admin.restaurantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update orders for your restaurant",
        });
      }

      // Validate status transition using centralized logic
      const transitionValidation = validateStatusTransition(
        existingOrder.status, 
        input.status
      );

      if (!transitionValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid status transition: ${transitionValidation.reason}. Current: ${ORDER_STATUS_LABELS[existingOrder.status]}, Requested: ${ORDER_STATUS_LABELS[input.status]}`,
        });
      }

      // Update the order
      const updatedOrder = await ctx.db.order.update({
        where: { id: input.id },
        data: { 
          status: input.status,
          ...(input.status === OrderStatus.SERVED && { servedAt: new Date() }),
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      // Update session statistics if order is linked to a session
      if (existingOrder.sessionId) {
        await updateSessionStatistics(existingOrder.sessionId, ctx);
      }

      return {
        ...updatedOrder,
        total: Number(updatedOrder.total),
        items: updatedOrder.items.map(item => ({
          ...item,
          priceAtTime: Number(item.priceAtTime),
          menuItem: {
            ...item.menuItem,
            price: Number(item.menuItem.price),
          },
        })),
      };
    }),

  // Get order by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const admin = getAdminFromContext(ctx);

      const order = await ctx.db.order.findUnique({
        where: { id: input.id },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      if (order.restaurantId !== admin.restaurantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view orders for your restaurant",
        });
      }

      return {
        ...order,
        total: Number(order.total),
        items: order.items.map(item => ({
          ...item,
          priceAtTime: Number(item.priceAtTime),
          menuItem: {
            ...item.menuItem,
            price: Number(item.menuItem.price),
          },
        })),
      };
    }),

  // Get order statistics for dashboard
  getStats: publicProcedure
    .query(async ({ ctx }) => {
      const admin = getAdminFromContext(ctx);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalOrdersToday,
        pendingOrders,
        preparingOrders,
        readyOrders,
        totalRevenueToday,
      ] = await Promise.all([
        ctx.db.order.count({
          where: {
            restaurantId: admin.restaurantId,
            createdAt: { gte: today },
          },
        }),
        ctx.db.order.count({
          where: {
            restaurantId: admin.restaurantId,
            status: OrderStatus.PENDING,
          },
        }),
        ctx.db.order.count({
          where: {
            restaurantId: admin.restaurantId,
            status: OrderStatus.PREPARING,
          },
        }),
        ctx.db.order.count({
          where: {
            restaurantId: admin.restaurantId,
            status: OrderStatus.READY,
          },
        }),
        ctx.db.order.aggregate({
          where: {
            restaurantId: admin.restaurantId,
            createdAt: { gte: today },
            status: { not: OrderStatus.CANCELLED },
          },
          _sum: { total: true },
        }),
      ]);

      return {
        totalOrdersToday,
        pendingOrders,
        preparingOrders,
        readyOrders,
        totalRevenueToday: Number(totalRevenueToday._sum.total || 0),
      };
    }),
}); 