import { NextApiRequest, NextApiResponse } from "next";
import pool from "../../lib/db";
import { RowDataPacket } from "mysql2";

interface FileRow extends RowDataPacket {
  id: number;
  file_name: string;
  file_path: string;
  upload_date: string;
  consultation_type?: string; // Include if applicable
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const consultationType = req.query.consultationType as string;
    const search = req.query.search as string;

    let whereClauses: string[] = ["(deleted_at IS NULL OR recycle_bin = 0)"];
    let queryParams: any[] = [];

    // Add consultation type filter if present
    if (consultationType) {
      whereClauses.push("consultation_type = ?");
      queryParams.push(consultationType);
    }

    // Add search filter for file name or ID
    if (search) {
      whereClauses.push("(file_name LIKE ? OR id LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Get total matching records
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM files ${whereSql}`,
      queryParams
    );
    const totalFiles = countRows[0].total;
    const totalPages = Math.ceil(totalFiles / limit);

    // Get paginated, filtered results
    const [rows] = await pool.query<FileRow[]>(
      `SELECT id, file_name, file_path, upload_date, consultation_type 
       FROM files 
       ${whereSql}
       ORDER BY upload_date DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return res.status(200).json({
      files: rows,
      totalFiles,
      totalPages,
      currentPage: page,
    });
  } catch (error: unknown) {
    console.error("❌ Error fetching files:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
}
