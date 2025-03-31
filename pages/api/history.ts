import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';

interface FileHistoryRecord {
  action: string;
  user: string;
  timestamp: string;
  fileName: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const studentId = req.query.student_id as string;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    const query = `
      SELECT 
        action,
        user,
        timestamp,
        file_name AS fileName
      FROM file_history
      WHERE student_id = ?
      ORDER BY timestamp DESC;
    `;

    const result = await pool.query(query, [studentId]);
    const rows = result[0] as FileHistoryRecord[];

    console.log('Fetched history:', rows);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No file history found for the given student ID' });
    }

    return res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error fetching file history:', error);
    return res.status(500).json({ message: 'Error fetching file history', error: error.message });
  }
}
