import { postRouter } from "@/server/api/routers/post";
import { menuRouter } from "@/server/api/routers/menu";
import { orderRouter } from "@/server/api/routers/order";
import { chatRouter } from "@/server/api/routers/chat";
import { qrRouter } from "@/server/api/routers/qr";
import { superAdminRouter } from "@/server/api/routers/superAdmin";
import { restaurantRouter } from "@/server/api/routers/restaurant";
import { sessionRouter } from "@/server/api/routers/session";
import { aiAnalyticsRouter } from "@/server/api/routers/aiAnalytics";
import { subscriptionRouter } from "@/server/api/routers/subscription";
import { rolePermissionsRouter } from "@/server/api/routers/rolePermissions";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  menu: menuRouter,
  order: orderRouter,
  chat: chatRouter,
  qr: qrRouter,
  superAdmin: superAdminRouter,
  restaurant: restaurantRouter,
  session: sessionRouter,
  aiAnalytics: aiAnalyticsRouter,
  subscription: subscriptionRouter,
  rolePermissions: rolePermissionsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
