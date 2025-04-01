// /pages/api/logs/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";
import db from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!id) {
    return res.status(400).json({ error: "Missing ID" });
  }

  try {
    // 1. Get the image_url before deleting
    const [rows] = await db.query("SELECT image_url FROM logs WHERE id = ?", [id]);
    const log = (rows as any)[0];

    if (!log) {
      return res.status(404).json({ error: "Image not found" });
    }

    const imagePath = path.join(process.cwd(), "public", log.image_url);

    // 2. Delete from DB
    await db.query("DELETE FROM logs WHERE id = ?", [id]);

    // 3. Delete the file if it exists
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: "Failed to delete log" });
  }
}
