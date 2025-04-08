import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';
import { getCookie } from 'cookies-next';
import type { RowDataPacket } from 'mysql2';

interface FileRow extends RowDataPacket {
  file_path: string;  // This should be the full public URL
  student_id: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const rawUserId = getCookie('user_id', { req, res });
    const userId = rawUserId ? `${rawUserId}` : null;

    if (!userId) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    const { filename } = req.query;
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid filename' });
    }

    // Fetch file details from the database
    const [fileResult] = await pool.query<FileRow[]>(`
      SELECT file_path, student_id 
      FROM files 
      WHERE file_name = ?
    `, [filename]);

    if (fileResult.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { file_path } = fileResult[0];

    // Redirect to the full public URL directly
    return res.redirect(file_path);
  } catch (error) {
    console.error('Download handler error:', error);
    return res.status(500).json({
      message: 'Unexpected server error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
