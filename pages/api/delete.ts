import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';
import { getCookie } from 'cookies-next';
import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';

export const config = {
  api: {
    bodyParser: false, // Disable default body parsing to handle the form data
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Request method:', req.method);

    // Get user ID from cookies
    const rawUserId = await getCookie('user_id', { req, res });
    const userId = rawUserId ? `${rawUserId}` : null;
    console.log('Resolved user ID from cookie:', userId);

    if (!userId) {
      console.error('Authorization token is missing or invalid');
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    // Retrieve the username from the database
    const [userResult] = await pool.query('SELECT username FROM users WHERE id = ?', [userId]);
    console.log('User result from database:', userResult);

    if (userResult.length === 0) {
      console.error(`Invalid user for ID: ${userId}`);
      return res.status(401).json({ error: 'Invalid user' });
    }

    const username = userResult[0].username;
    console.log('Resolved username:', username);

    if (req.method === 'POST') {
      // Parse the incoming form data
      const form = new IncomingForm();

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Error parsing form data:', err);
          return res.status(500).json({ error: 'Error parsing form data', details: err.message });
        }

        console.log('Parsed fields:', fields);
        console.log('Parsed files:', files);

        // Ensure file_id is passed in the fields
        const { file_id, file_path, student_id, consultation_type } = fields; // Correct field names
        if (!file_id) {
          return res.status(400).json({ error: 'File ID is required' });
        }

        // Get file details from the database using file_id
        const [fileResult] = await pool.query('SELECT * FROM files WHERE id = ?', [file_id]);
        if (fileResult.length === 0) {
          return res.status(404).json({ error: 'File not found' });
        }

        const file = fileResult[0];
        const filePath = path.join(process.cwd(), 'public', file.file_path);

        // Move the file to a "recycle bin" directory
        const recycleBinDir = path.join(process.cwd(), 'public', 'recycle_bin');
        if (!fs.existsSync(recycleBinDir)) {
          fs.mkdirSync(recycleBinDir, { recursive: true });
        }

        const recycleFilePath = path.join(recycleBinDir, path.basename(filePath));

        try {
          // Move the file to the recycle bin
          fs.renameSync(filePath, recycleFilePath);
          console.log('File moved to recycle bin:', recycleFilePath);
        } catch (moveErr) {
          console.error('Error moving file to recycle bin:', moveErr);
          return res.status(500).json({ error: 'Error moving file to recycle bin', details: moveErr.message });
        }

        // Update the file record in the database to mark it as deleted and moved to the recycle bin
        const query = `
          UPDATE files
          SET deleted_by = ?, deleted_at = NOW(), file_path = ?, recycle_bin = 1
          WHERE id = ?
        `;
        const values = [username, `recycle_bin/${path.basename(filePath)}`, file_id];
        await pool.query(query, values);

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
        const recycleBinValues = [file_id, file.file_name, username, file.file_path];
        await pool.query(recycleBinQuery, recycleBinValues);

        return res.status(200).json({ message: 'File moved to recycle bin successfully' });
      });
    } else {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (unexpectedErr) {
    console.error('Unexpected error in handler:', unexpectedErr);
    res.status(500).json({ message: 'Unexpected server error', error: unexpectedErr.message });
  }
}
