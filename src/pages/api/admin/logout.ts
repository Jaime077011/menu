import { type NextApiRequest, type NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Clear the auth cookie
  res.setHeader(
    "Set-Cookie",
    "admin-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
  );

  res.status(200).json({ success: true });
} 