import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../lib/db";
import fs from "fs";
import path from "path";
import { RowDataPacket } from "mysql2";

// ✅ Interface for recycle bin rows
interface RecycleFileRow extends RowDataPacket {
  id: number;
  file_name: string;
  file_path: string;
  deleted_by: string | null;  // ✅ string not number
  deleted_at: string | null;
}

// ✅ Interface for file row lookup
interface FileRow extends RowDataPacket {
  id: number;
  file_name: string;
  file_path: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 🔹 GET: Fetch all deleted files from recycle bin
    if (req.method === "GET") {
      const [archives] = await db.query<RecycleFileRow[]>(
        `SELECT id, file_name, file_path, deleted_by, deleted_at
         FROM files
         WHERE recycle_bin = 1
         ORDER BY deleted_at DESC`
      );

      // Optional: Debug log
      console.log("Fetched archives:", archives);

      return res.status(200).json(archives);
    }

    // 🔹 POST: Restore or permanently delete a file
    if (req.method === "POST") {
      let body = req.body;

      // 🔄 Support raw request body
      if (!body || typeof body !== "object") {
        const chunks: Uint8Array[] = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        body = JSON.parse(Buffer.concat(chunks).toString());
      }

      const { action, file_id } = body;

      if (!action || !file_id) {
        return res.status(400).json({ error: "Missing required parameters: action or file_id" });
      }

      const [fileResult] = await db.query<FileRow[]>(
        "SELECT * FROM files WHERE id = ?",
        [file_id]
      );

      if (fileResult.length === 0) {
        return res.status(404).json({ error: "File not found" });
      }

      const file = fileResult[0];
      const recycleBinPath = path.join(process.cwd(), "public", "recycle_bin", path.basename(file.file_path));
      const originalPath = path.join(process.cwd(), "public", file.file_path);

      if (action === "restore") {
        try {
          if (fs.existsSync(recycleBinPath)) {
            const originalDir = path.dirname(originalPath);
            if (!fs.existsSync(originalDir)) {
              fs.mkdirSync(originalDir, { recursive: true });
            }
            fs.renameSync(recycleBinPath, originalPath);
          } else {
            return res.status(404).json({ error: "File not found in recycle bin" });
          }
        } catch (err: unknown) {
          const error = err as Error;
          return res.status(500).json({ error: "Error restoring file", details: error.message });
        }

        await db.query(
          "UPDATE files SET recycle_bin = 0, deleted_by = NULL, deleted_at = NULL WHERE id = ?",
          [file_id]
        );

        return res.status(200).json({ message: "File restored successfully" });
      }

      if (action === "delete") {
        try {
          if (fs.existsSync(recycleBinPath)) {
            fs.unlinkSync(recycleBinPath);
          } else {
            return res.status(404).json({ error: "File not found in recycle bin" });
          }
        } catch (err: unknown) {
          const error = err as Error;
          return res.status(500).json({ error: "Error deleting file", details: error.message });
        }

        await db.query("DELETE FROM files WHERE id = ?", [file_id]);

        return res.status(200).json({ message: "File deleted permanently" });
      }

      return res.status(400).json({ error: "Invalid action" });
    }

    // 🔸 Handle unsupported methods
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ message: "Method not allowed" });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error handling recycle bin API:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
