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

    // Sanitize and validate the consultation_type and filename
    const safeConsultationType = path.basename(consultation_type as string);
    const safeFilename = path.basename(filename as string);
    const filePath = path.join(process.cwd(), 'public', 'files', safeConsultationType, safeFilename);

    console.log('Sanitized parameters:');
    console.log('Consultation Type:', safeConsultationType);
    console.log('Filename:', safeFilename);
    console.log('File Path:', filePath);

    // Check if the file exists
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

    // Retrieve user role
    let userRole: string;
    try {
      const [userResult] = await pool.query(
        'SELECT role FROM users WHERE id = ?',
        [userId]
      ) as [Array<{ role: string }>, any];

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

    // If not admin, check file permission
    if (userRole !== 'admin') {
      try {
        const [fileResult] = await pool.query(
          `SELECT * FROM files WHERE file_name = ? AND consultation_type = ? AND student_id = ?`,
          [safeFilename, safeConsultationType, userId]
        ) as [Array<any>, any];

        if (fileResult.length === 0) {
          console.error('Unauthorized access attempt by user:', userId);
          return res.status(403).json({ error: 'You do not have permission to access this file' });
        }

        console.log('Database query result:', fileResult);
      } catch (err) {
        console.error('Error querying the database for file permissions:', err);
        return res.status(500).json({ error: 'Database query error' });
      }
    }

    // Set headers and send file
    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', contentType);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    console.log('File download initiated for:', filePath);
  } catch (error) {
    console.error('Unexpected error in file download handler:', error);
    res.status(500).json({ message: 'Unexpected server error', error: (error as Error).message });
  }
}
