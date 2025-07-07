import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Test basic database connection
    await db.$queryRaw`SELECT 1`;
    
    // Test if tables exist
    const tableCheck = await db.$queryRaw`SHOW TABLES`;
    
    res.status(200).json({ 
      status: "healthy", 
      database: "connected",
      tables: Array.isArray(tableCheck) ? tableCheck.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(500).json({ 
      status: "unhealthy", 
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
  }
} 