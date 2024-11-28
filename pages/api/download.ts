import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import mime from 'mime-types';
import pool from '../../lib/db';
import { getCookie } from 'cookies-next';

const stat = promisify(fs.stat);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Request method:', req.method);

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // Retrieve user_id from the cookie
    const rawUserId = await getCookie('user_id', { req, res });
    const userId = rawUserId ? `${rawUserId}` : null;

    if (!userId) {
      console.error('Authorization token is missing or invalid');
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    console.log('User ID retrieved from cookie:', userId);

    const { consultation_type, filename } = req.query;

    if (!consultation_type || !filename) {
      if (!consultation_type) {
        console.error('Missing consultation type');
      }
      if (!filename) {
        console.error('Missing filename');
      }
      return res.status(400).json({ error: 'Missing consultation type or filename' });
    }

    // Sanitize and validate the consultation_type and filename to prevent path traversal attacks
    const safeConsultationType = path.basename(consultation_type as string);
    const safeFilename = path.basename(filename as string);
    const filePath = path.join(process.cwd(), 'public', 'files', safeConsultationType, safeFilename);

    console.log('Sanitized parameters:');
    console.log('Consultation Type:', safeConsultationType);
    console.log('Filename:', safeFilename);
    console.log('File Path:', filePath);

    // Check if the file exists and is a file
    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        console.error('File does not exist or is not a valid file:', filePath);
        return res.status(404).json({ error: 'File not found' });
      }
    } catch (err) {
      console.error('Error checking file existence:', err);
      return res.status(404).json({ error: 'File not found' });
    }

    // Retrieve user role from the database
    let userRole;
    try {
      const [userResult] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
      if (userResult.length === 0) {
        console.error(`Invalid user for ID: ${userId}`);
        return res.status(401).json({ error: 'Invalid user' });
      }
      userRole = userResult[0].role;
      console.log('Resolved user role:', userRole);
    } catch (err) {
      console.error('Error retrieving user role from database:', err);
      return res.status(500).json({ error: 'Database query error' });
    }

    // Verify that the user has permission to access the file if not an admin
    if (userRole !== 'admin') {
      try {
        const query = `SELECT * FROM files WHERE file_name = ? AND consultation_type = ? AND student_id = ?`;
        console.log('Database query:', query);
        console.log('Query parameters:', safeFilename, safeConsultationType, userId);

        const [fileResult] = await pool.query(query, [safeFilename, safeConsultationType, userId]);

        if (fileResult.length === 0) {
          console.error('Unauthorized access attempt by user:', userId);
          console.error('Query result was empty for:', {
            file_name: safeFilename,
            consultation_type: safeConsultationType,
            student_id: userId,
          });
          return res.status(403).json({ error: 'You do not have permission to access this file' });
        }

        console.log('Database query result:', fileResult);
      } catch (err) {
        console.error('Error querying the database for file permissions:', err);
        return res.status(500).json({ error: 'Database query error' });
      }
    }

    // Determine the Content-Type using mime-types package
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    // Set headers for downloading the file
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', contentType);

    // Create a read stream and pipe it to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    console.log('File download initiated for:', filePath);
  } catch (error) {
    console.error('Unexpected error in file download handler:', error);
    res.status(500).json({ message: 'Unexpected server error', error: (error as Error).message });
  }
}
