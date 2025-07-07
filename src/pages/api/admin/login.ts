import { type NextApiRequest, type NextApiResponse } from "next";
import { z } from "zod";
import { verifyAdminCredentials, createAdminToken } from "@/utils/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = loginSchema.parse(req.body);

    const adminSession = await verifyAdminCredentials(email, password);
    if (!adminSession) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createAdminToken(adminSession);

    // Set HTTP-only cookie
    res.setHeader(
      "Set-Cookie",
      `admin-token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );

    res.status(200).json({
      success: true,
      user: adminSession,
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
} 