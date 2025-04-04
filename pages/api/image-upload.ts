import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File, Files } from "formidable";
import fs from "fs";
import db from "../../lib/db";
import supabase from "../../lib/supabase";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const form = formidable({
    multiples: false,
    keepExtensions: true,
    allowEmptyFiles: false,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });

  form.parse(req, async (err: unknown, fields: formidable.Fields, files: Files) => {
    if (err) {
      const parseError = err as Error;
      console.error("Formidable parse error:", parseError);
      return res.status(500).json({ error: "File upload error", details: parseError.message });
    }

    let file = files.file as File | File[] | undefined;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (Array.isArray(file)) {
      file = file[0];
    }

    if (!file.originalFilename || !file.filepath) {
      return res.status(400).json({ error: "Invalid file" });
    }

    const fileBuffer = fs.readFileSync(file.filepath);
    const fileExt = file.originalFilename.split(".").pop();

    // 📅 Generate filename in Month-Day-Year_Hour-MinuteAM/PM format
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    const formatted = now
      .toLocaleString("en-US", options)
      .replace(",", "")         // Remove comma after date
      .replace(/ /g, "-")       // Replace spaces with hyphens
      .replace(/:/g, "-");      // Replace colon with hyphen

    const fileName = `${formatted}.${fileExt}`;

    // 📤 Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("log-uploads") // 🔁 Your Supabase bucket name
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype || "application/octet-stream",
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res.status(500).json({ error: "Upload to storage failed", details: uploadError.message });
    }

    // 🔗 Get public URL
    const { data } = supabase.storage.from("log-uploads").getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    // 💾 Save to database: public URL + new filename
    await db.query("INSERT INTO logs (image_url, filename) VALUES (?, ?)", [
      publicUrl,
      fileName,
    ]);

    return res.status(200).json({ success: true, imageUrl: publicUrl });
  });
}
