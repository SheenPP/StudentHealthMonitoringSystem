import { NextApiRequest, NextApiResponse } from "next";
import db from "../../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing or invalid term ID" });
  }

  try {
    await db.query("UPDATE school_terms SET is_active = 0 WHERE is_active = 1");
    await db.query("UPDATE school_terms SET is_active = 1 WHERE id = ?", [id]);

    return res.status(200).json({ message: "School term activated successfully" });
  } catch (error) {
    console.error("Error activating term:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
