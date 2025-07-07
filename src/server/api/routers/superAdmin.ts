import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getSuperAdminFromContext, isSetupRequired, requirePermission, requireManageAdmins, requireManageTemplates, requireManageSettings, requireManageKnowledge, requireViewAnalytics, requireManageRestaurants, requireViewBilling, requireManagePlans } from "@/utils/superAdminAuth";
import { SuperAdminRole } from "@/utils/roles";

// Schema for super admin login
const superAdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Schema for super admin creation
const createSuperAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

// Schema for waiter template management
const waiterTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  tone: z.enum(["FORMAL", "BALANCED", "CASUAL"]),
  responseStyle: z.enum(["HELPFUL", "CONCISE", "DETAILED", "PLAYFUL"]),
  defaultWelcomeMessage: z.string().optional(),
  minimumPlan: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]).nullable().optional(),
  isPremium: z.boolean().optional(),
});

export const superAdminRouter = createTRPCRouter({
  // Check if setup is required
  isSetupRequired: publicProcedure.query(async () => {
    return await isSetupRequired();
  }),

  // Create additional super admin (authenticated)
  createSuperAdmin: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
      name: z.string().optional(),
      role: z.enum([SuperAdminRole.SUPER_ADMIN, SuperAdminRole.SUPPORT_ADMIN]).default(SuperAdminRole.SUPPORT_ADMIN),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and canManageAdmins permission
      const session = await requireManageAdmins(ctx);
      
      const { email, password, name, role } = input;

      // Check if email already exists
      const existingAdmin = await ctx.db.superAdmin.findUnique({
        where: { email },
      });

      if (existingAdmin) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Super admin with this email already exists",
        });
      }

      // Hash password
      const { hash } = await import("bcryptjs");
      const passwordHash = await hash(password, 12);

      // Create super admin
      const newSuperAdmin = await ctx.db.superAdmin.create({
        data: {
          email,
          passwordHash,
          name,
          role,
        },
      });

      // Log the creation activity
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "CREATE_SUPER_ADMIN", {
        createdAdminId: newSuperAdmin.id,
        createdAdminEmail: email,
        createdAdminName: name,
        createdAdminRole: role,
      });

      return {
        id: newSuperAdmin.id,
        email: newSuperAdmin.email,
        name: newSuperAdmin.name,
        role: newSuperAdmin.role,
        createdAt: newSuperAdmin.createdAt,
      };
    }),

  // Get all super admins (authenticated)
  getAllSuperAdmins: publicProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      // Require super admin authentication and canManageAdmins permission
      await requireManageAdmins(ctx);
      
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [superAdmins, total] = await Promise.all([
        ctx.db.superAdmin.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true,
            _count: {
              select: {
                sessions: {
                  where: { isActive: true }
                },
                auditLogs: true,
              },
            },
          },
        }),
        ctx.db.superAdmin.count(),
      ]);

      return {
        superAdmins,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }),

  // Toggle super admin active status
  toggleSuperAdminStatus: publicProcedure
    .input(z.object({
      superAdminId: z.string(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and admin management permission
      const session = await requireManageAdmins(ctx);
      
      const { superAdminId, isActive } = input;

      // Prevent self-deactivation
      if (superAdminId === session.id && !isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot deactivate your own account",
        });
      }

      // Update super admin status
      const updatedAdmin = await ctx.db.superAdmin.update({
        where: { id: superAdminId },
        data: { isActive },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
        },
      });

      // If deactivating, revoke all sessions
      if (!isActive) {
        const { revokeAllSuperAdminSessions } = await import("@/utils/superAdminAuth");
        await revokeAllSuperAdminSessions(superAdminId);
      }

      // Log the action
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, isActive ? "ACTIVATE_SUPER_ADMIN" : "DEACTIVATE_SUPER_ADMIN", {
        targetAdminId: superAdminId,
        targetAdminEmail: updatedAdmin.email,
        newStatus: isActive,
      });

      return updatedAdmin;
    }),

  // Get super admin activity logs
  getAuditLogs: publicProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      superAdminId: z.string().optional(),
      action: z.string().optional(),
      days: z.number().min(1).max(365).default(30),
    }))
    .query(async ({ ctx, input }) => {
      // Require super admin authentication and admin management permission
      await requireManageAdmins(ctx);
      
      const { page, limit, superAdminId, action, days } = input;
      const skip = (page - 1) * limit;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const where: any = {
        createdAt: { gte: startDate },
      };

      if (superAdminId) {
        where.superAdminId = superAdminId;
      }

      if (action) {
        where.action = action;
      }

      const [auditLogs, total] = await Promise.all([
        ctx.db.superAdminAuditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            superAdmin: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        }),
        ctx.db.superAdminAuditLog.count({ where }),
      ]);

      return {
        auditLogs: auditLogs.map(log => ({
          ...log,
          details: log.details ? JSON.parse(log.details) : null,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }),

  // Dashboard data - get overview stats
  getDashboardStats: publicProcedure
    .input(z.object({
      ordersPage: z.number().min(1).default(1),
      ordersLimit: z.number().min(1).max(50).default(10),
      restaurantsPage: z.number().min(1).default(1),
      restaurantsLimit: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ ctx, input }) => {
      // Require super admin authentication and analytics view permission
      await requireViewAnalytics(ctx);
      
      const { ordersPage, ordersLimit, restaurantsPage, restaurantsLimit } = input;
      const ordersSkip = (ordersPage - 1) * ordersLimit;
      const restaurantsSkip = (restaurantsPage - 1) * restaurantsLimit;
      
      const [
        totalRestaurants,
        totalAdmins,
        totalMenuItems,
        totalOrders,
        recentOrders,
        totalRecentOrders,
        topRestaurants,
        totalActiveRestaurants
      ] = await Promise.all([
        // Total restaurants
        ctx.db.restaurant.count(),
        
        // Total restaurant admins
        ctx.db.adminUser.count(),
        
        // Total menu items
        ctx.db.menuItem.count(),
        
        // Total orders
        ctx.db.order.count(),
        
        // Recent orders with pagination
        ctx.db.order.findMany({
          skip: ordersSkip,
          take: ordersLimit,
          orderBy: { createdAt: "desc" },
          include: {
            restaurant: {
              select: { name: true, subdomain: true }
            }
          }
        }),

        // Total count for recent orders pagination
        ctx.db.order.count(),
        
        // Top restaurants by order count with pagination
        ctx.db.restaurant.findMany({
          skip: restaurantsSkip,
          take: restaurantsLimit,
          include: {
            _count: {
              select: { orders: true }
            }
          },
          orderBy: {
            orders: {
              _count: "desc"
            }
          }
        }),

        // Total count for restaurants pagination
        ctx.db.restaurant.count()
      ]);

      return {
        stats: {
          totalRestaurants,
          totalAdmins,
          totalMenuItems,
          totalOrders,
        },
        recentOrders,
        ordersPagination: {
          page: ordersPage,
          limit: ordersLimit,
          total: totalRecentOrders,
          pages: Math.ceil(totalRecentOrders / ordersLimit),
        },
        topRestaurants,
        restaurantsPagination: {
          page: restaurantsPage,
          limit: restaurantsLimit,
          total: totalActiveRestaurants,
          pages: Math.ceil(totalActiveRestaurants / restaurantsLimit),
        },
      };
    }),

  // Get all restaurants with pagination
  getRestaurants: publicProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Require super admin authentication and restaurant management permission
      await requireManageRestaurants(ctx);
      
      const { page, limit, search } = input;
      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { subdomain: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [restaurants, total] = await Promise.all([
        ctx.db.restaurant.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: {
                menuItems: true,
                orders: true,
                adminUsers: true,
              },
            },
          },
        }),
        ctx.db.restaurant.count({ where }),
      ]);

      return {
        restaurants,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }),

  // Create new restaurant (authenticated)
  createRestaurant: publicProcedure
    .input(z.object({
      name: z.string().min(1, "Restaurant name is required").max(100),
      subdomain: z.string()
        .min(3, "Subdomain must be at least 3 characters")
        .max(50, "Subdomain must be less than 50 characters")
        .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
      adminEmail: z.string().email("Valid admin email is required"),
      adminPassword: z.string().min(8, "Admin password must be at least 8 characters"),
      adminName: z.string().optional(),
      // Waiter personality settings
      waiterName: z.string().optional(),
      waiterPersonality: z.enum(["FRIENDLY", "PROFESSIONAL", "CASUAL", "ENTHUSIASTIC"]).default("FRIENDLY"),
      welcomeMessage: z.string().optional(),
      conversationTone: z.enum(["FORMAL", "BALANCED", "CASUAL"]).default("BALANCED"),
      specialtyKnowledge: z.string().optional(),
      responseStyle: z.enum(["HELPFUL", "CONCISE", "DETAILED", "PLAYFUL"]).default("HELPFUL"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and restaurant management permission
      const session = await requireManageRestaurants(ctx);
      
      const { 
        name, 
        subdomain, 
        adminEmail, 
        adminPassword, 
        adminName,
        waiterName,
        waiterPersonality,
        welcomeMessage,
        conversationTone,
        specialtyKnowledge,
        responseStyle
      } = input;

      // Check if subdomain already exists
      const existingRestaurant = await ctx.db.restaurant.findUnique({
        where: { subdomain },
      });

      if (existingRestaurant) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A restaurant with this subdomain already exists",
        });
      }

      // Check if admin email already exists
      const existingAdmin = await ctx.db.adminUser.findUnique({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An admin with this email already exists",
        });
      }

      // Hash admin password
      const { hash } = await import("bcryptjs");
      const passwordHash = await hash(adminPassword, 12);

      // Create restaurant and admin in a transaction
      const result = await ctx.db.$transaction(async (tx) => {
        // Create restaurant
        const restaurant = await tx.restaurant.create({
          data: {
            name,
            subdomain,
            waiterName: waiterName || "Waiter",
            waiterPersonality,
            welcomeMessage,
            conversationTone,
            specialtyKnowledge,
            responseStyle,
          },
        });

        // Create admin user
        const admin = await tx.adminUser.create({
          data: {
            email: adminEmail,
            passwordHash,
            restaurantId: restaurant.id,
          },
        });

        return { restaurant, admin };
      });

      // Log the creation activity
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "CREATE_RESTAURANT", {
        restaurantId: result.restaurant.id,
        restaurantName: name,
        subdomain,
        adminEmail,
        adminName,
      });

      return {
        restaurant: {
          id: result.restaurant.id,
          name: result.restaurant.name,
          subdomain: result.restaurant.subdomain,
          createdAt: result.restaurant.createdAt,
        },
        admin: {
          id: result.admin.id,
          email: result.admin.email,
        },
      };
    }),

  // Delete restaurant (authenticated)
  deleteRestaurant: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and restaurant management permission
      const session = await requireManageRestaurants(ctx);
      
      const { restaurantId } = input;

      // Get restaurant details for logging
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: restaurantId },
        select: { name: true, subdomain: true },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      // Delete all related records manually since schema doesn't have cascade delete
      await ctx.db.$transaction(async (tx) => {
        // Delete order items first (they depend on orders)
        await tx.orderItem.deleteMany({
          where: {
            order: {
              restaurantId: restaurantId,
            },
          },
        });

        // Delete dietary tags (they depend on menu items)
        await tx.dietaryTag.deleteMany({
          where: {
            menuItem: {
              restaurantId: restaurantId,
            },
          },
        });

        // Delete orders
        await tx.order.deleteMany({
          where: { restaurantId: restaurantId },
        });

        // Delete customer sessions
        await tx.customerSession.deleteMany({
          where: { restaurantId: restaurantId },
        });

        // Delete menu items
        await tx.menuItem.deleteMany({
          where: { restaurantId: restaurantId },
        });

        // Delete admin users
        await tx.adminUser.deleteMany({
          where: { restaurantId: restaurantId },
        });

        // Update restaurant registration to remove reference
        await tx.restaurantRegistration.updateMany({
          where: { restaurantId: restaurantId },
          data: { restaurantId: null },
        });

        // Finally, delete the restaurant (cascade will handle RestaurantSubscription, UsageMetric, RestaurantFeature)
        await tx.restaurant.delete({
          where: { id: restaurantId },
        });
      });

      // Log the deletion activity
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "DELETE_RESTAURANT", {
        restaurantId,
        restaurantName: restaurant.name,
        subdomain: restaurant.subdomain,
      });

      return { success: true };
    }),

  // Analytics - Revenue tracking across all restaurants
  getRevenueAnalytics: publicProcedure
    .input(z.object({
      days: z.number().min(1).max(365).default(30),
    }))
    .query(async ({ ctx, input }) => {
      // Require super admin authentication and billing view permission
      await requireViewBilling(ctx);
      
      const { days } = input;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [
        totalRevenue,
        revenueByDay,
        revenueByRestaurant,
        orderStats
      ] = await Promise.all([
        // Total revenue in period
        ctx.db.order.aggregate({
          where: {
            createdAt: { gte: startDate },
            status: { not: "CANCELLED" }
          },
          _sum: { total: true },
          _count: true,
        }),

        // Revenue by day
        ctx.db.$queryRaw`
          SELECT 
            DATE(createdAt) as date,
            SUM(total) as revenue,
            COUNT(*) as orders
          FROM \`Order\`
          WHERE createdAt >= ${startDate}
            AND status != 'CANCELLED'
          GROUP BY DATE(createdAt)
          ORDER BY date ASC
        `,

        // Revenue by restaurant
        ctx.db.restaurant.findMany({
          include: {
            orders: {
              where: {
                createdAt: { gte: startDate },
                status: { not: "CANCELLED" }
              },
              select: {
                total: true,
              }
            },
            _count: {
              select: {
                orders: {
                  where: {
                    createdAt: { gte: startDate },
                    status: { not: "CANCELLED" }
                  }
                }
              }
            }
          }
        }),

        // Order status distribution
        ctx.db.order.groupBy({
          by: ['status'],
          where: {
            createdAt: { gte: startDate }
          },
          _count: true,
          _sum: { total: true }
        })
      ]);

      // Process revenue by restaurant
      const restaurantRevenue = revenueByRestaurant.map(restaurant => ({
        id: restaurant.id,
        name: restaurant.name,
        subdomain: restaurant.subdomain,
        revenue: restaurant.orders.reduce((sum, order) => sum + Number(order.total), 0),
        orderCount: restaurant._count.orders,
        avgOrderValue: restaurant._count.orders > 0 
          ? restaurant.orders.reduce((sum, order) => sum + Number(order.total), 0) / restaurant._count.orders 
          : 0
      })).sort((a, b) => b.revenue - a.revenue);

      return {
        summary: {
          totalRevenue: Number(totalRevenue._sum.total) || 0,
          totalOrders: totalRevenue._count,
          avgOrderValue: totalRevenue._count > 0 
            ? (Number(totalRevenue._sum.total) || 0) / totalRevenue._count 
            : 0,
          period: days
        },
        revenueByDay,
        restaurantRevenue,
        orderStats
      };
    }),

  // Analytics - User activity monitoring
  getActivityAnalytics: publicProcedure
    .query(async ({ ctx }) => {
      // Require super admin authentication and analytics view permission
      await requireViewAnalytics(ctx);
      
      const today = new Date();
      const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        dailyOrders,
        topRestaurantsByActivity,
        recentActivity
      ] = await Promise.all([
        // Daily order counts for last 7 days
        ctx.db.$queryRaw`
          SELECT 
            DATE(createdAt) as date,
            COUNT(*) as orders,
            COUNT(DISTINCT restaurantId) as activeRestaurants
          FROM \`Order\`
          WHERE createdAt >= ${last7Days}
          GROUP BY DATE(createdAt)
          ORDER BY date ASC
        `,

        // Most active restaurants (by order count in last 30 days)
        ctx.db.restaurant.findMany({
          take: 10,
          include: {
            _count: {
              select: {
                orders: {
                  where: {
                    createdAt: { gte: last30Days }
                  }
                }
              }
            }
          },
          orderBy: {
            orders: {
              _count: "desc"
            }
          }
        }),

        // Recent activity across platform
        ctx.db.order.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          include: {
            restaurant: {
              select: { name: true, subdomain: true }
            }
          }
        })
      ]);

      return {
        dailyActivity: dailyOrders,
        topRestaurants: topRestaurantsByActivity.map(restaurant => ({
          id: restaurant.id,
          name: restaurant.name,
          subdomain: restaurant.subdomain,
          recentOrders: restaurant._count.orders,
          createdAt: restaurant.createdAt
        })),
        recentActivity: recentActivity.map(order => ({
          id: order.id,
          restaurantName: order.restaurant.name,
          restaurantSubdomain: order.restaurant.subdomain,
          total: Number(order.total),
          status: order.status,
          tableNumber: order.tableNumber,
          createdAt: order.createdAt
        }))
      };
    }),

  // Restaurant performance comparison
  getRestaurantComparison: publicProcedure
    .input(z.object({
      days: z.number().min(1).max(365).default(30),
    }))
    .query(async ({ ctx, input }) => {
      // Require super admin authentication and analytics view permission
      await requireViewAnalytics(ctx);
      
      const { days } = input;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const restaurants = await ctx.db.restaurant.findMany({
        include: {
          orders: {
            where: {
              createdAt: { gte: startDate },
              status: { not: "CANCELLED" }
            }
          },
          _count: {
            select: {
              orders: {
                where: {
                  createdAt: { gte: startDate },
                  status: { not: "CANCELLED" }
                }
              },
              menuItems: true,
              adminUsers: true
            }
          }
        }
      });

      const comparison = restaurants.map(restaurant => {
        const revenue = restaurant.orders.reduce((sum, order) => sum + Number(order.total), 0);
        const orderCount = restaurant._count.orders;
        
        return {
          id: restaurant.id,
          name: restaurant.name,
          subdomain: restaurant.subdomain,
          createdAt: restaurant.createdAt,
          
          // Performance metrics
          revenue,
          orderCount,
          avgOrderValue: orderCount > 0 ? revenue / orderCount : 0,
          menuItemCount: restaurant._count.menuItems,
          adminCount: restaurant._count.adminUsers,
          
          // Activity metrics
          ordersPerDay: orderCount / days,
          revenuePerDay: revenue / days,
          
          // Efficiency metrics
          revenuePerMenuItem: restaurant._count.menuItems > 0 ? revenue / restaurant._count.menuItems : 0,
          ordersPerMenuItem: restaurant._count.menuItems > 0 ? orderCount / restaurant._count.menuItems : 0,
        };
      });

      // Sort by revenue by default
      comparison.sort((a, b) => b.revenue - a.revenue);

      return {
        restaurants: comparison,
        summary: {
          totalRestaurants: comparison.length,
          totalRevenue: comparison.reduce((sum, r) => sum + r.revenue, 0),
          totalOrders: comparison.reduce((sum, r) => sum + r.orderCount, 0),
          avgRevenuePerRestaurant: comparison.length > 0 
            ? comparison.reduce((sum, r) => sum + r.revenue, 0) / comparison.length 
            : 0,
          period: days
        }
      };
    }),

  // ============================================================================
  // SUBSCRIPTION PLAN MANAGEMENT
  // ============================================================================

  // Get all subscription plans (including inactive ones for admin view)
  getAllPlans: publicProcedure
    .query(async ({ ctx }) => {
      // Require super admin authentication and plan management permission
      await requireManagePlans(ctx);
      
      return await ctx.db.subscriptionPlan.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          _count: {
            select: {
              subscriptions: true,
            },
          },
        },
      });
    }),

  // Create new subscription plan
  createPlan: publicProcedure
    .input(z.object({
      name: z.string().min(1, "Plan name is required").max(50),
      displayName: z.string().min(1, "Display name is required").max(100),
      description: z.string().optional(),
      price: z.number().min(0, "Price must be non-negative"),
      yearlyPrice: z.number().min(0, "Yearly price must be non-negative").optional(),
      billingInterval: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
      maxLocations: z.number().min(1, "Must allow at least 1 location"),
      maxMenuItems: z.number().min(-1, "Use -1 for unlimited"),
      maxOrders: z.number().min(-1, "Use -1 for unlimited"),
      maxUsers: z.number().min(1, "Must allow at least 1 user"),
      maxWaiters: z.number().min(1, "Must allow at least 1 waiter").default(1),
      features: z.string().optional(), // JSON string
      isActive: z.boolean().default(true),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and plan management permission
      const session = await requireManagePlans(ctx);
      
      // Enhanced validation using our new validation utility
      const { validatePlanData } = await import("@/utils/stripe-plan-manager");
      const validation = validatePlanData(input);
      
      if (!validation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Validation failed: ${validation.errors.join(", ")}`,
        });
      }

      // Check if plan name already exists
      const existingPlan = await ctx.db.subscriptionPlan.findUnique({
        where: { name: input.name },
      });

      if (existingPlan) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A plan with this name already exists",
        });
      }

      // Create Stripe product and prices
      const { StripePlanManager } = await import("@/utils/stripe-plan-manager");
      const stripePlanManager = StripePlanManager.getInstance(ctx.db);
      
      let stripeResult;
      try {
        stripeResult = await stripePlanManager.createStripePlan({
          name: input.name,
          displayName: input.displayName,
          description: input.description,
          monthlyPrice: input.price,
          yearlyPrice: input.yearlyPrice,
        });
      } catch (error) {
        console.error("Failed to create Stripe plan:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create Stripe plan: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }

      // Create the plan in database with Stripe IDs
      const plan = await ctx.db.subscriptionPlan.create({
        data: {
          name: input.name,
          displayName: input.displayName,
          description: input.description,
          price: input.price,
          yearlyPrice: input.yearlyPrice,
          billingInterval: input.billingInterval,
          maxLocations: input.maxLocations,
          maxMenuItems: input.maxMenuItems,
          maxOrders: input.maxOrders,
          maxUsers: input.maxUsers,
          maxWaiters: input.maxWaiters,
          features: input.features,
          isActive: input.isActive,
          sortOrder: input.sortOrder,
          stripeProductId: stripeResult.product.id,
          stripePriceMonthlyId: stripeResult.monthlyPrice.id,
          stripePriceYearlyId: stripeResult.yearlyPrice?.id,
        },
      });

      // Log the creation activity
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "CREATE_SUBSCRIPTION_PLAN", {
        planId: plan.id,
        planName: plan.name,
        displayName: plan.displayName,
        price: plan.price.toString(),
        stripeProductId: stripeResult.product.id,
      });

      return plan;
    }),

  // Update subscription plan
  updatePlan: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, "Plan name is required").max(50).optional(),
      displayName: z.string().min(1, "Display name is required").max(100).optional(),
      description: z.string().optional(),
      price: z.number().min(0, "Price must be non-negative").optional(),
      yearlyPrice: z.number().min(0, "Yearly price must be non-negative").optional(),
      billingInterval: z.enum(["MONTHLY", "YEARLY"]).optional(),
      maxLocations: z.number().min(1, "Must allow at least 1 location").optional(),
      maxMenuItems: z.number().min(-1, "Use -1 for unlimited").optional(),
      maxOrders: z.number().min(-1, "Use -1 for unlimited").optional(),
      maxUsers: z.number().min(1, "Must allow at least 1 user").optional(),
      maxWaiters: z.number().min(1, "Must allow at least 1 waiter").optional(),
      features: z.string().optional(), // JSON string
      isActive: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and plan management permission
      const session = await requireManagePlans(ctx);
      
      const { id, ...updateData } = input;

      // Check if plan exists
      const existingPlan = await ctx.db.subscriptionPlan.findUnique({
        where: { id },
      });

      if (!existingPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription plan not found",
        });
      }

      // Enhanced validation using our new validation utility
      if (Object.keys(updateData).length > 0) {
        const { validatePlanData } = await import("@/utils/stripe-plan-manager");
        const mergedData = { ...existingPlan, ...updateData };
        const validation = validatePlanData(mergedData);
        
        if (!validation.isValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Validation failed: ${validation.errors.join(", ")}`,
          });
        }
      }

      // Check if name is being changed and if it conflicts
      if (updateData.name && updateData.name !== existingPlan.name) {
        const nameConflict = await ctx.db.subscriptionPlan.findUnique({
          where: { name: updateData.name },
        });

        if (nameConflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A plan with this name already exists",
          });
        }
      }

      // Update Stripe product and prices if needed
      if (existingPlan.stripeProductId) {
        try {
          const { StripePlanManager } = await import("@/utils/stripe-plan-manager");
          const stripePlanManager = StripePlanManager.getInstance(ctx.db);
          
          // Check if product info needs updating
          const hasProductChanges = updateData.name || updateData.displayName || updateData.description;
          if (hasProductChanges) {
            await stripePlanManager.updateStripePlan({
              stripeProductId: existingPlan.stripeProductId,
              name: updateData.name,
              displayName: updateData.displayName,
              description: updateData.description,
            });
            console.log(`✅ Updated Stripe product info for plan: ${existingPlan.name}`);
          }
          
          // Check if prices need updating
          const hasPriceChanges = updateData.price !== undefined || updateData.yearlyPrice !== undefined;
          if (hasPriceChanges) {
            console.log(`🔄 Updating Stripe prices for plan: ${existingPlan.name}`);
            console.log(`   Current monthly: $${existingPlan.price} → New: $${updateData.price || existingPlan.price}`);
            console.log(`   Current yearly: $${existingPlan.yearlyPrice || 'none'} → New: $${updateData.yearlyPrice || existingPlan.yearlyPrice || 'none'}`);
            
            const newPriceIds = await stripePlanManager.updatePlanPrices(
              existingPlan.stripeProductId,
              updateData.price,
              updateData.yearlyPrice
            );
            
            // Update the plan data with new Stripe price IDs
            if (newPriceIds.monthlyPriceId) {
              updateData.stripePriceMonthlyId = newPriceIds.monthlyPriceId;
            }
            if (newPriceIds.yearlyPriceId) {
              updateData.stripePriceYearlyId = newPriceIds.yearlyPriceId;
            }
            
            console.log(`✅ Updated Stripe prices for plan: ${existingPlan.name}`);
            if (newPriceIds.monthlyPriceId) {
              console.log(`   New monthly price ID: ${newPriceIds.monthlyPriceId}`);
            }
            if (newPriceIds.yearlyPriceId) {
              console.log(`   New yearly price ID: ${newPriceIds.yearlyPriceId}`);
            }
          }
        } catch (error) {
          console.error("❌ Failed to update Stripe plan:", error);
          // Don't fail the entire operation if Stripe update fails
          // Log the error but continue with database update
          console.error("   Continuing with database update despite Stripe error...");
        }
      } else if (updateData.price !== undefined || updateData.yearlyPrice !== undefined) {
        console.warn(`⚠️ Plan ${existingPlan.name} has no Stripe product ID but prices are being updated`);
        console.warn("   Consider running Stripe sync to create missing Stripe products");
      }

      // Update the plan
      const updatedPlan = await ctx.db.subscriptionPlan.update({
        where: { id },
        data: updateData,
      });

      // Log the update activity
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "UPDATE_SUBSCRIPTION_PLAN", {
        planId: updatedPlan.id,
        planName: updatedPlan.name,
        changes: Object.keys(updateData),
        stripeProductId: existingPlan.stripeProductId,
      });

      return updatedPlan;
    }),

  // Delete subscription plan (with safety checks)
  deletePlan: publicProcedure
    .input(z.object({
      id: z.string(),
      force: z.boolean().default(false), // Allow force delete even with active subscriptions
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and plan management permission
      const session = await requireManagePlans(ctx);
      
      // Check if plan exists
      const plan = await ctx.db.subscriptionPlan.findUnique({
        where: { id: input.id },
        include: {
          subscriptions: {
            where: {
              status: { in: ["ACTIVE", "TRIAL", "PAST_DUE"] }
            }
          }
        }
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription plan not found",
        });
      }

      // Check for active subscriptions unless force delete
      if (plan.subscriptions.length > 0 && !input.force) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete plan with ${plan.subscriptions.length} active subscription(s). Use force delete if you're sure.`,
        });
      }

      // Archive Stripe product instead of deleting (safer approach)
      if (plan.stripeProductId) {
        try {
          const { StripePlanManager } = await import("@/utils/stripe-plan-manager");
          const stripePlanManager = StripePlanManager.getInstance(ctx.db);
          
          await stripePlanManager.archiveStripePlan(plan.stripeProductId);
          
          // Update plan to mark as archived in Stripe
          await ctx.db.subscriptionPlan.update({
            where: { id: input.id },
            data: { stripeArchived: true, isActive: false },
          });
        } catch (error) {
          console.error("Failed to archive Stripe plan:", error);
          // Continue with database deletion even if Stripe archival fails
        }
      }

      // Delete the plan from database
      await ctx.db.subscriptionPlan.delete({
        where: { id: input.id },
      });

      // Log the deletion activity
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "DELETE_SUBSCRIPTION_PLAN", {
        planId: plan.id,
        planName: plan.name,
        hadActiveSubscriptions: plan._count.subscriptions > 0,
        forceDelete: input.force,
      });

      return { success: true, deletedPlan: plan };
    }),

  // Get plan analytics and metrics
  getPlanAnalytics: publicProcedure
    .input(z.object({
      planId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Require super admin authentication and plan management permission
      await requireManagePlans(ctx);

      const { PlanAnalyticsManager } = await import("@/utils/plan-analytics");
      const analyticsManager = PlanAnalyticsManager.getInstance(ctx.db);

      return await analyticsManager.getPlanMetrics(input.planId);
    }),

  // Get detailed usage breakdown for a plan
  getPlanUsageBreakdown: publicProcedure
    .input(z.object({
      planId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Require super admin authentication and plan management permission
      await requireManagePlans(ctx);

      const { PlanAnalyticsManager } = await import("@/utils/plan-analytics");
      const analyticsManager = PlanAnalyticsManager.getInstance(ctx.db);

      return await analyticsManager.getUsageBreakdown(input.planId);
    }),

  // Record analytics data for plans
  recordPlanAnalytics: publicProcedure
    .input(z.object({
      planIds: z.array(z.string()).optional(), // If not provided, record for all plans
      period: z.date().optional(), // If not provided, use current date
      periodType: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).default("MONTHLY"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and plan management permission
      const session = await requireManagePlans(ctx);

      const { PlanAnalyticsManager } = await import("@/utils/plan-analytics");
      const analyticsManager = PlanAnalyticsManager.getInstance(ctx.db);

      const period = input.period || new Date();
      let planIds = input.planIds;

      // If no plan IDs provided, get all active plans
      if (!planIds) {
        const plans = await ctx.db.subscriptionPlan.findMany({
          where: { isActive: true },
          select: { id: true },
        });
        planIds = plans.map(p => p.id);
      }

      // Record analytics for each plan
      const recordPromises = planIds.map(planId =>
        analyticsManager.recordPlanAnalytics(planId, period, input.periodType)
      );

      await Promise.all(recordPromises);

      // Log the activity
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "RECORD_PLAN_ANALYTICS", {
        planIds,
        period: period.toISOString(),
        periodType: input.periodType,
      });

      return { success: true, recordedPlans: planIds.length };
    }),

  // Sync all plans with Stripe
  syncPlansWithStripe: publicProcedure
    .mutation(async ({ ctx }) => {
      // Require super admin authentication and plan management permission
      const session = await requireManagePlans(ctx);

      try {
        const { StripePlanManager } = await import("@/utils/stripe-plan-manager");
        const stripePlanManager = StripePlanManager.getInstance(ctx.db);

        await stripePlanManager.syncAllPlansWithStripe();

        // Log the activity
        const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
        await logSuperAdminActivity(session.id, "SYNC_PLANS_WITH_STRIPE", {
          timestamp: new Date().toISOString(),
        });

        return { success: true, message: "Plans synced with Stripe successfully" };
      } catch (error) {
        console.error("❌ Failed to sync plans with Stripe:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to sync plans with Stripe: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  // Toggle plan active status
  togglePlanStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and plan management permission
      const session = await requireManagePlans(ctx);
      
      const updatedPlan = await ctx.db.subscriptionPlan.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });

      // Log the status change activity
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "TOGGLE_PLAN_STATUS", {
        planId: updatedPlan.id,
        planName: updatedPlan.name,
        newStatus: input.isActive ? "ACTIVE" : "INACTIVE",
      });

      return updatedPlan;
    }),

  // Get waiter templates with pagination and search
  getWaiterTemplates: publicProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(10),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Require super admin authentication and template management permission
      await requireManageTemplates(ctx);
      
      const { page, limit, search } = input;
      const skip = (page - 1) * limit;

      const where = search ? {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      } : {};

      const [templates, total] = await Promise.all([
        ctx.db.waiterPersonalityTemplate.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            description: true,
            tone: true,
            responseStyle: true,
            defaultWelcomeMessage: true,
            createdAt: true,
            _count: {
              select: {
                restaurants: true,
              },
            },
          },
        }),
        ctx.db.waiterPersonalityTemplate.count({ where }),
      ]);

      return {
        templates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }),

  // Create waiter template
  createWaiterTemplate: publicProcedure
    .input(waiterTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and template management permission
      const session = await requireManageTemplates(ctx);
      
      const template = await ctx.db.waiterPersonalityTemplate.create({
        data: {
          ...input,
          createdById: session.id,
        },
      });

      // Log the creation
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "CREATE_WAITER_TEMPLATE", {
        templateId: template.id,
        templateName: template.name,
      });

      return template;
    }),

  // Update waiter template
  updateWaiterTemplate: publicProcedure
    .input(z.object({
      templateId: z.string(),
      minimumPlan: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]).nullable().optional(),
      isPremium: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and template management permission
      const session = await requireManageTemplates(ctx);
      
      const { templateId, ...updateData } = input;

      // Get template details for logging
      const existingTemplate = await ctx.db.waiterPersonalityTemplate.findUnique({
        where: { id: templateId },
        select: { name: true },
      });

      if (!existingTemplate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      // Update the template
      const template = await ctx.db.waiterPersonalityTemplate.update({
        where: { id: templateId },
        data: updateData,
      });

      // Log the update
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "UPDATE_WAITER_TEMPLATE", {
        templateId: template.id,
        templateName: template.name,
        changes: updateData,
      });

      return template;
    }),

  // Delete waiter template
  deleteWaiterTemplate: publicProcedure
    .input(z.object({
      templateId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and template management permission
      const session = await requireManageTemplates(ctx);
      
      const { templateId } = input;

      // Get template details for logging
      const template = await ctx.db.waiterPersonalityTemplate.findUnique({
        where: { id: templateId },
        select: { name: true },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      // Delete the template
      await ctx.db.waiterPersonalityTemplate.delete({
        where: { id: templateId },
      });

      // Log the deletion
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "DELETE_WAITER_TEMPLATE", {
        templateId,
        templateName: template.name,
      });

      return { success: true };
    }),

  // Get knowledge snippets
  getKnowledgeSnippets: publicProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(10),
      category: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Require super admin authentication and knowledge management permission
      await requireManageKnowledge(ctx);
      
      const { page, limit, category, search } = input;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (category) where.category = category;
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { content: { contains: search } },
        ];
      }

      const [snippets, total] = await Promise.all([
        ctx.db.knowledgeSnippet.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            content: true,
            category: true,
            createdAt: true,
            createdBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        }),
        ctx.db.knowledgeSnippet.count({ where }),
      ]);

      return {
        snippets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }),

  // Create knowledge snippet
  createKnowledgeSnippet: publicProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      category: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and knowledge management permission
      const session = await requireManageKnowledge(ctx);
      
      const snippet = await ctx.db.knowledgeSnippet.create({
        data: {
          ...input,
          createdById: session.id,
        },
      });

      // Log the creation
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "CREATE_KNOWLEDGE_SNIPPET", {
        snippetId: snippet.id,
        snippetTitle: snippet.title,
        category: snippet.category,
      });

      return snippet;
    }),

  // Update knowledge snippet
  updateKnowledgeSnippet: publicProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1),
      content: z.string().min(1),
      category: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and knowledge management permission
      const session = await requireManageKnowledge(ctx);
      
      const { id, ...updateData } = input;

      const snippet = await ctx.db.knowledgeSnippet.update({
        where: { id },
        data: updateData,
      });

      // Log the update
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "UPDATE_KNOWLEDGE_SNIPPET", {
        snippetId: snippet.id,
        snippetTitle: snippet.title,
        category: snippet.category,
      });

      return snippet;
    }),

  // Delete knowledge snippet
  deleteKnowledgeSnippet: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and knowledge management permission
      const session = await requireManageKnowledge(ctx);
      
      const { id } = input;

      // Get snippet details for logging
      const snippet = await ctx.db.knowledgeSnippet.findUnique({
        where: { id },
        select: { title: true, category: true },
      });

      if (!snippet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Knowledge snippet not found",
        });
      }

      // Delete the snippet
      await ctx.db.knowledgeSnippet.delete({
        where: { id },
      });

      // Log the deletion
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "DELETE_KNOWLEDGE_SNIPPET", {
        snippetId: id,
        snippetTitle: snippet.title,
        category: snippet.category,
      });

      return { success: true };
    }),

  // ============================================================================
  // TEMPLATE KNOWLEDGE ASSIGNMENT
  // ============================================================================

  // Get template knowledge assignments
  getTemplateKnowledge: publicProcedure
    .input(z.object({
      templateId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Require super admin authentication and knowledge management permission
      await requireManageKnowledge(ctx);
      
      return ctx.db.templateKnowledge.findMany({
        where: { templateId: input.templateId },
        include: {
          snippet: {
            select: {
              id: true,
              title: true,
              content: true,
              category: true,
            },
          },
        },
      });
    }),

  // Assign knowledge to template
  assignKnowledgeToTemplate: publicProcedure
    .input(z.object({
      templateId: z.string(),
      snippetId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and knowledge management permission
      const session = await requireManageKnowledge(ctx);
      
      // Check if assignment already exists
      const existing = await ctx.db.templateKnowledge.findUnique({
        where: {
          templateId_snippetId: {
            templateId: input.templateId,
            snippetId: input.snippetId,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Knowledge is already assigned to this template",
        });
      }

      const assignment = await ctx.db.templateKnowledge.create({
        data: {
          templateId: input.templateId,
          snippetId: input.snippetId,
          createdBy: session.id,
        },
      });

      // Log the assignment activity
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "ASSIGN_TEMPLATE_KNOWLEDGE", {
        templateId: input.templateId,
        snippetId: input.snippetId,
      });

      return assignment;
    }),

  // Remove knowledge from template
  removeKnowledgeFromTemplate: publicProcedure
    .input(z.object({
      templateId: z.string(),
      snippetId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Require super admin authentication and knowledge management permission
      const session = await requireManageKnowledge(ctx);
      
      await ctx.db.templateKnowledge.delete({
        where: {
          templateId_snippetId: {
            templateId: input.templateId,
            snippetId: input.snippetId,
          },
        },
      });

      // Log the removal activity
      const { logSuperAdminActivity } = await import("@/utils/superAdminAuth");
      await logSuperAdminActivity(session.id, "REMOVE_TEMPLATE_KNOWLEDGE", {
        templateId: input.templateId,
        snippetId: input.snippetId,
      });

      return { success: true };
    }),
}); 