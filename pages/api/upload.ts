import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';
import pool from '../../lib/db';
import { getCookie } from 'cookies-next';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Log incoming request details
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);

    // Await the getCookie function to resolve the user_id value
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
      const form = new IncomingForm();

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Error parsing file:', err);
          return res.status(500).json({ message: 'Error parsing file', error: err.message });
        }

        console.log('Parsed fields:', fields);
        console.log('Parsed files:', files);

        const student_id = fields.student_id?.toString() || 'unknown_student';
        const consultationType = fields.consultation_type?.toString() || 'default';

        const uploadDir = path.join(process.cwd(), 'public', 'files', consultationType);
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        if (files.file) {
          const file = Array.isArray(files.file) ? files.file[0] : files.file;
          const timestamp = Date.now();
          const fileExtension = path.extname(file.originalFilename || '.unknown');
          const fileName = `${student_id}_${consultationType}_${timestamp}${fileExtension}`;
          const filePath = path.join('files', consultationType, fileName);

          try {
            fs.renameSync(file.filepath, path.join(process.cwd(), 'public', filePath));
          } catch (moveErr) {
            console.error('Failed to move uploaded file:', moveErr);
            return res.status(500).json({ message: 'Failed to move uploaded file', error: moveErr.message });
          }

          try {
            // Insert into files table
            const query = `
              INSERT INTO files (file_name, file_path, upload_date, student_id, consultation_type, uploaded_by)
              VALUES (?, ?, NOW(), ?, ?, ?)
            `;
            const values = [fileName, filePath, student_id, consultationType, username];
            const [fileResult] = await pool.query(query, values);
            const fileId = fileResult.insertId;

            // Insert into file history
            const historyQuery = `
              INSERT INTO file_history (file_id, student_id, action, user, timestamp, file_name, consultation_type)
              VALUES (?, ?, 'Uploaded', ?, NOW(), ?, ?)
            `;
            const historyValues = [fileId, student_id, username, fileName, consultationType];
            await pool.query(historyQuery, historyValues);

            console.log('File uploaded and stored in the database:', filePath);
            return res.status(200).json({ message: 'File uploaded successfully', filePath });
          } catch (dbErr) {
            console.error('Error saving file details to the database:', dbErr);
            return res.status(500).json({ message: 'Error saving file details', error: dbErr.message });
          }
        } else {
          return res.status(400).json({ message: 'No file uploaded' });
        }
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
