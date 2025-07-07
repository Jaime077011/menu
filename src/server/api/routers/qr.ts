import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getAdminSessionFromCookies } from "@/utils/auth";
import { TRPCError } from "@trpc/server";
import QRCode from "qrcode";

// Helper function to get admin session from context
const getAdminFromContext = (ctx: { req: { headers: { cookie?: string } } }) => {
  const cookies = ctx.req.headers.cookie ?? "";
  const adminSession = getAdminSessionFromCookies(cookies);
  
  if (!adminSession) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Admin authentication required",
    });
  }
  
  return adminSession;
};

export const qrRouter = createTRPCRouter({
  /**
   * Generate QR code for restaurant table
   */
  generateTableQR: publicProcedure
    .input(
      z.object({
        tableNumber: z.number().min(1).max(999),
        format: z.enum(["png", "svg"]).default("png"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const admin = getAdminFromContext(ctx);
      const { tableNumber, format } = input;

      // Get restaurant info from admin context
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: admin.restaurantId },
        select: {
          subdomain: true,
          name: true,
        },
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      // Generate the URL that customers will visit (direct path format)
      const customerUrl = `http://localhost:3000/${restaurant.subdomain}?table=${tableNumber}`;

      try {
        if (format === "svg") {
          const qrSvg = await QRCode.toString(customerUrl, {
            type: "svg",
            width: 256,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });

          return {
            success: true,
            data: qrSvg,
            format: "svg",
            url: customerUrl,
            tableNumber,
            restaurantName: restaurant.name,
          };
        } else {
          // Generate PNG as base64 data URL
          const qrDataUrl = await QRCode.toDataURL(customerUrl, {
            width: 256,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });

          return {
            success: true,
            data: qrDataUrl,
            format: "png",
            url: customerUrl,
            tableNumber,
            restaurantName: restaurant.name,
          };
        }
      } catch (error) {
        console.error("QR Code generation error:", error);
        throw new Error("Failed to generate QR code");
      }
    }),

  /**
   * Get all tables with QR codes for restaurant
   */
  getRestaurantTables: publicProcedure
    .input(
      z.object({
        maxTables: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const admin = getAdminFromContext(ctx);
      const { maxTables } = input;

      // Get restaurant info
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: admin.restaurantId },
        select: {
          subdomain: true,
          name: true,
        },
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      // Generate table list (1 to maxTables)
      const tables = Array.from({ length: maxTables }, (_, i) => {
        const tableNumber = i + 1;
        return {
          tableNumber,
          url: `http://localhost:3000/${restaurant.subdomain}?table=${tableNumber}`,
        };
      });

      return {
        restaurant: restaurant.name,
        subdomain: restaurant.subdomain,
        tables,
      };
    }),

  /**
   * Generate bulk QR codes for multiple tables
   */
  generateBulkQR: publicProcedure
    .input(
      z.object({
        startTable: z.number().min(1).max(999),
        endTable: z.number().min(1).max(999),
        format: z.enum(["png", "svg"]).default("png"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const admin = getAdminFromContext(ctx);
      const { startTable, endTable, format } = input;

      if (startTable > endTable) {
        throw new Error("Start table must be less than or equal to end table");
      }

      if (endTable - startTable > 50) {
        throw new Error("Cannot generate more than 50 QR codes at once");
      }

      // Get restaurant info
      const restaurant = await ctx.db.restaurant.findUnique({
        where: { id: admin.restaurantId },
        select: {
          subdomain: true,
          name: true,
        },
      });

      if (!restaurant) {
        throw new Error("Restaurant not found");
      }

      const qrCodes = [];

      for (let tableNumber = startTable; tableNumber <= endTable; tableNumber++) {
        const customerUrl = `http://localhost:3000/${restaurant.subdomain}?table=${tableNumber}`;

        try {
          if (format === "svg") {
            const qrSvg = await QRCode.toString(customerUrl, {
              type: "svg",
              width: 200,
              margin: 2,
            });

            qrCodes.push({
              tableNumber,
              data: qrSvg,
              url: customerUrl,
            });
          } else {
            const qrDataUrl = await QRCode.toDataURL(customerUrl, {
              width: 200,
              margin: 2,
            });

            qrCodes.push({
              tableNumber,
              data: qrDataUrl,
              url: customerUrl,
            });
          }
        } catch (error) {
          console.error(`QR Code generation error for table ${tableNumber}:`, error);
          // Continue with other tables
        }
      }

      return {
        success: true,
        format,
        restaurantName: restaurant.name,
        qrCodes,
      };
    }),
}); 