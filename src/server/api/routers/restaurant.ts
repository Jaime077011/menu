import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { requireManageRestaurants } from "@/utils/superAdminAuth";

export const restaurantRouter = createTRPCRouter({
  // Get all restaurants (for debugging)
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      const superAdmin = await requireManageRestaurants(ctx);
      
      const restaurants = await ctx.db.restaurant.findMany({
        select: {
          id: true,
          name: true,
          subdomain: true,
        },
      });
      return restaurants;
    }),

  // Get waiter templates (plan-based access)
  getWaiterTemplates: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Check restaurant's subscription plan for filtering
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: input.restaurantId },
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      let planFilter = {};
      
      if (restaurant.subscription?.plan) {
        const planName = restaurant.subscription.plan.name;
        
        // Apply plan-based filtering
        if (planName === "STARTER") {
          planFilter = {
            OR: [
              { minimumPlan: null },
              { minimumPlan: "STARTER" },
            ],
          };
        } else if (planName === "PROFESSIONAL") {
          planFilter = {
            OR: [
              { minimumPlan: null },
              { minimumPlan: "STARTER" },
              { minimumPlan: "PROFESSIONAL" },
            ],
          };
        }
        // ENTERPRISE gets all templates (no filter needed)
      } else {
        // No subscription - only show basic templates
        planFilter = {
          OR: [
            { minimumPlan: null },
            { minimumPlan: "STARTER" },
          ],
        };
      }

      const templates = await (ctx.db as any).waiterPersonalityTemplate.findMany({
        where: { 
          isActive: true,
          ...planFilter,
        },
        orderBy: { name: 'asc' },
      });

      return templates.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        tone: template.tone,
        responseStyle: template.responseStyle,
        defaultWelcomeMessage: template.defaultWelcomeMessage,
        minimumPlan: template.minimumPlan,
        isPremium: template.isPremium,
      }));
    }),

  // Get waiter personality settings
  getWaiterSettings: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: input.restaurantId },
      });

      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      return {
        id: restaurant.id,
        name: restaurant.name,
        waiterName: restaurant.waiterName,
        waiterPersonality: restaurant.waiterPersonality,
        welcomeMessage: restaurant.welcomeMessage,
        conversationTone: restaurant.conversationTone,
        specialtyKnowledge: restaurant.specialtyKnowledge,
        responseStyle: restaurant.responseStyle,
        waiterPersonalityTemplateId: (restaurant as any).waiterPersonalityTemplateId,
      };
    }),

  // Update waiter personality settings
  updateWaiterSettings: publicProcedure
    .input(z.object({
      restaurantId: z.string(),
      waiterName: z.string().optional(),
      waiterPersonality: z.enum(["FRIENDLY", "PROFESSIONAL", "CASUAL", "ENTHUSIASTIC"]).optional(),
      welcomeMessage: z.string().optional(),
      conversationTone: z.enum(["FORMAL", "BALANCED", "CASUAL"]).optional(),
      specialtyKnowledge: z.string().optional(),
      responseStyle: z.enum(["HELPFUL", "CONCISE", "DETAILED", "PLAYFUL"]).optional(),
      waiterPersonalityTemplateId: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { restaurantId, ...updateData } = input;

      const restaurant = await ctx.db.restaurant.update({
        where: { id: restaurantId },
        data: updateData as any,
      });

      return {
        id: restaurant.id,
        name: restaurant.name,
        waiterName: restaurant.waiterName,
        waiterPersonality: restaurant.waiterPersonality,
        welcomeMessage: restaurant.welcomeMessage,
        conversationTone: restaurant.conversationTone,
        specialtyKnowledge: restaurant.specialtyKnowledge,
        responseStyle: restaurant.responseStyle,
      };
    }),


}); 