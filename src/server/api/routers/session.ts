import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

// Types for session management
const SessionStatus = z.enum(["ACTIVE", "COMPLETED", "ABANDONED", "CANCELLED"]);

export const sessionRouter = createTRPCRouter({
  /**
   * Create a new customer session
   */
  create: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
      tableNumber: z.string(),
      customerName: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if there's already an active session for this table
        const existingSession = await ctx.db.customerSession.findFirst({
          where: {
            restaurantId: input.restaurantId,
            tableNumber: input.tableNumber,
            status: "ACTIVE",
          },
        });

        if (existingSession) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "There is already an active session for this table. Please end the existing session first.",
          });
        }

        // Create new session
        const session = await ctx.db.customerSession.create({
          data: {
            restaurantId: input.restaurantId,
            tableNumber: input.tableNumber,
            customerName: input.customerName,
            notes: input.notes,
            status: "ACTIVE",
          },
          include: {
            restaurant: {
              select: {
                name: true,
                waiterName: true,
              },
            },
          },
        });

        return {
          success: true,
          session,
          message: `Welcome${input.customerName ? ` ${input.customerName}` : ''}! Your session has been started for table ${input.tableNumber}.`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create customer session",
        });
      }
    }),

  /**
   * Get current active session for a table
   */
  getCurrent: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
      tableNumber: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.customerSession.findFirst({
        where: {
          restaurantId: input.restaurantId,
          tableNumber: input.tableNumber,
          status: "ACTIVE",
        },
        include: {
          orders: {
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
          },
          restaurant: {
            select: {
              name: true,
              waiterName: true,
            },
          },
        },
      });

      if (!session) {
        return null;
      }

      // Calculate session statistics
      const sessionDuration = Date.now() - session.startTime.getTime();
      const totalOrders = session.orders.length;
      const totalSpent = session.orders.reduce((sum, order) => sum + Number(order.total), 0);

      return {
        ...session,
        statistics: {
          duration: sessionDuration,
          totalOrders,
          totalSpent,
          averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
        },
      };
    }),

  /**
   * Update customer information in session
   */
  updateCustomer: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      customerName: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const session = await ctx.db.customerSession.update({
          where: { id: input.sessionId },
          data: {
            customerName: input.customerName,
            notes: input.notes,
          },
          include: {
            restaurant: {
              select: {
                name: true,
                waiterName: true,
              },
            },
          },
        });

        return {
          success: true,
          session,
          message: `Thank you ${input.customerName}! Your information has been updated.`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update customer information",
        });
      }
    }),

  /**
   * End a customer session
   */
  end: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      status: SessionStatus.default("COMPLETED"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get session with orders to calculate final statistics
        const currentSession = await ctx.db.customerSession.findUnique({
          where: { id: input.sessionId },
          include: {
            orders: true,
          },
        });

        if (!currentSession) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        if (currentSession.status !== "ACTIVE") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Session is not active",
          });
        }

        // Calculate final statistics
        const totalOrders = currentSession.orders.length;
        const totalSpent = currentSession.orders.reduce((sum, order) => sum + Number(order.total), 0);

        // Update session
        const session = await ctx.db.customerSession.update({
          where: { id: input.sessionId },
          data: {
            status: input.status,
            endTime: new Date(),
            totalOrders,
            totalSpent,
            notes: input.notes ? 
              (currentSession.notes ? `${currentSession.notes}\n${input.notes}` : input.notes) : 
              currentSession.notes,
          },
          include: {
            orders: {
              include: {
                items: {
                  include: {
                    menuItem: true,
                  },
                },
              },
            },
            restaurant: {
              select: {
                name: true,
                waiterName: true,
              },
            },
          },
        });

        const sessionDuration = session.endTime!.getTime() - session.startTime.getTime();
        const statusMessages = {
          COMPLETED: "Thank you for dining with us! Your session has been completed successfully.",
          ABANDONED: "Session has been marked as abandoned.",
          CANCELLED: "Session has been cancelled.",
        };

        return {
          success: true,
          session,
          statistics: {
            duration: sessionDuration,
            totalOrders,
            totalSpent,
            averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
          },
          message: statusMessages[input.status] || "Session has been ended.",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to end session",
        });
      }
    }),

  /**
   * Get session history for a restaurant
   */
  getHistory: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      status: SessionStatus.optional(),
      tableNumber: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db.customerSession.findMany({
        where: {
          restaurantId: input.restaurantId,
          ...(input.status && { status: input.status }),
          ...(input.tableNumber && { tableNumber: input.tableNumber }),
        },
        include: {
          orders: {
            include: {
              items: {
                include: {
                  menuItem: true,
                },
              },
            },
          },
        },
        orderBy: {
          startTime: "desc",
        },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.customerSession.count({
        where: {
          restaurantId: input.restaurantId,
          ...(input.status && { status: input.status }),
          ...(input.tableNumber && { tableNumber: input.tableNumber }),
        },
      });

      return {
        sessions: sessions.map(session => ({
          ...session,
          statistics: {
            duration: session.endTime ? 
              session.endTime.getTime() - session.startTime.getTime() : 
              Date.now() - session.startTime.getTime(),
            totalOrders: session.orders.length,
            totalSpent: Number(session.totalSpent),
            averageOrderValue: session.orders.length > 0 ? 
              Number(session.totalSpent) / session.orders.length : 0,
          },
        })),
        pagination: {
          total,
          limit: input.limit,
          offset: input.offset,
          hasMore: input.offset + input.limit < total,
        },
      };
    }),

  /**
   * Get session statistics for analytics
   */
  getAnalytics: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const whereClause = {
        restaurantId: input.restaurantId,
        ...(input.startDate && { startTime: { gte: input.startDate } }),
        ...(input.endDate && { startTime: { lte: input.endDate } }),
      };

      const [totalSessions, activeSessions, completedSessions, avgSessionTime, totalRevenue] = await Promise.all([
        // Total sessions
        ctx.db.customerSession.count({ where: whereClause }),
        
        // Active sessions
        ctx.db.customerSession.count({ 
          where: { ...whereClause, status: "ACTIVE" } 
        }),
        
        // Completed sessions
        ctx.db.customerSession.count({ 
          where: { ...whereClause, status: "COMPLETED" } 
        }),
        
        // Average session time (for completed sessions)
        ctx.db.customerSession.findMany({
          where: { ...whereClause, status: "COMPLETED", endTime: { not: null } },
          select: {
            startTime: true,
            endTime: true,
          },
        }).then(sessions => {
          if (sessions.length === 0) return 0;
          const totalTime = sessions.reduce((sum, session) => {
            return sum + (session.endTime!.getTime() - session.startTime.getTime());
          }, 0);
          return totalTime / sessions.length;
        }),
        
        // Total revenue
        ctx.db.customerSession.aggregate({
          where: whereClause,
          _sum: {
            totalSpent: true,
          },
        }).then(result => Number(result._sum.totalSpent) || 0),
      ]);

      return {
        totalSessions,
        activeSessions,
        completedSessions,
        abandonedSessions: totalSessions - completedSessions - activeSessions,
        averageSessionDuration: avgSessionTime,
        totalRevenue,
        averageRevenuePerSession: totalSessions > 0 ? totalRevenue / totalSessions : 0,
        completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      };
    }),
}); 