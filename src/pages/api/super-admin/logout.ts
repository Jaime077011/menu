import { type NextApiRequest, type NextApiResponse } from "next";
import { 
  verifySuperAdminSession, 
  revokeSuperAdminSession,
  logSuperAdminActivity 
} from "@/utils/superAdminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cookies = req.headers.cookie || "";
    const token = cookies.match(/super-admin-token=([^;]+)/)?.[1];

    if (token) {
      const session = await verifySuperAdminSession(token);
      
      if (session) {
        // Revoke the session in database
        await revokeSuperAdminSession(session.sessionId);
        
        // Log logout activity
        await logSuperAdminActivity(session.id, "LOGOUT", {
          ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
          userAgent: req.headers["user-agent"],
        });
      }
    }

    // Clear the HTTP-only cookie
    res.setHeader(
      "Set-Cookie",
      `super-admin-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Super admin logout error:", error);
    
    // Still clear the cookie even if there's an error
    res.setHeader(
      "Set-Cookie",
      `super-admin-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );
    
    res.status(200).json({ success: true });
  }
} 