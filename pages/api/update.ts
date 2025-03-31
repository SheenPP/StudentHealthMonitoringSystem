import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';
import { getCookie } from 'cookies-next';
import fs from 'fs';
import path from 'path';
import { IncomingForm, type Fields } from 'formidable';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const rawUserId = getCookie('user_id', { req, res });
    const userId = rawUserId ? String(rawUserId) : null;

    if (!userId) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    const [userResult] = await pool.query<RowDataPacket[]>(
      'SELECT username FROM users WHERE id = ?',
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const username = userResult[0].username;

    if (req.method === 'POST') {
      const form = new IncomingForm();

      form.parse(req, async (err: Error | null, fields: Fields) => {
        if (err) {
          return res.status(500).json({ error: 'Error parsing form data', details: err.message });
        }

        const file_id = Array.isArray(fields.file_id) ? fields.file_id[0] : fields.file_id;
        const new_file = Array.isArray(fields.new_file) ? fields.new_file[0] : fields.new_file;
        const student_id = Array.isArray(fields.student_id) ? fields.student_id[0] : fields.student_id;
        const consultation_type = Array.isArray(fields.consultation_type)
          ? fields.consultation_type[0]
          : fields.consultation_type;

        if (!file_id || !new_file) {
          return res.status(400).json({ error: 'File ID and new file are required' });
        }

        const fileExtension = path.extname(new_file);
        const originalName = path.basename(new_file, fileExtension);
        const newFileName = `${originalName}${fileExtension}`;

        const [fileResult] = await pool.query<RowDataPacket[]>(
          'SELECT * FROM files WHERE id = ?',
          [file_id]
        );

        if (fileResult.length === 0) {
          return res.status(404).json({ error: 'File not found' });
        }

        const file = fileResult[0];
        const oldFilePath = path.join(process.cwd(), 'public', file.file_path);

        const recycleBinDir = path.join(process.cwd(), 'public', 'recycle_bin');
        if (!fs.existsSync(recycleBinDir)) {
          fs.mkdirSync(recycleBinDir, { recursive: true });
        }

        const recycleFilePath = path.join(recycleBinDir, path.basename(oldFilePath));

        try {
          fs.renameSync(oldFilePath, recycleFilePath);
        } catch (moveErr) {
          return res.status(500).json({
            error: 'Error moving old file to recycle bin',
            details: moveErr instanceof Error ? moveErr.message : 'Unknown error',
          });
        }

        await pool.query(
          `INSERT INTO recycle_bin (file_id, file_name, deleted_by, deleted_at)
           VALUES (?, ?, ?, NOW())`,
          [file_id, file.file_name, username]
        );

        const newFileTempPath = path.join(process.cwd(), 'public', 'temp', new_file);
        const newFilePath = path.join(process.cwd(), 'public', 'files', newFileName);

        fs.renameSync(newFileTempPath, newFilePath);

        const [updateResult] = await pool.query<ResultSetHeader>(
          `UPDATE files
           SET file_path = ?, updated_at = NOW(), updated_by = ?
           WHERE id = ?`,
          [`upload/${newFileName}`, username, file_id]
        );

        if (updateResult.affectedRows === 0) {
          return res.status(500).json({ error: 'Failed to update file record' });
        }

        await pool.query(
          `INSERT INTO file_history (file_id, student_id, action, user, timestamp, file_name, consultation_type)
           VALUES (?, ?, 'Replaced with new file', ?, NOW(), ?, ?)`,
          [file_id, student_id, username, newFileName, consultation_type]
        );

        return res.status(200).json({ message: 'File replaced successfully' });
      });
    } else {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (unexpectedErr) {
    res.status(500).json({
      message: 'Unexpected server error',
      error: unexpectedErr instanceof Error ? unexpectedErr.message : 'Unknown error',
    });
  }
}
