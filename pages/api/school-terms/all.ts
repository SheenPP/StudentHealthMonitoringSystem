import { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db";
import { RowDataPacket } from "mysql2";

interface Term extends RowDataPacket {
  id: number;
  school_year: string;
  semester: string;
  is_active: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [rows] = await db.query<Term[]>("SELECT * FROM school_terms ORDER BY created_at DESC");
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching school terms:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
