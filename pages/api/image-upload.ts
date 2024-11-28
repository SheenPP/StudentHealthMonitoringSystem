import formidable from "formidable";
import fs from "fs";
import path from "path";
import db from "../../lib/db";

export const config = {
  api: {
    bodyParser: false, // Required for formidable
  },
};

const uploadDir = path.join(process.cwd(), "public/log-uploads");

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      multiples: false, // Ensure single file uploads
      uploadDir,
      keepExtensions: true,
      allowEmptyFiles: false,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
    });

    form.parse(req, async (err, fields, files) => {
      console.log("Parsed files object:", files); // Debug files object

      if (err) {
        console.error("Formidable parse error:", err);
        return res.status(500).json({ error: "File upload error", details: err.message });
      }

      let file = files.file;
      if (Array.isArray(file)) {
        file = file[0]; // Extract the first file if it's an array
      }

      if (!file || !file.originalFilename) {
        console.error("No valid file uploaded:", files);
        return res.status(400).json({ error: "No valid file uploaded" });
      }

      // Generate unique filename
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
      } catch (error) {
        console.error("File processing error:", error);
        return res.status(500).json({ error: "File processing error", details: error.message });
      }
    });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
