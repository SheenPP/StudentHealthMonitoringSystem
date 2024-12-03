import db from "../../lib/db";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // Fetch all files currently in the recycle bin
      const [archives] = await db.query(
        "SELECT id, file_name, file_path, deleted_by, deleted_at, consultation_type FROM files WHERE recycle_bin = 1 ORDER BY deleted_at DESC"
      );
      return res.status(200).json(archives);
    }

    if (req.method === "POST") {
      console.log("POST Request Received");

      // Parse the request body
      let body = req.body;
      if (!body || typeof body !== "object") {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        body = JSON.parse(Buffer.concat(chunks).toString());
      }

      console.log("Parsed Body:", body);

      const { action, file_id } = body;

      // Log missing parameters explicitly
      if (!action) console.error("Missing action parameter");
      if (!file_id) console.error("Missing file_id parameter");

      if (!action || !file_id) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Fetch file details from the database
      const [fileResult] = await db.query("SELECT * FROM files WHERE id = ?", [file_id]);
      if (fileResult.length === 0) {
        console.error("File not found");
        return res.status(404).json({ error: "File not found" });
      }

      const file = fileResult[0];
      const recycleBinPath = path.join(process.cwd(), "public", "recycle_bin", path.basename(file.file_path));
      const originalPath = path.join(process.cwd(), "public", file.file_path);

      if (action === "restore") {
        // Move the file back to its original location
        try {
          if (fs.existsSync(recycleBinPath)) {
            const originalDir = path.dirname(originalPath);
            if (!fs.existsSync(originalDir)) {
              fs.mkdirSync(originalDir, { recursive: true });
            }
            fs.renameSync(recycleBinPath, originalPath);
            console.log(`File restored to its original path: ${originalPath}`);
          } else {
            console.error("File not found in recycle bin");
            return res.status(404).json({ error: "File not found in recycle bin" });
          }
        } catch (err) {
          console.error("Error restoring file:", err);
          return res.status(500).json({ error: "Error restoring file", details: err.message });
        }

        // Update the `files` table to mark the file as active
        await db.query(
          "UPDATE files SET recycle_bin = 0, deleted_by = NULL, deleted_at = NULL WHERE id = ?",
          [file_id]
        );

        return res.status(200).json({ message: "File restored successfully" });
      }

      if (action === "delete") {
        // Permanently delete the file
        try {
          if (fs.existsSync(recycleBinPath)) {
            fs.unlinkSync(recycleBinPath);
            console.log(`File permanently deleted: ${recycleBinPath}`);
          } else {
            console.error("File not found in recycle bin for permanent deletion");
            return res.status(404).json({ error: "File not found in recycle bin" });
          }
        } catch (err) {
          console.error("Error deleting file permanently:", err);
          return res.status(500).json({ error: "Error deleting file", details: err.message });
        }

        // Permanently delete the file record from the database
        await db.query("DELETE FROM files WHERE id = ?", [file_id]);

        return res.status(200).json({ message: "File deleted permanently" });
      }

      return res.status(400).json({ error: "Invalid action" });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    console.error("Error handling recycle bin API:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}