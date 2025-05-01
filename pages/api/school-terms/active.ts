import { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db";
import { RowDataPacket } from "mysql2";

interface ActiveTerm extends RowDataPacket {
  id: number;
  school_year: string;
  semester: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [rows] = await db.query<ActiveTerm[]>(
      "SELECT * FROM school_terms WHERE is_active = 1 LIMIT 1"
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No active school term found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching active term:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
