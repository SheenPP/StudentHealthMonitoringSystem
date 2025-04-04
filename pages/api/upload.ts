import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parseCookies } from 'nookies';
import { IncomingForm, type Fields, type Files, type File as FormidableFile } from 'formidable';
import fs from 'fs';
import pool from '../../lib/db';
import supabase from '../../lib/supabase';
import type { RowDataPacket, OkPacket } from 'mysql2';

export const config = { api: { bodyParser: false } };
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const cookies = parseCookies({ req });
    const token = cookies.authToken || cookies.adminAuthToken;
    if (!token) return res.status(401).json({ error: 'Authorization token is required' });

    const decoded = jwt.verify(token, SECRET_KEY) as any;
    const id = decoded.userId || decoded.adminId;
    const role = decoded.role;

    let username: string | null = null;
    if (role === 'admin') {
      const [result] = await pool.query<RowDataPacket[]>('SELECT username FROM admin_accounts WHERE admin_id = ?', [id]);
      username = result[0]?.username || null;
    } else {
      const [result] = await pool.query<RowDataPacket[]>('SELECT username FROM users WHERE id = ?', [id]);
      username = result[0]?.username || null;
    }

    if (!username) return res.status(403).json({ error: 'Unauthorized user' });
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    const form = new IncomingForm();
    form.parse(req, async (err, fields: Fields, files: Files) => {
      if (err) return res.status(500).json({ error: 'Form parsing error', details: err.message });

      const student_id = fields.student_id?.toString() || 'unknown';
      const consultation_type = fields.consultation_type?.toString() || 'default';
      const file = Array.isArray(files.file) ? files.file[0] : (files.file as FormidableFile);

      console.log('📄 Consultation Type:', consultation_type);
      console.log('📄 Original File Name:', file?.originalFilename);

      if (!file) return res.status(400).json({ error: 'No file uploaded' });

      const allowedExtensions = ['pdf', 'docx'];
      const originalName = file.originalFilename || 'uploaded_file.pdf';
      const fileExt = originalName.split('.').pop()?.toLowerCase() || 'pdf';

      if (!allowedExtensions.includes(fileExt)) {
        return res.status(400).json({ error: 'Invalid file type. Only PDF and DOCX allowed.' });
      }

      const mimeType = file.mimetype || 'application/pdf';

      // ✅ Format readable timestamp
      const now = new Date();
      const formattedDate = now.toLocaleString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).replace(',', '').replace(/ /g, '-').replace(/:/g, '-');

      const fileName = `${student_id}_${consultation_type}_${formattedDate}.${fileExt}`;
      const storagePath = `${consultation_type}/${fileName}`;
      const fileBuffer = fs.readFileSync(file.filepath);

      const { error: uploadError } = await supabase.storage.from('files').upload(storagePath, fileBuffer, {
        contentType: mimeType,
      });

      if (uploadError) {
        return res.status(500).json({ message: 'Failed to upload to Supabase', error: uploadError.message });
      }

      const { data: publicUrlData } = supabase.storage.from('files').getPublicUrl(storagePath);
      const publicUrl = publicUrlData.publicUrl;

      const [fileInsert] = await pool.query<OkPacket>(
        `INSERT INTO files (file_name, file_path, upload_date, student_id, consultation_type, uploaded_by)
         VALUES (?, ?, NOW(), ?, ?, ?)`,
        [fileName, publicUrl, student_id, consultation_type, username]
      );

      const fileId = fileInsert.insertId;

      await pool.query(
        `INSERT INTO file_history (file_id, student_id, action, user, timestamp, file_name, consultation_type)
         VALUES (?, ?, 'Uploaded', ?, NOW(), ?, ?)`,
        [fileId, student_id, username, fileName, consultation_type]
      );

      return res.status(200).json({ message: 'Upload successful', fileUrl: publicUrl });
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Unexpected server error',
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
