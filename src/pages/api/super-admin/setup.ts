import { type NextApiRequest, type NextApiResponse } from "next";
import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/server/db";
import { isSetupRequired, logSuperAdminActivity } from "@/utils/superAdminAuth";

const setupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  ),
  name: z.string().optional(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Check if setup is required (no super admins exist)
    const setupRequired = await isSetupRequired();
    if (!setupRequired) {
      return res.status(403).json({ 
        error: "Setup not allowed. Super admin already exists." 
      });
    }

    const { email, password, name } = setupSchema.parse(req.body);

    // Hash password with high cost
    const passwordHash = await hash(password, 12);

    // Create the first super admin
    const superAdmin = await db.superAdmin.create({
      data: {
        email,
        passwordHash,
        name,
        role: "SUPER_ADMIN",
      },
    });

    // Log the setup activity
    await logSuperAdminActivity(superAdmin.id, "SETUP_COMPLETED", {
      email,
      ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: "Super admin created successfully",
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
      },
    });
  } catch (error) {
    console.error("Super admin setup error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid input", 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
} 