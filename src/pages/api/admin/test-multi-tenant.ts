import { type NextApiRequest, type NextApiResponse } from "next";
import { getAdminSessionFromCookies } from "@/utils/auth";
import { runAllMultiTenantTests } from "@/utils/test-multi-tenant";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Check admin authentication
  const cookies = req.headers.cookie || "";
  const adminSession = getAdminSessionFromCookies(cookies);

  if (!adminSession) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Capture console output
    const originalLog = console.log;
    const logs: string[] = [];
    
    console.log = (...args) => {
      logs.push(args.join(" "));
      originalLog(...args);
    };

    // Run the tests
    await runAllMultiTenantTests();

    // Restore console.log
    console.log = originalLog;

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("Multi-tenant test error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      logs: ["❌ Error running tests: " + (error instanceof Error ? error.message : "Unknown error")],
    });
  }
} 