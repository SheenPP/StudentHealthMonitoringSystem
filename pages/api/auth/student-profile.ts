import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';
import { verifyToken } from '../../../lib/authenticate';
import { RowDataPacket } from 'mysql2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const studentId = decoded.userId; // or decoded.studentId if that's the correct field

    const [result] = await pool.query<RowDataPacket[]>(
      'SELECT student_id, full_name, email, created_at FROM studentaccount WHERE student_id = ?',
      [studentId]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
