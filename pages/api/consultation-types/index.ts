// pages/api/consultation-types/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db"; // adjust this to your db config

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const [rows] = await db.query("SELECT * FROM consultation_types ORDER BY id ASC");
      res.status(200).json(rows);
    } else if (req.method === "POST") {
      const { name, for_role } = req.body;

      if (!name || !for_role) {
        return res.status(400).json({ error: "Missing name or role" });
      }

      await db.query("INSERT INTO consultation_types (name, for_role) VALUES (?, ?)", [
        name,
        for_role,
      ]);
      res.status(201).json({ success: true });
    } else {
      res.status(405).end(); // Method Not Allowed
    }
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
}
