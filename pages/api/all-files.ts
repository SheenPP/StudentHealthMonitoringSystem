import { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db";
import { RowDataPacket } from "mysql2";

// Define the shape of a file row
interface FileRow extends RowDataPacket {
  id: number;
  file_name: string;
  file_path: string;
  upload_date: string; // or `Date` if you prefer
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    console.log("✅ Fetching all files...");

    const [rows] = await pool.query<FileRow[]>(
      "SELECT id, file_name, file_path, upload_date FROM files WHERE deleted_at IS NULL OR recycle_bin = 0"
    );

    console.log("✅ Database query executed. Rows returned:", rows);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "No files found" });
    }

    return res.status(200).json({ files: rows });
  } catch (error: unknown) {
    console.error("❌ Error fetching files:", error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
