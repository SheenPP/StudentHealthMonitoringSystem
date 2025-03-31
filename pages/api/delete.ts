import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';
import { getCookie } from 'cookies-next';
import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';

export const config = {
  api: {
    bodyParser: false, // let formidable handle the form data
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Request method:', req.method);

    const rawUserId = await getCookie('user_id', { req, res });
    const userId = rawUserId ? String(rawUserId) : null;
    console.log('Resolved user ID from cookie:', userId);

    if (!userId) {
      console.error('Authorization token is missing or invalid');
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    const [userResult] = await pool.query(
      'SELECT username FROM users WHERE id = ?',
      [userId]
    ) as [Array<{ username: string }>, any];

    if (userResult.length === 0) {
      console.error(`Invalid user for ID: ${userId}`);
      return res.status(401).json({ error: 'Invalid user' });
    }

    const username = userResult[0].username;
    console.log('Resolved username:', username);

    if (req.method === 'POST') {
      const form = new IncomingForm();

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Error parsing form data:', err);
          return res.status(500).json({ error: 'Error parsing form data', details: (err as Error).message });
        }

        // helper to safely extract field values
        const getSingleField = (value: string | string[] | undefined): string => {
          if (Array.isArray(value)) return value[0];
          return value ?? '';
        };

        const file_id = getSingleField(fields.file_id);
        const file_path = getSingleField(fields.file_path);
        const student_id = getSingleField(fields.student_id);
        const consultation_type = getSingleField(fields.consultation_type);

        if (!file_id) {
          return res.status(400).json({ error: 'File ID is required' });
        }

        const [fileResult] = await pool.query(
          'SELECT * FROM files WHERE id = ?',
          [file_id]
        ) as [Array<{ id: number; file_name: string; file_path: string }>, any];

        if (fileResult.length === 0) {
          return res.status(404).json({ error: 'File not found' });
        }

        const file = fileResult[0];
        const filePath = path.join(process.cwd(), 'public', file.file_path);

        const recycleBinDir = path.join(process.cwd(), 'public', 'recycle_bin');
        if (!fs.existsSync(recycleBinDir)) {
          fs.mkdirSync(recycleBinDir, { recursive: true });
        }

        const recycleFilePath = path.join(recycleBinDir, path.basename(filePath));

        try {
          fs.renameSync(filePath, recycleFilePath);
          console.log('File moved to recycle bin:', recycleFilePath);
        } catch (moveErr: unknown) {
          const error = moveErr as Error;
          console.error('Error moving file to recycle bin:', error);
          return res.status(500).json({ error: 'Error moving file to recycle bin', details: error.message });
        }

        // Update file record
        const updateQuery = `
          UPDATE files
          SET deleted_by = ?, deleted_at = NOW(), file_path = ?, recycle_bin = 1
          WHERE id = ?
        `;
        const updateValues = [username, `recycle_bin/${path.basename(filePath)}`, file_id];
        await pool.query(updateQuery, updateValues);

        // Insert into file history
        const historyQuery = `
          INSERT INTO file_history (file_id, student_id, action, user, timestamp, file_name, consultation_type)
          VALUES (?, ?, 'Moved to Recycle Bin', ?, NOW(), ?, ?)
        `;
        const historyValues = [file_id, student_id, username, file.file_name, consultation_type];
        await pool.query(historyQuery, historyValues);

        // Insert into recycle_bin table
        const recycleBinQuery = `
          INSERT INTO recycle_bin (file_id, file_name, deleted_by, deleted_at)
          VALUES (?, ?, ?, NOW())
        `;
        const recycleBinValues = [file_id, file.file_name, username];
        await pool.query(recycleBinQuery, recycleBinValues);

        return res.status(200).json({ message: 'File moved to recycle bin successfully' });
      });
    } else {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (unexpectedErr: unknown) {
    const error = unexpectedErr as Error;
    console.error('Unexpected error in handler:', error);
    res.status(500).json({ message: 'Unexpected server error', error: error.message });
  }
}
