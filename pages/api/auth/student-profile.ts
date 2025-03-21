import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';
import { verifyToken } from '../../../lib/authenticate'; // Helper function to verify JWT token

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if the request method is GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the student ID from the token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const studentId = decoded.studentId;

    // Fetch student profile from the database
    const [result] = await pool.query(
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
