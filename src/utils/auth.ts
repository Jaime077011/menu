import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";

const JWT_SECRET = process.env.AUTH_SECRET || "your-super-secret-jwt-key-for-development-only";

export interface AdminSession {
  id: string;
  email: string;
  restaurantId: string;
  restaurantName: string;
  role: "admin";
}

export async function verifyAdminCredentials(email: string, password: string): Promise<AdminSession | null> {
  try {
    const adminUser = await db.adminUser.findUnique({
      where: { email },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    if (!adminUser) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, adminUser.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    return {
      id: adminUser.id,
      email: adminUser.email,
      restaurantId: adminUser.restaurantId,
      restaurantName: adminUser.restaurant.name,
      role: "admin",
    };
  } catch (error) {
    console.error("Admin credential verification error:", error);
    return null;
  }
}

export function createAdminToken(session: AdminSession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAdminToken(token: string): AdminSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminSession;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getAdminSessionFromCookies(cookies: string): AdminSession | null {
  const authCookie = cookies
    .split(";")
    .find((c) => c.trim().startsWith("admin-token="));
  
  if (!authCookie) {
    return null;
  }

  const token = authCookie.split("=")[1];
  if (!token) {
    return null;
  }
  
  return verifyAdminToken(token);
} 