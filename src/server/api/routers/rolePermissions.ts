import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getSuperAdminFromContext, requireManageAdmins } from "@/utils/superAdminAuth";
import { SuperAdminRole } from "@/utils/roles";

// Permission schema for validation
const PermissionSchema = z.object({
  canManageAdmins: z.boolean(),
  canManageRestaurants: z.boolean(),
  canManageSubscriptions: z.boolean(),
  canManagePlans: z.boolean(),
  canViewAnalytics: z.boolean(),
  canViewBilling: z.boolean(),
  canManageSettings: z.boolean(),
  canManageTemplates: z.boolean(),
  canManageKnowledge: z.boolean(),
});

export const rolePermissionsRouter = createTRPCRouter({
  // Get all role permissions
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      const superAdmin = await requireManageAdmins(ctx);
      
      const rolePermissions = await ctx.db.rolePermission.findMany({
        orderBy: { role: 'asc' },
      });
      
      // Parse permissions JSON
      const permissions = rolePermissions.map(rp => ({
        ...rp,
        permissions: JSON.parse(rp.permissions),
      }));
      
      return permissions;
    }),

  // Get permissions for a specific role
  getByRole: publicProcedure
    .input(z.object({ role: z.string() }))
    .query(async ({ ctx, input }) => {
      const superAdmin = await requireManageAdmins(ctx);
      
      const rolePermission = await ctx.db.rolePermission.findUnique({
        where: { role: input.role },
      });
      
      if (!rolePermission) {
        return null;
      }
      
      return {
        ...rolePermission,
        permissions: JSON.parse(rolePermission.permissions),
      };
    }),

  // Get permissions for current user (accessible to all authenticated users)
  getCurrentUserPermissions: publicProcedure
    .query(async ({ ctx }) => {
      const superAdmin = await getSuperAdminFromContext(ctx);
      
      const rolePermission = await ctx.db.rolePermission.findUnique({
        where: { role: superAdmin.role },
      });
      
      if (rolePermission) {
        return {
          role: superAdmin.role,
          permissions: JSON.parse(rolePermission.permissions),
          isCustom: true,
        };
      }
      
      // Fallback to default permissions
      const { DEFAULT_ROLE_PERMISSIONS } = await import('@/utils/roles');
      const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[superAdmin.role as SuperAdminRole];
      
      return {
        role: superAdmin.role,
        permissions: defaultPermissions || DEFAULT_ROLE_PERMISSIONS[SuperAdminRole.SUPPORT_ADMIN],
        isCustom: false,
      };
    }),

  // Create or update role permissions
  upsert: publicProcedure
    .input(z.object({
      role: z.enum([SuperAdminRole.SUPER_ADMIN, SuperAdminRole.SUPPORT_ADMIN]),
      permissions: PermissionSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await requireManageAdmins(ctx);
      
      const rolePermission = await ctx.db.rolePermission.upsert({
        where: { role: input.role },
        update: {
          permissions: JSON.stringify(input.permissions),
          createdBy: superAdmin.id,
        },
        create: {
          role: input.role,
          permissions: JSON.stringify(input.permissions),
          createdBy: superAdmin.id,
        },
      });
      
      return {
        ...rolePermission,
        permissions: JSON.parse(rolePermission.permissions),
      };
    }),

  // Delete role permissions (reset to default)
  delete: publicProcedure
    .input(z.object({ role: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await requireManageAdmins(ctx);
      
      const deletedPermission = await ctx.db.rolePermission.delete({
        where: { role: input.role },
      });
      
      return deletedPermission;
    }),

  // Get available permissions list
  getAvailablePermissions: publicProcedure
    .query(async ({ ctx }) => {
      const superAdmin = await requireManageAdmins(ctx);
      
      return {
        permissions: [
          { key: 'canManageAdmins', label: 'Manage Administrators', description: 'Create, edit, and delete super admin accounts' },
          { key: 'canManageRestaurants', label: 'Manage Restaurants', description: 'View and manage restaurant accounts' },
          { key: 'canManageSubscriptions', label: 'Manage Subscriptions', description: 'Handle subscription changes and support' },
          { key: 'canManagePlans', label: 'Manage Plans', description: 'Create, edit, and delete subscription plans' },
          { key: 'canViewAnalytics', label: 'View Analytics', description: 'Access analytics and performance metrics' },
          { key: 'canViewBilling', label: 'View Billing', description: 'Access billing information and financial data' },
          { key: 'canManageSettings', label: 'Manage Settings', description: 'Modify system settings and configurations' },
          { key: 'canManageTemplates', label: 'Manage Templates', description: 'Create and edit waiter personality templates' },
          { key: 'canManageKnowledge', label: 'Manage Knowledge', description: 'Manage knowledge base and AI snippets' },
        ],
      };
    }),

  // Reset role to default permissions
  resetToDefault: publicProcedure
    .input(z.object({ role: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await requireManageAdmins(ctx);
      
      // Get default permissions from hardcoded values
      const { ROLE_PERMISSIONS } = await import('@/utils/roles');
      const defaultPermissions = ROLE_PERMISSIONS[input.role as SuperAdminRole];
      
      if (!defaultPermissions) {
        throw new Error(`Invalid role: ${input.role}`);
      }
      
      const rolePermission = await ctx.db.rolePermission.upsert({
        where: { role: input.role },
        update: {
          permissions: JSON.stringify(defaultPermissions),
          createdBy: superAdmin.id,
        },
        create: {
          role: input.role,
          permissions: JSON.stringify(defaultPermissions),
          createdBy: superAdmin.id,
        },
      });
      
      return {
        ...rolePermission,
        permissions: JSON.parse(rolePermission.permissions),
      };
    }),
}); 