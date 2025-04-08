// pages/api/appointments/unseen-count.ts
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [rows] = await db.query("SELECT COUNT(*) AS count FROM appointments WHERE is_seen = FALSE");
    const count = Array.isArray(rows) ? (rows[0] as any).count : 0;        
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching unseen appointments:", error);
    res.status(500).json({ error: "Failed to fetch unseen appointments." });
  }
}
