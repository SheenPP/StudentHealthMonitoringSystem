import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../lib/db";
import { RowDataPacket } from "mysql2";

interface LogRecord extends RowDataPacket {
  id: number;
  image_url: string;
  filename: string;
  uploaded_at: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const [logs] = await db.query<LogRecord[]>(
        "SELECT id, image_url, filename, uploaded_at FROM logs ORDER BY uploaded_at DESC"
      );

      return res.status(200).json(logs);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error fetching logs:", error.message);
      return res.status(500).json({ error: "Failed to fetch logs from the database" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
