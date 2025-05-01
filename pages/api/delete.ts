import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parseCookies } from 'nookies';
import { IncomingForm } from 'formidable';
import pool from '../../lib/db';
import type { RowDataPacket, OkPacket } from 'mysql2';

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ JWT payload interface
interface JwtPayload {
  userId?: number;
  adminId?: number;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

// ✅ Utility to get timestamp in Asia/Manila timezone in MySQL format
function getAsiaManilaTimestamp(): string {
  const date = new Date();

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat('en-CA', options); // 'en-CA' gives YYYY-MM-DD format
  const parts = formatter.formatToParts(date);

  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';

  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cookies = parseCookies({ req });
    const token = cookies.authToken || cookies.adminAuthToken;

    if (!token) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    const userId = decoded.userId || decoded.adminId;
    const role = decoded.role;

    let username: string | null = null;

    if (role === 'admin') {
      const [result] = await pool.query<RowDataPacket[]>(
        'SELECT username FROM admin_accounts WHERE admin_id = ?',
        [userId]
      );
      username = result[0]?.username || null;
    } else {
      const [result] = await pool.query<RowDataPacket[]>(
        'SELECT username FROM users WHERE id = ?',
        [userId]
      );
      username = result[0]?.username || null;
    }

    if (!username) {
      return res.status(403).json({ error: 'Unauthorized user' });
    }

    const form = new IncomingForm();

    form.parse(req, async (err, fields) => {
      if (err) {
        return res.status(500).json({ error: 'Error parsing form data', details: err.message });
      }

      const file_id = Array.isArray(fields.file_id) ? fields.file_id[0] : fields.file_id;
      const user_id = Array.isArray(fields.user_id) ? fields.user_id[0] : fields.user_id;
      const consultation_type = Array.isArray(fields.consultation_type)
        ? fields.consultation_type[0]
        : fields.consultation_type;

      if (!file_id) {
        return res.status(400).json({ error: 'File ID is required' });
      }

      const [fileResult] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM files WHERE id = ?',
        [file_id]
      );

      if (fileResult.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }

      const file = fileResult[0];
      const deletedAt = getAsiaManilaTimestamp();

      await pool.query<OkPacket>(
        `UPDATE files
         SET deleted_by = ?, deleted_at = ?, recycle_bin = 1
         WHERE id = ?`,
        [username, deletedAt, file_id]
      );

      await pool.query<OkPacket>(
        `INSERT INTO file_history (file_id, user_id, action, user, timestamp, file_name, consultation_type)
         VALUES (?, ?, 'Moved to Recycle Bin', ?, ?, ?, ?)`,
        [file_id, user_id, username, deletedAt, file.file_name, consultation_type]
      );

      await pool.query<OkPacket>(
        `INSERT INTO recycle_bin (file_id, file_name, deleted_by, deleted_at)
         VALUES (?, ?, ?, ?)`,
        [file_id, file.file_name, username, deletedAt]
      );

      return res.status(200).json({
        message: 'File moved to recycle bin successfully',
        deletedAt,
      });
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Unexpected error',
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
