import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import pool from '../../lib/db'; // Import the pool from db.js

const filesDirectory = path.join(process.cwd(), 'public', 'files');

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { student_id, consultation_type } = req.query;

  if (!student_id || !consultation_type) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    // Query the database for files associated with the student_id and consultation_type
    // Exclude files that are marked as deleted or in the recycle bin (deleted_at is NULL or recycle_bin is 0)
    const [rows] = await pool.execute(
      'SELECT id, file_name, file_path FROM files WHERE student_id = ? AND consultation_type = ? AND (deleted_at IS NULL OR recycle_bin = 0)',
      [student_id, consultation_type]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No files found for the given student and consultation type' });
    }

    // Return the files with the associated ID
    const studentFiles = rows.map((row: any) => ({
      id: row.id, // Retrieved from the database
      file_name: row.file_name,
      file_path: row.file_path,
    }));

    res.status(200).json({ files: studentFiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
