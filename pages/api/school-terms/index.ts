// /pages/api/school-terms/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db"; // adjust path as needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { school_year, semester } = req.body;

  if (!school_year || !semester) {
    return res.status(400).json({ error: "Missing school year or semester" });
  }

  try {
    // ❗ Check for duplicates
    const [existing] = await db.query(
      "SELECT * FROM school_terms WHERE school_year = ? AND semester = ?",
      [school_year, semester]
    );

    if ((existing as any[]).length > 0) {
      return res.status(409).json({ error: "This term already exists." });
    }

    // Insert if no duplicate
    await db.query(
      "INSERT INTO school_terms (school_year, semester) VALUES (?, ?)",
      [school_year, semester]
    );

    return res.status(201).json({ message: "Term created successfully." });
  } catch (err) {
    console.error("Error adding school term:", err);
    return res.status(500).json({ error: "Failed to add school term." });
  }
}
