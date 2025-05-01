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

interface JwtPayload {
  userId?: number;
  adminId?: number;
  role: 'admin' | 'user';
  iat?: number;
  exp?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const cookies = parseCookies({ req });
    const token = cookies.authToken || cookies.adminAuthToken;
    if (!token) return res.status(401).json({ error: 'Authorization token is required' });

    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
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

    // 🚀 PUT: Rename user's files in Supabase
    if (req.method === 'PUT') {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    
      const { user_id, new_user_id } = req.body;
    
      if (!user_id || !new_user_id) {
        return res.status(400).json({ error: 'Missing or invalid user ID parameters' });
      }
    
      // rename files in storage
      const { data: fileList, error: listError } = await supabase.storage
        .from('files')
        .list('', { limit: 1000, offset: 0, search: user_id });
    
      if (listError) {
        console.error('Supabase list error:', listError);
        return res.status(500).json({ error: 'Failed to list files', details: listError.message });
      }
    
      const movedFiles: string[] = [];
    
      for (const file of fileList) {
        if (file.name.includes(user_id)) {
          const oldPath = file.name;
          const newPath = oldPath.replace(user_id, new_user_id);
    
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('files')
            .download(oldPath);
    
          if (downloadError || !fileData) {
            console.error(`Error downloading file ${oldPath}:`, downloadError);
            continue;
          }
    
          const { error: uploadError } = await supabase.storage
            .from('files')
            .upload(newPath, fileData, { upsert: true });
    
          if (uploadError) {
            console.error(`Error uploading to new path ${newPath}:`, uploadError);
            continue;
          }
    
          await supabase.storage.from('files').remove([oldPath]);
          movedFiles.push(`${oldPath} → ${newPath}`);
        }
      }
    
      return res.status(200).json({ message: 'Files renamed', movedFiles });
    }
    
    // 📨 POST: Upload a new file
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    const form = new IncomingForm();
    form.parse(req, async (err, fields: Fields, files: Files) => {
      try {
        if (err) {
          console.error('❌ Form parse error:', err);
          return res.status(500).json({ error: 'Form parsing error', details: err.message });
        }

        const userId = fields.user_id?.toString() || 'unknown';
        const consultationType = fields.consultation_type?.toString() || 'default';

        const fileField = files.file;
        const file = Array.isArray(fileField)
          ? fileField[0]
          : fileField
          ? (fileField as FormidableFile)
          : undefined;

        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const allowedExtensions = ['pdf', 'docx'];
        const originalName = file.originalFilename || 'uploaded_file.pdf';
        const fileExt = originalName.split('.').pop()?.toLowerCase() || 'pdf';

        if (!allowedExtensions.includes(fileExt)) {
          return res.status(400).json({ error: 'Invalid file type. Only PDF and DOCX allowed.' });
        }

        const mimeType = file.mimetype || 'application/pdf';

        // Timestamped filename
        const now = new Date();
        const formattedDate = now.toISOString().replace(/[:.]/g, '-');
        const fileName = `${userId}_${consultationType}_${formattedDate}.${fileExt}`;
        const storagePath = `${consultationType}/${fileName}`;
        const fileBuffer = fs.readFileSync(file.filepath);

        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(storagePath, fileBuffer, {
            contentType: mimeType,
          });

        if (uploadError) {
          console.error('❌ Supabase upload error:', uploadError);
          return res.status(500).json({ message: 'Failed to upload to Supabase', error: uploadError.message });
        }

        const { data: publicUrlData } = supabase.storage.from('files').getPublicUrl(storagePath);
        const publicUrl = publicUrlData.publicUrl;

        // Save file info to MySQL
        const [fileInsert] = await pool.query<OkPacket>(
          `INSERT INTO files (file_name, file_path, upload_date, user_id, consultation_type, uploaded_by)
           VALUES (?, ?, NOW(), ?, ?, ?)`,
          [fileName, publicUrl, userId, consultationType, username]
        );

        const fileId = fileInsert.insertId;

        await pool.query(
          `INSERT INTO file_history (file_id, user_id, action, user, timestamp, file_name, consultation_type)
           VALUES (?, ?, 'Uploaded', ?, NOW(), ?, ?)`,
          [fileId, userId, username, fileName, consultationType]
        );

        console.log('✅ Upload completed for:', fileName);
        return res.status(200).json({ message: 'Upload successful', fileUrl: publicUrl });
      } catch (innerError: unknown) {
        console.error('❌ Error inside form.parse:', innerError);
        return res.status(500).json({
          error: 'Internal server error during file processing',
          details: innerError instanceof Error ? innerError.message : String(innerError),
        });
      }
    });
  } catch (err) {
    console.error('❌ Outer error:', err);
    return res.status(500).json({
      error: 'Unexpected server error',
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
