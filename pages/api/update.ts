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

    if (!userId) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    // Retrieve the username from the database
    const [userResult] = await pool.query('SELECT username FROM users WHERE id = ?', [userId]);
    if (userResult.length === 0) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const username = userResult[0].username;

    if (req.method === 'POST') {
      // Parse the incoming form data
      const form = new IncomingForm();

      form.parse(req, async (err, fields, files) => {
        if (err) {
          return res.status(500).json({ error: 'Error parsing form data', details: err.message });
        }

        let { file_id, new_file, student_id, consultation_type } = fields;

        // Handle the case where new_file or file_id might be arrays
        if (Array.isArray(new_file)) {
          new_file = new_file[0];
        }

        if (Array.isArray(file_id)) {
          file_id = file_id[0];
        }

        if (!file_id || !new_file) {
          return res.status(400).json({ error: 'File ID and new file are required' });
        }

        // Extract the original filename and extension
        const fileExtension = path.extname(new_file);
        const originalName = path.basename(new_file, fileExtension);
        
        // Append timestamp to the new filename
        const timestamp = Date.now();
        const newFileName = `${originalName}${fileExtension}`;

        // Get file details from the database using file_id
        const [fileResult] = await pool.query('SELECT * FROM files WHERE id = ?', [file_id]);
        if (fileResult.length === 0) {
          return res.status(404).json({ error: 'File not found' });
        }

        const file = fileResult[0];
        const filePath = path.join(process.cwd(), 'public', file.file_path);

        // Move the old file to a "recycle bin" directory
        const recycleBinDir = path.join(process.cwd(), 'public', 'recycle_bin');
        if (!fs.existsSync(recycleBinDir)) {
          fs.mkdirSync(recycleBinDir, { recursive: true });
        }

        const recycleFilePath = path.join(recycleBinDir, path.basename(filePath));

        try {
          fs.renameSync(filePath, recycleFilePath);
        } catch (moveErr) {
          return res.status(500).json({ error: 'Error moving old file to recycle bin', details: moveErr.message });
        }

        // Insert into recycle_bin table
        const recycleBinQuery = `
          INSERT INTO recycle_bin (file_id, file_name, deleted_by, deleted_at)
          VALUES (?, ?, ?, NOW())
        `;
        const recycleBinValues = [file_id, file.file_name, username];
        await pool.query(recycleBinQuery, recycleBinValues);

        // Replace old file with new file (new file name includes timestamp)
        const newFilePath = path.join(process.cwd(), 'public', 'files', newFileName);
        fs.renameSync(path.join(process.cwd(), 'public', 'temp', new_file), newFilePath);

        // Update the file record in the database to point to the new file
        const query = `
          UPDATE files
          SET file_path = ?, updated_at = NOW(), updated_by = ?
          WHERE id = ?
        `;
        const values = [`upload/${newFileName}`, username, file_id];
        const [updateResult] = await pool.query(query, values);

        // Check if the update was successful
        if (updateResult.affectedRows === 0) {
          return res.status(500).json({ error: 'Failed to update file record' });
        }

        // Insert into file history
        const historyQuery = `
          INSERT INTO file_history (file_id, student_id, action, user, timestamp, file_name, consultation_type)
          VALUES (?, ?, 'Replaced with new file', ?, NOW(), ?, ?)
        `;
        const historyValues = [file_id, student_id, username, newFileName, consultation_type];
        await pool.query(historyQuery, historyValues);

        return res.status(200).json({ message: 'File replaced successfully' });
      });
    } else {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (unexpectedErr) {
    res.status(500).json({ message: 'Unexpected server error', error: unexpectedErr.message });
  }
}
