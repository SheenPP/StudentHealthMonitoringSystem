import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db"; // Adjust this if your DB import path is different

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Missing appointment ID" });
  }

  try {
    await db.query("UPDATE appointments SET status = 'done' WHERE id = ?", [id]);
    return res.status(200).json({ message: "Appointment marked as done." });
  } catch (error) {
    console.error("❌ Database error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
