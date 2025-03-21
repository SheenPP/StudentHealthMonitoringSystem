import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [pendingAdmins] = await pool.query(
      "SELECT admin_id, username, email, position FROM admin_accounts WHERE status = 'pending'"
    );

    res.status(200).json(pendingAdmins);
  } catch (error) {
    console.error("Error fetching pending admins:", error);
    res.status(500).json({ error: "Server error" });
  }
}
