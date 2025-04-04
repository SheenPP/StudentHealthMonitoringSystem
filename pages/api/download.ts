import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';
import { getCookie } from 'cookies-next';
import type { RowDataPacket } from 'mysql2';

interface AdminRow extends RowDataPacket {
  username: string;
  role: string;
}

interface UserRow extends RowDataPacket {
  username: string;
}

interface FileRow extends RowDataPacket {
  file_path: string;
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

    let isAdmin = false;
    let userType: 'admin' | 'user' | null = null;

    const [adminResult] = await pool.query<AdminRow[]>(
      'SELECT username, role FROM admin_accounts WHERE admin_id = ?',
      [userId]
    );

    if (adminResult.length > 0) {
      const role = adminResult[0].role;
      if (role === 'admin' || role === 'super_admin') {
        isAdmin = true;
        userType = 'admin';
      }
    } else {
      const [userResult] = await pool.query<UserRow[]>(
        'SELECT username FROM users WHERE id = ?',
        [userId]
      );

      if (userResult.length > 0) {
        userType = 'user';
      }
    }

    if (!userType) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const [fileResult] = await pool.query<FileRow[]>(
      'SELECT file_path, student_id FROM files WHERE file_name = ?',
      [filename]
    );

    if (fileResult.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { file_path, student_id } = fileResult[0];

    if (!isAdmin && student_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to download this file' });
    }

    return res.redirect(file_path);
  } catch (error) {
    console.error('Download handler error:', error);
    return res.status(500).json({
      message: 'Unexpected server error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
