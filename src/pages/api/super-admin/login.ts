import { type NextApiRequest, type NextApiResponse } from "next";
import { z } from "zod";
import { compare } from "bcryptjs";
import { db } from "@/server/db";
import { 
  createSuperAdminSession, 
  checkRateLimit, 
  logSuperAdminActivity 
} from "@/utils/superAdminAuth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // Get client IP for rate limiting
    const clientIP = (req.headers["x-forwarded-for"] as string) || 
                     req.connection.remoteAddress || 
                     "unknown";

    // Check rate limiting (5 attempts per 15 minutes per IP)
    if (!checkRateLimit(clientIP)) {
      await logSuperAdminActivity("system", "RATE_LIMITED", {
        ip: clientIP,
        email,
        userAgent: req.headers["user-agent"],
      });
      
      return res.status(429).json({ 
        error: "Too many login attempts. Please try again in 15 minutes." 
      });
    }

    // Find super admin by email
    const superAdmin = await db.superAdmin.findUnique({
      where: { email },
    });

    if (!superAdmin || !superAdmin.isActive) {
      await logSuperAdminActivity("system", "LOGIN_FAILED", {
        email,
        reason: "User not found or inactive",
        ip: clientIP,
        userAgent: req.headers["user-agent"],
      });
      
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await compare(password, superAdmin.passwordHash);
    if (!isValidPassword) {
      await logSuperAdminActivity(superAdmin.id, "LOGIN_FAILED", {
        email,
        reason: "Invalid password",
        ip: clientIP,
        userAgent: req.headers["user-agent"],
      });
      
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create secure session
    const { token } = await createSuperAdminSession(superAdmin.id);

    // Update last login time
    await db.superAdmin.update({
      where: { id: superAdmin.id },
      data: { lastLoginAt: new Date() },
    });

    // Log successful login
    await logSuperAdminActivity(superAdmin.id, "LOGIN_SUCCESS", {
      email,
      ip: clientIP,
      userAgent: req.headers["user-agent"],
    });

    // Set HTTP-only secure cookie
    res.setHeader(
      "Set-Cookie",
      `super-admin-token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );

    res.status(200).json({
      success: true,
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: superAdmin.role,
      },
    });
  } catch (error) {
    console.error("Super admin login error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
} 