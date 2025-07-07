import type { NextApiRequest, NextApiResponse } from "next";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Security: Only allow in development or with specific auth
  if (process.env.NODE_ENV === "production" && req.headers.authorization !== `Bearer ${process.env.MIGRATION_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Starting database migration...");
    
    // Run Prisma migration
    const { stdout, stderr } = await execAsync("npx prisma migrate deploy");
    
    console.log("Migration stdout:", stdout);
    if (stderr) console.log("Migration stderr:", stderr);

    // Generate Prisma client
    await execAsync("npx prisma generate");
    
    res.status(200).json({ 
      success: true,
      message: "Database migration completed successfully",
      output: stdout,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Migration failed:", error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : "Migration failed",
      timestamp: new Date().toISOString()
    });
  }
} 