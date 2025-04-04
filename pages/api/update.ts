import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parseCookies } from 'nookies';
import pool from '../../lib/db';
import { IncomingForm, type Fields, type Files, type File as FormidableFile } from 'formidable';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import supabase from '../../lib/supabase';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  req.setTimeout(30_000);
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

      const file_id = Array.isArray(fields.file_id) ? fields.file_id[0] : fields.file_id;
      const student_id = Array.isArray(fields.student_id) ? fields.student_id[0] : fields.student_id;
      const consultation_type = Array.isArray(fields.consultation_type) ? fields.consultation_type[0] : fields.consultation_type;
      const file = Array.isArray(files.file) ? files.file[0] : (files.file as FormidableFile);

      if (!file_id || !student_id || !consultation_type || !file) return res.status(400).json({ error: 'Missing data' });

      const [fileResult] = await pool.query<RowDataPacket[]>('SELECT * FROM files WHERE id = ?', [file_id]);
      if (fileResult.length === 0) return res.status(404).json({ error: 'File not found' });

      const oldFile = fileResult[0];
      const oldKey = decodeURIComponent(oldFile.file_path.replace(
        'https://srtpakjpnnmtgumqiujf.supabase.co/storage/v1/object/public/files/', ''
      ));

      await pool.query(
        `INSERT INTO recycle_bin (file_id, file_name, deleted_by, deleted_at)
         VALUES (?, ?, ?, NOW())`,
        [file_id, oldFile.file_name, username]
      );
      await supabase.storage.from('files').remove([oldKey]);

      // ✅ New logic for readable filename
      const originalName = file.originalFilename || 'uploaded_file.pdf';
      const fileExt = originalName.split('.').pop()?.toLowerCase() || 'pdf';

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
      const newKey = `${consultation_type}/${fileName}`;
      const fileBuffer = fs.readFileSync(file.filepath);

      const { error: uploadError } = await supabase.storage.from('files').upload(newKey, fileBuffer, {
        contentType: file.mimetype || 'application/octet-stream',
      });

      if (uploadError) return res.status(500).json({ error: 'Upload failed', details: uploadError.message });

      const { data: publicUrlData } = supabase.storage.from('files').getPublicUrl(newKey);
      const newUrl = publicUrlData.publicUrl;

      const [updateResult] = await pool.query<ResultSetHeader>(
        `UPDATE files SET file_path = ?, file_name = ?, last_edit_date = NOW(), edited_by = ? WHERE id = ?`,
        [newUrl, fileName, username, file_id]
      );

      await pool.query(
        `INSERT INTO file_history (file_id, student_id, action, user, timestamp, file_name, consultation_type)
         VALUES (?, ?, 'Replaced with new file', ?, NOW(), ?, ?)`,
        [file_id, student_id, username, fileName, consultation_type]
      );

      return res.status(200).json({ message: 'File updated successfully', fileUrl: newUrl });
    });
  } catch (err) {
    return res.status(500).json({ error: 'Unexpected server error', details: err instanceof Error ? err.message : String(err) });
  }
}
