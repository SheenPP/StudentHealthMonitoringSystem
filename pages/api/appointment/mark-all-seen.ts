// pages/api/appointments/mark-all-seen.ts
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await db.query("UPDATE appointments SET is_seen = TRUE WHERE is_seen = FALSE");
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error marking appointments as seen:", error);
    res.status(500).json({ error: "Failed to mark as seen." });
  }
}
