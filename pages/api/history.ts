import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch the student ID from the request query
    const studentId = req.query.student_id as string;

    // Validate that the student ID is provided
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Query to fetch the file history for the specified student
    // Including the user name from the users table (assuming there's a join)
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

    // Execute the query with the provided student ID
    const [rows] = await pool.query(query, [studentId]);

    // Debug log for the fetched history
    console.log('Fetched history:', rows);

    // Check if any records were returned
    if (!rows.length) {
      return res.status(404).json({ message: 'No file history found for the given student ID' });
    }

    // Return the fetched rows
    res.status(200).json(rows);
  } catch (error) {
    // Log any error that occurs
    console.error('Error fetching file history:', error);

    // Respond with an appropriate error message
    res.status(500).json({ message: 'Error fetching file history', error: error.message });
  }
}
