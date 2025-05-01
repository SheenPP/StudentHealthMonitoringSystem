import { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, user_id } = req.body;

  if (!email || !user_id) {
    return res.status(400).json({ error: "Missing email or user_id" });
  }

  try {
    // Optional: Protect this with admin token like getUserProfile
    const token = req.cookies["adminAuthToken"];
    if (!token) return res.status(403).json({ error: "Not authorized" });

    const decoded = jwt.verify(token, SECRET_KEY) as { role: string };
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Only assign user_id if not yet set
    const [result] = await db.execute(
      `UPDATE accounts SET user_id = ? WHERE email = ? AND (user_id IS NULL OR user_id = '')`,
      [user_id, email]
    );

    return res.status(200).json({ message: "user_id assigned successfully" });
  } catch (error) {
    console.error("Error assigning user_id:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
