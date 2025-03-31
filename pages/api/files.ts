import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';
import { RowDataPacket } from 'mysql2';

// Define expected result row type
interface FileRow extends RowDataPacket {
  id: number;
  file_name: string;
  file_path: string;
}

// ✅ Export named async handler to avoid anonymous export warning
const getFilesHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { student_id, consultation_type } = req.query;

  if (!student_id || !consultation_type) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    // ✅ Cast result correctly
    const [rows] = await pool.execute<FileRow[]>(
      `SELECT id, file_name, file_path 
       FROM files 
       WHERE student_id = ? 
         AND consultation_type = ? 
         AND (deleted_at IS NULL OR recycle_bin = 0)`,
      [student_id, consultation_type]
    );

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
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default getFilesHandler;
