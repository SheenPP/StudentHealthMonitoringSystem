import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File, Files } from "formidable";
import fs from "fs";
import path from "path";
import db from "../../lib/db";

export const config = {
  api: {
    bodyParser: false, // Required for formidable
  },
};

const uploadDir = path.join(process.cwd(), "public/log-uploads");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    multiples: false,
    uploadDir,
    keepExtensions: true,
    allowEmptyFiles: false,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });

  form.parse(req, async (err: any, fields: formidable.Fields, files: Files) => {
    if (err) {
      console.error("Formidable parse error:", err);
      return res.status(500).json({ error: "File upload error", details: err.message });
    }

    let file = files.file as File | File[] | undefined;
    if (!file) {
      console.error("No file found in upload");
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (Array.isArray(file)) {
      file = file[0]; // Take the first file
    }

    if (!file.originalFilename) {
      return res.status(400).json({ error: "Invalid file" });
    }

    // Generate new filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileExtension = path.extname(file.originalFilename);
    const newFileName = `${timestamp}${fileExtension}`;
    const newPath = path.join(uploadDir, newFileName);

    try {
      fs.renameSync(file.filepath, newPath);
      const relativePath = `/log-uploads/${newFileName}`;

      await db.query("INSERT INTO logs (image_url, filename) VALUES (?, ?)", [
        relativePath,
        file.originalFilename,
      ]);

      return res.status(200).json({ success: true, imageUrl: relativePath });
    } catch (error: any) {
      console.error("File processing error:", error);
      return res.status(500).json({ error: "File processing error", details: error.message });
    }
  });
}
