import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import pool from '../../lib/db';

const filesDirectory = path.join(process.cwd(), 'public', 'files');

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { student_id, consultation_type } = req.query;

  if (!student_id || !consultation_type) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    // Explicitly cast the result to expected type: [rows[], fields]
    const [rows] = await pool.execute(
      'SELECT id, file_name, file_path FROM files WHERE student_id = ? AND consultation_type = ? AND (deleted_at IS NULL OR recycle_bin = 0)',
      [student_id, consultation_type]
    ) as [Array<{ id: number; file_name: string; file_path: string }>, any];

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No files found for the given student and consultation type' });
    }

    const studentFiles = rows.map((row) => ({
      id: row.id,
      file_name: row.file_name,
      file_path: row.file_path,
    }));

    res.status(200).json({ files: studentFiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
