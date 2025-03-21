import { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db"; // Adjust path based on your project structure

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    console.log("✅ Fetching all files...");

    // Fetch files from the database, including upload_date
    const [rows]: any = await pool.query(
      "SELECT id, file_name, file_path, upload_date FROM files WHERE deleted_at IS NULL OR recycle_bin = 0"
    );

    console.log("✅ Database query executed. Rows returned:", rows);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "No files found" });
    }

    return res.status(200).json({ files: rows });
  } catch (error: any) {
    console.error("❌ Error fetching files:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
