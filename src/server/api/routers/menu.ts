import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getAdminSessionFromCookies } from "@/utils/auth";
import { FeatureGate } from "@/utils/featureGating";
import { TRPCError } from "@trpc/server";

// Zod schemas for validation
const createMenuItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  category: z.string().min(1, "Category is required").max(50, "Category too long"),
  price: z.number().min(0, "Price must be positive").max(10000, "Price too high"),
  available: z.boolean().default(true),
  dietaryTags: z.array(z.string()).default([]),
  imageUrl: z.string().optional(),
  imageAlt: z.string().max(255, "Image alt text too long").optional(),
});

const updateMenuItemSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  category: z.string().min(1).max(50).optional(),
  price: z.number().min(0).max(10000).optional(),
  available: z.boolean().optional(),
  dietaryTags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().max(255, "Image alt text too long").optional(),
});

const deleteMenuItemSchema = z.object({
  id: z.string().cuid(),
});

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

const getMenuItemsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  category: z.string().optional(),
  search: z.string().optional(),
});

export const menuRouter = createTRPCRouter({
  // Get all menu items for the admin's restaurant
  getAll: publicProcedure.query(async ({ ctx }) => {
    const admin = getAdminFromContext(ctx);

    const menuItems = await ctx.db.menuItem.findMany({
      where: {
        restaurantId: admin.restaurantId,
      },
      include: {
        dietaryTags: true,
      },
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
    });

    return menuItems.map((item) => ({
      ...item,
      price: Number(item.price), // Convert Decimal to number for frontend
      dietaryTags: item.dietaryTags.map((tag) => tag.value),
    }));
  }),

  // Get paginated menu items for the admin's restaurant
  getPaginated: publicProcedure
    .input(getMenuItemsSchema)
    .query(async ({ ctx, input }) => {
      const admin = getAdminFromContext(ctx);

      const where = {
        restaurantId: admin.restaurantId,
        ...(input.category && { category: input.category }),
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" as const } },
            { description: { contains: input.search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [menuItems, totalCount] = await Promise.all([
        ctx.db.menuItem.findMany({
          where,
          include: {
            dietaryTags: true,
          },
          orderBy: [
            { category: "asc" },
            { name: "asc" },
          ],
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.menuItem.count({ where }),
      ]);

      return {
        items: menuItems.map((item) => ({
          ...item,
          price: Number(item.price), // Convert Decimal to number for frontend
          dietaryTags: item.dietaryTags.map((tag) => tag.value),
        })),
        totalCount,
        hasMore: input.offset + input.limit < totalCount,
      };
    }),

  // Create a new menu item
  create: publicProcedure
    .input(createMenuItemSchema)
    .mutation(async ({ ctx, input }) => {
      const admin = getAdminFromContext(ctx);

      // Check subscription limits for menu items
      const canAddMenuItem = await FeatureGate.canAddMenuItem(admin.restaurantId);
      if (!canAddMenuItem) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Menu item limit reached for your current plan. Please upgrade to add more items.",
        });
      }

      // Check if item with same name already exists for this restaurant
      const existingItem = await ctx.db.menuItem.findUnique({
        where: {
          restaurantId_name: {
            restaurantId: admin.restaurantId,
            name: input.name,
          },
        },
      });

      if (existingItem) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Menu item with this name already exists",
        });
      }

      // Create the menu item
      const menuItem = await ctx.db.menuItem.create({
        data: {
          name: input.name,
          description: input.description,
          category: input.category,
          price: input.price,
          available: input.available,
          restaurantId: admin.restaurantId,
          imageUrl: input.imageUrl || null,
          imageAlt: input.imageAlt || null,
        },
      });

      // Add dietary tags if provided
      if (input.dietaryTags.length > 0) {
        await ctx.db.dietaryTag.createMany({
          data: input.dietaryTags.map((tag) => ({
            value: tag,
            menuItemId: menuItem.id,
          })),
        });
      }

      // Track usage
      await FeatureGate.trackUsage(admin.restaurantId, "MENU_ITEMS", 1);

      // Return the created item with tags
      const createdItem = await ctx.db.menuItem.findUnique({
        where: { id: menuItem.id },
        include: { dietaryTags: true },
      });

      return {
        ...createdItem!,
        price: Number(createdItem!.price),
        dietaryTags: createdItem!.dietaryTags.map((tag) => tag.value),
      };
    }),

  // Update an existing menu item
  update: publicProcedure
    .input(updateMenuItemSchema)
    .mutation(async ({ ctx, input }) => {
      const admin = getAdminFromContext(ctx);

      // Verify the menu item belongs to the admin's restaurant
      const existingItem = await ctx.db.menuItem.findUnique({
        where: { id: input.id },
        include: { dietaryTags: true },
      });

      if (!existingItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu item not found",
        });
      }

      if (existingItem.restaurantId !== admin.restaurantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update menu items for your restaurant",
        });
      }

      // Check for name conflicts if name is being updated
      if (input.name && input.name !== existingItem.name) {
        const nameConflict = await ctx.db.menuItem.findUnique({
          where: {
            restaurantId_name: {
              restaurantId: admin.restaurantId,
              name: input.name,
            },
          },
        });

        if (nameConflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Menu item with this name already exists",
          });
        }
      }

      // Update the menu item
      const updatedItem = await ctx.db.menuItem.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description && { description: input.description }),
          ...(input.category && { category: input.category }),
          ...(input.price !== undefined && { price: input.price }),
          ...(input.available !== undefined && { available: input.available }),
          ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl || null }),
          ...(input.imageAlt !== undefined && { imageAlt: input.imageAlt || null }),
        },
      });

      // Update dietary tags if provided
      if (input.dietaryTags !== undefined) {
        // Delete existing tags
        await ctx.db.dietaryTag.deleteMany({
          where: { menuItemId: input.id },
        });

        // Create new tags
        if (input.dietaryTags.length > 0) {
          await ctx.db.dietaryTag.createMany({
            data: input.dietaryTags.map((tag) => ({
              value: tag,
              menuItemId: input.id,
            })),
          });
        }
      }

      // Return the updated item with tags
      const finalItem = await ctx.db.menuItem.findUnique({
        where: { id: input.id },
        include: { dietaryTags: true },
      });

      return {
        ...finalItem!,
        price: Number(finalItem!.price),
        dietaryTags: finalItem!.dietaryTags.map((tag) => tag.value),
      };
    }),

  // Delete a menu item (soft delete by setting available to false)
  delete: publicProcedure
    .input(deleteMenuItemSchema)
    .mutation(async ({ ctx, input }) => {
      const admin = getAdminFromContext(ctx);

      // Verify the menu item belongs to the admin's restaurant
      const existingItem = await ctx.db.menuItem.findUnique({
        where: { id: input.id },
      });

      if (!existingItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu item not found",
        });
      }

      if (existingItem.restaurantId !== admin.restaurantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete menu items for your restaurant",
        });
      }

      // Soft delete by setting available to false
      const deletedItem = await ctx.db.menuItem.update({
        where: { id: input.id },
        data: { available: false },
      });

      return {
        ...deletedItem,
        price: Number(deletedItem.price),
      };
    }),

  // Get all menu items for a specific restaurant (public access for customers)
  getByRestaurant: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const menuItems = await ctx.db.menuItem.findMany({
        where: {
          restaurantId: input.restaurantId,
          available: true, // Only show available items to customers
        },
        include: {
          dietaryTags: true,
        },
        orderBy: [
          { category: "asc" },
          { name: "asc" },
        ],
      });

      return menuItems.map((item) => ({
        ...item,
        price: Number(item.price), // Convert Decimal to number for frontend
      }));
    }),

  // Get unique categories for the restaurant
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const admin = getAdminFromContext(ctx);

    const categories = await ctx.db.menuItem.findMany({
      where: {
        restaurantId: admin.restaurantId,
        available: true,
      },
      select: {
        category: true,
      },
      distinct: ["category"],
      orderBy: {
        category: "asc",
      },
    });

    return categories.map((item) => item.category);
  }),

  // Get unique dietary tags for the restaurant
  getDietaryTags: publicProcedure.query(async ({ ctx }) => {
    const admin = getAdminFromContext(ctx);

    const tags = await ctx.db.dietaryTag.findMany({
      where: {
        menuItem: {
          restaurantId: admin.restaurantId,
          available: true,
        },
      },
      select: {
        value: true,
      },
      distinct: ["value"],
      orderBy: {
        value: "asc",
      },
    });

    return tags.map((tag) => tag.value);
  }),
}); 