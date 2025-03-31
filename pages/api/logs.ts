import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../lib/db";

interface LogRecord {
  id: number;
  image_url: string;
  filename: string;
  uploaded_at: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const result = await db.query(
        "SELECT id, image_url, filename, uploaded_at FROM logs ORDER BY uploaded_at DESC"
      );
      const logs = result[0] as LogRecord[];
      return res.status(200).json(logs);
    } catch (err: any) {
      console.error("Error fetching logs:", err.message);
      return res.status(500).json({ error: "Failed to fetch logs from the database" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
