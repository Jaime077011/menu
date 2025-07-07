// Client-safe role definitions and utilities
// This file can be imported in both client and server components

// Super Admin Role Definitions
export enum SuperAdminRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  SUPPORT_ADMIN = "SUPPORT_ADMIN",
}

// Permission interface for type safety
export interface RolePermissions {
  canManageAdmins: boolean;
  canManageRestaurants: boolean;
  canManageSubscriptions: boolean;
  canManagePlans: boolean;
  canViewAnalytics: boolean;
  canViewBilling: boolean;
  canManageSettings: boolean;
  canManageTemplates: boolean;
  canManageKnowledge: boolean;
}

// Default role permissions (fallback)
export const DEFAULT_ROLE_PERMISSIONS: Record<SuperAdminRole, RolePermissions> = {
  [SuperAdminRole.SUPER_ADMIN]: {
    // Full access to everything
    canManageAdmins: true,
    canManageRestaurants: true,
    canManageSubscriptions: true,
    canManagePlans: true,
    canViewAnalytics: true,
    canViewBilling: true,
    canManageSettings: true,
    canManageTemplates: true,
    canManageKnowledge: true,
  },
  [SuperAdminRole.SUPPORT_ADMIN]: {
    // Limited access for customer support
    canManageAdmins: false,
    canManageRestaurants: true, // Can help with restaurant issues
    canManageSubscriptions: true, // Can help with subscription issues
    canManagePlans: false, // Cannot create/modify plans
    canViewAnalytics: true, // Can view analytics for support
    canViewBilling: false, // Cannot access billing details
    canManageSettings: false, // Cannot change system settings
    canManageTemplates: false, // Cannot create/modify templates
    canManageKnowledge: true, // Can manage knowledge base for support
  },
};

// Legacy compatibility - alias for existing code
export const ROLE_PERMISSIONS = DEFAULT_ROLE_PERMISSIONS;

// Cache for database permissions
let permissionsCache: Map<string, RolePermissions> | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get permissions from database with fallback to defaults
export async function getRolePermissions(role: string): Promise<RolePermissions> {
  // Check cache first
  if (permissionsCache && Date.now() < cacheExpiry) {
    const cached = permissionsCache.get(role);
    if (cached) {
      return cached;
    }
  }

  // Try to fetch from database (server-side only)
  if (typeof window === 'undefined') {
    try {
      const { db } = await import('@/server/db');
      const rolePermission = await db.rolePermission.findUnique({
        where: { role },
      });

      if (rolePermission) {
        const permissions = JSON.parse(rolePermission.permissions) as RolePermissions;
        
        // Update cache
        if (!permissionsCache) {
          permissionsCache = new Map();
        }
        permissionsCache.set(role, permissions);
        cacheExpiry = Date.now() + CACHE_DURATION;
        
        return permissions;
      }
    } catch (error) {
      console.warn('Failed to fetch role permissions from database, using defaults:', error);
    }
  }

  // Fallback to default permissions
  const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role as SuperAdminRole];
  return defaultPermissions || DEFAULT_ROLE_PERMISSIONS[SuperAdminRole.SUPPORT_ADMIN];
}

// Clear permissions cache (useful when permissions are updated)
export function clearPermissionsCache(): void {
  permissionsCache = null;
  cacheExpiry = 0;
}

// Helper function to check if user has permission (updated to use database)
export async function hasPermissionAsync(userRole: string, permission: keyof RolePermissions): Promise<boolean> {
  if (!Object.values(SuperAdminRole).includes(userRole as SuperAdminRole)) {
    return false;
  }
  
  try {
    const rolePermissions = await getRolePermissions(userRole);
    return rolePermissions[permission] || false;
  } catch (error) {
    console.error(`Error in hasPermissionAsync for ${userRole}:`, error);
    return false;
  }
}

// Synchronous version for client-side usage (uses default permissions)
export function hasPermission(userRole: string, permission: keyof RolePermissions): boolean {
  if (!Object.values(SuperAdminRole).includes(userRole as SuperAdminRole)) {
    return false;
  }
  
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[userRole as SuperAdminRole];
  return rolePermissions[permission] || false;
}

// Get user-friendly role name
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case SuperAdminRole.SUPER_ADMIN:
      return "Super Admin";
    case SuperAdminRole.SUPPORT_ADMIN:
      return "Support Admin";
    default:
      return role;
  }
}

// Get role description
export function getRoleDescription(role: string): string {
  switch (role) {
    case SuperAdminRole.SUPER_ADMIN:
      return "Full platform access and management";
    case SuperAdminRole.SUPPORT_ADMIN:
      return "Customer support and assistance";
    default:
      return "Unknown role";
  }
}

// Get role color for UI
export function getRoleColor(role: string): { bg: string; text: string; border: string } {
  switch (role) {
    case SuperAdminRole.SUPER_ADMIN:
      return {
        bg: "bg-amber-500/20",
        text: "text-amber-500",
        border: "border-amber-400/30"
      };
    case SuperAdminRole.SUPPORT_ADMIN:
      return {
        bg: "bg-blue-500/20",
        text: "text-blue-500",
        border: "border-blue-400/30"
      };
    default:
      return {
        bg: "bg-gray-500/20",
        text: "text-gray-500",
        border: "border-gray-400/30"
      };
  }
} 