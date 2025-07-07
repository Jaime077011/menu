import { verify, sign } from "jsonwebtoken";
import { db } from "@/server/db";
import { env } from "@/env";
import { type NextApiRequest, type NextApiResponse } from "next";
import { TRPCError } from "@trpc/server";
import { SuperAdminRole, hasPermission, hasPermissionAsync, getRoleDisplayName, getRoleDescription, type RolePermissions } from "@/utils/roles";

const JWT_SECRET = env.AUTH_SECRET ?? "fallback_secret_for_development_only";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds

// Re-export for backward compatibility
export { SuperAdminRole, hasPermission, getRoleDisplayName, getRoleDescription } from "@/utils/roles";

// Helper function to require specific permission (server-only) - synchronous version
export function requirePermission(userRole: string, permission: keyof RolePermissions) {
  if (!hasPermission(userRole, permission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Access denied: ${permission} permission required`,
    });
  }
}

// Helper function to require specific permission (server-only) - asynchronous version with database check
export async function requirePermissionAsync(userRole: string, permission: keyof RolePermissions) {
  const hasAccess = await hasPermissionAsync(userRole, permission);
  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Access denied: ${permission} permission required`,
    });
  }
}

// Helper function to check if user has permission to manage restaurants
export async function requireManageRestaurants(ctx: any) {
  const superAdmin = await getSuperAdminFromContext(ctx);
  
  // Check if user has permission to manage restaurants
  const rolePermission = await ctx.db.rolePermission.findUnique({
    where: { role: superAdmin.role },
  });
  
  let canManageRestaurants = false;
  if (rolePermission) {
    const permissions = JSON.parse(rolePermission.permissions);
    canManageRestaurants = permissions.canManageRestaurants || false;
  } else {
    // Fallback to default permissions
    const { DEFAULT_ROLE_PERMISSIONS } = await import('./roles');
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[superAdmin.role as SuperAdminRole];
    canManageRestaurants = defaultPermissions?.canManageRestaurants || false;
  }
  
  if (!canManageRestaurants) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: 'Access denied: You do not have permission to manage restaurants',
    });
  }
  
  return superAdmin;
}

// Helper function to check if user has permission to view analytics
export async function requireViewAnalytics(ctx: any) {
  const superAdmin = await getSuperAdminFromContext(ctx);
  
  // Check if user has permission to view analytics
  const rolePermission = await ctx.db.rolePermission.findUnique({
    where: { role: superAdmin.role },
  });
  
  let canViewAnalytics = false;
  if (rolePermission) {
    const permissions = JSON.parse(rolePermission.permissions);
    canViewAnalytics = permissions.canViewAnalytics || false;
  } else {
    // Fallback to default permissions
    const { DEFAULT_ROLE_PERMISSIONS } = await import('./roles');
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[superAdmin.role as SuperAdminRole];
    canViewAnalytics = defaultPermissions?.canViewAnalytics || false;
  }
  
  if (!canViewAnalytics) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: 'Access denied: You do not have permission to view analytics',
    });
  }
  
  return superAdmin;
}

// Helper function to check if user has permission to manage admins
export async function requireManageAdmins(ctx: any) {
  const superAdmin = await getSuperAdminFromContext(ctx);
  
  // Check if user has permission to manage admins
  const rolePermission = await ctx.db.rolePermission.findUnique({
    where: { role: superAdmin.role },
  });
  
  let canManageAdmins = false;
  if (rolePermission) {
    const permissions = JSON.parse(rolePermission.permissions);
    canManageAdmins = permissions.canManageAdmins || false;
  } else {
    // Fallback to default permissions
    const { DEFAULT_ROLE_PERMISSIONS } = await import('./roles');
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[superAdmin.role as SuperAdminRole];
    canManageAdmins = defaultPermissions?.canManageAdmins || false;
  }
  
  if (!canManageAdmins) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: 'Access denied: You do not have permission to manage administrators',
    });
  }
  
  return superAdmin;
}

// Helper function to check if user has permission to view billing
export async function requireViewBilling(ctx: any) {
  const superAdmin = await getSuperAdminFromContext(ctx);
  
  // Check if user has permission to view billing
  const rolePermission = await ctx.db.rolePermission.findUnique({
    where: { role: superAdmin.role },
  });
  
  let canViewBilling = false;
  if (rolePermission) {
    const permissions = JSON.parse(rolePermission.permissions);
    canViewBilling = permissions.canViewBilling || false;
  } else {
    // Fallback to default permissions
    const { DEFAULT_ROLE_PERMISSIONS } = await import('./roles');
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[superAdmin.role as SuperAdminRole];
    canViewBilling = defaultPermissions?.canViewBilling || false;
  }
  
  if (!canViewBilling) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: 'Access denied: You do not have permission to view billing information',
    });
  }
  
  return superAdmin;
}

// Helper function to check if user has permission to manage plans
export async function requireManagePlans(ctx: any) {
  const superAdmin = await getSuperAdminFromContext(ctx);
  
  // Check if user has permission to manage plans
  const rolePermission = await ctx.db.rolePermission.findUnique({
    where: { role: superAdmin.role },
  });
  
  let canManagePlans = false;
  if (rolePermission) {
    const permissions = JSON.parse(rolePermission.permissions);
    canManagePlans = permissions.canManagePlans || false;
  } else {
    // Fallback to default permissions
    const { DEFAULT_ROLE_PERMISSIONS } = await import('./roles');
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[superAdmin.role as SuperAdminRole];
    canManagePlans = defaultPermissions?.canManagePlans || false;
  }
  
  if (!canManagePlans) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: 'Access denied: You do not have permission to manage subscription plans',
    });
  }
  
  return superAdmin;
}

// Helper function to check if user has permission to manage settings
export async function requireManageSettings(ctx: any) {
  const superAdmin = await getSuperAdminFromContext(ctx);
  
  // Check if user has permission to manage settings
  const rolePermission = await ctx.db.rolePermission.findUnique({
    where: { role: superAdmin.role },
  });
  
  let canManageSettings = false;
  if (rolePermission) {
    const permissions = JSON.parse(rolePermission.permissions);
    canManageSettings = permissions.canManageSettings || false;
  } else {
    // Fallback to default permissions
    const { DEFAULT_ROLE_PERMISSIONS } = await import('./roles');
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[superAdmin.role as SuperAdminRole];
    canManageSettings = defaultPermissions?.canManageSettings || false;
  }
  
  if (!canManageSettings) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: 'Access denied: You do not have permission to manage settings',
    });
  }
  
  return superAdmin;
}

// Helper function to check if user has permission to manage templates
export async function requireManageTemplates(ctx: any) {
  const superAdmin = await getSuperAdminFromContext(ctx);
  
  // Check if user has permission to manage templates
  const rolePermission = await ctx.db.rolePermission.findUnique({
    where: { role: superAdmin.role },
  });
  
  let canManageTemplates = false;
  if (rolePermission) {
    const permissions = JSON.parse(rolePermission.permissions);
    canManageTemplates = permissions.canManageTemplates || false;
  } else {
    // Fallback to default permissions
    const { DEFAULT_ROLE_PERMISSIONS } = await import('./roles');
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[superAdmin.role as SuperAdminRole];
    canManageTemplates = defaultPermissions?.canManageTemplates || false;
  }
  
  if (!canManageTemplates) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: 'Access denied: You do not have permission to manage templates',
    });
  }
  
  return superAdmin;
}

// Helper function to check if user has permission to manage subscriptions
export async function requireManageSubscriptions(ctx: any) {
  const superAdmin = await getSuperAdminFromContext(ctx);
  
  // Check if user has permission to manage subscriptions
  const rolePermission = await ctx.db.rolePermission.findUnique({
    where: { role: superAdmin.role },
  });
  
  let canManageSubscriptions = false;
  if (rolePermission) {
    const permissions = JSON.parse(rolePermission.permissions);
    canManageSubscriptions = permissions.canManageSubscriptions || false;
  } else {
    // Fallback to default permissions
    const { DEFAULT_ROLE_PERMISSIONS } = await import('./roles');
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[superAdmin.role as SuperAdminRole];
    canManageSubscriptions = defaultPermissions?.canManageSubscriptions || false;
  }
  
  if (!canManageSubscriptions) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: 'Access denied: You do not have permission to manage subscriptions',
    });
  }
  
  return superAdmin;
}

// Helper function to check if user has permission to manage knowledge
export async function requireManageKnowledge(ctx: any) {
  const superAdmin = await getSuperAdminFromContext(ctx);
  
  // Check if user has permission to manage knowledge
  const rolePermission = await ctx.db.rolePermission.findUnique({
    where: { role: superAdmin.role },
  });
  
  let canManageKnowledge = false;
  if (rolePermission) {
    const permissions = JSON.parse(rolePermission.permissions);
    canManageKnowledge = permissions.canManageKnowledge || false;
  } else {
    // Fallback to default permissions
    const { DEFAULT_ROLE_PERMISSIONS } = await import('./roles');
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[superAdmin.role as SuperAdminRole];
    canManageKnowledge = defaultPermissions?.canManageKnowledge || false;
  }
  
  if (!canManageKnowledge) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: 'Access denied: You do not have permission to manage knowledge base',
    });
  }
  
  return superAdmin;
}

export interface SuperAdminSession {
  id: string;
  email: string;
  name?: string;
  role: string;
  sessionId: string;
  iat: number;
  exp: number;
}

// Create secure session with database tracking
export async function createSuperAdminSession(superAdminId: string) {
  // Create session record in database
  const session = await db.superAdminSession.create({
    data: {
      superAdminId,
      expiresAt: new Date(Date.now() + SESSION_DURATION * 1000),
      ipAddress: "unknown", // Will be set by middleware
      userAgent: "unknown", // Will be set by middleware
    },
  });

  const superAdmin = await db.superAdmin.findUnique({
    where: { id: superAdminId },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!superAdmin) {
    throw new Error("Super admin not found");
  }

  // Create JWT with session ID
  const token = sign(
    {
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      role: superAdmin.role,
      sessionId: session.id,
    },
    JWT_SECRET,
    { expiresIn: SESSION_DURATION }
  );

  return { token, session: session.id };
}

// Verify and validate session
export async function verifySuperAdminSession(token: string): Promise<SuperAdminSession | null> {
  try {
    const decoded = verify(token, JWT_SECRET) as SuperAdminSession;
    
    // Check if session exists and is valid in database
    const session = await db.superAdminSession.findUnique({
      where: {
        id: decoded.sessionId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        superAdmin: {
          select: { isActive: true },
        },
      },
    });

    if (!session || !session.superAdmin.isActive) {
      return null;
    }

    // Update last activity
    await db.superAdminSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    return decoded;
  } catch (error) {
    return null;
  }
}

// Revoke session (logout)
export async function revokeSuperAdminSession(sessionId: string) {
  await db.superAdminSession.update({
    where: { id: sessionId },
    data: { 
      isActive: false,
      revokedAt: new Date(),
    },
  });
}

// Revoke all sessions for a super admin (security action)
export async function revokeAllSuperAdminSessions(superAdminId: string) {
  await db.superAdminSession.updateMany({
    where: { 
      superAdminId,
      isActive: true,
    },
    data: { 
      isActive: false,
      revokedAt: new Date(),
    },
  });
}

// Get session from HTTP-only cookie
export async function getSuperAdminSessionFromCookies(cookies: string): Promise<SuperAdminSession | null> {
  const cookieMatch = cookies.match(/super-admin-token=([^;]+)/);
  if (!cookieMatch) return null;
  
  return await verifySuperAdminSession(cookieMatch[1]);
}

// Middleware for protecting super admin routes
export async function requireSuperAdminAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<SuperAdminSession | null> {
  const cookies = req.headers.cookie || "";
  const token = cookies.match(/super-admin-token=([^;]+)/)?.[1];

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }

  const session = await verifySuperAdminSession(token);
  if (!session) {
    res.status(401).json({ error: "Invalid or expired session" });
    return null;
  }

  // Log access for audit trail
  await logSuperAdminActivity(session.id, "API_ACCESS", {
    endpoint: req.url,
    method: req.method,
    ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
  });

  return session;
}

// Audit logging for super admin actions
export async function logSuperAdminActivity(
  superAdminId: string,
  action: string,
  details: Record<string, any> = {}
) {
  try {
    await db.superAdminAuditLog.create({
      data: {
        superAdminId,
        action,
        details: JSON.stringify(details),
        ipAddress: details.ip || "unknown",
        userAgent: details.userAgent || "unknown",
      },
    });
  } catch (error) {
    console.error("Failed to log super admin activity:", error);
  }
}

// Check if setup is required (no super admins exist)
export async function isSetupRequired(): Promise<boolean> {
  const count = await db.superAdmin.count();
  return count === 0;
}

// Rate limiting for super admin login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset if more than 15 minutes have passed
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Allow max 5 attempts per 15 minutes
  if (attempts.count >= 5) {
    return false;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
}

// TRPC context helper for super admin routes
export async function getSuperAdminFromContext(ctx: { req: { headers: { cookie?: string } } }) {
  const cookies = ctx.req.headers.cookie || "";
  const token = cookies.match(/super-admin-token=([^;]+)/)?.[1];

  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Super admin authentication required",
    });
  }

  const session = await verifySuperAdminSession(token);
  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired super admin session",
    });
  }

  return session;
} 