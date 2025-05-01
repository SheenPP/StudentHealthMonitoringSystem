import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import supabase from '../../lib/supabase';
import { RowDataPacket } from 'mysql2';

interface RecycleFileRow extends RowDataPacket {
  id: number;
  file_name: string;
  file_path: string;
  deleted_by: string | null;
  deleted_at: string | null;
  user_id: string;
  consultation_type: string;
}

// 🕒 Get timestamp in Asia/Manila timezone (MySQL DATETIME format)
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
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const [archives] = await db.query<RecycleFileRow[]>(
        `SELECT id, file_name, file_path, deleted_by, deleted_at, user_id, consultation_type
         FROM files
         WHERE recycle_bin = 1
         ORDER BY deleted_at DESC`
      );
      return res.status(200).json(archives);
    }

    if (req.method === 'POST') {
      const { action, file_id, username } = req.body;

      if (!action || !file_id || !username) {
        return res.status(400).json({
          error: 'Missing required parameters: action, file_id, or username',
        });
      }

      // 🔍 Fetch file info
      const [fileResult] = await db.query<RecycleFileRow[]>(
        'SELECT * FROM files WHERE id = ?',
        [file_id]
      );

      if (fileResult.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }

      const file = fileResult[0];
      const { file_path, file_name, user_id, consultation_type } = file;

      const storageKey = decodeURIComponent(
        file_path.replace(
          'https://srtpakjpnnmtgumqiujf.supabase.co/storage/v1/object/public/files/',
          ''
        )
      );

      const timestamp = getAsiaManilaTimestamp();

      // 🔁 Restore
      if (action === 'restore') {
        await db.query(
          `UPDATE files
           SET recycle_bin = 0, deleted_by = NULL, deleted_at = NULL
           WHERE id = ?`,
          [file_id]
        );

        await db.query(
          `INSERT INTO file_history (file_id, user_id, action, user, timestamp, file_name, consultation_type)
           VALUES (?, ?, 'Restored from Recycle Bin', ?, ?, ?, ?)`,
          [file_id, user_id, username, timestamp, file_name, consultation_type]
        );

        return res.status(200).json({ message: 'File restored successfully', restoredAt: timestamp });
      }

      // 🗑 Move to Recycle Bin
      if (action === 'move-to-recycle') {
        await db.query(
          `UPDATE files
           SET recycle_bin = 1, deleted_by = ?, deleted_at = ?
           WHERE id = ?`,
          [username, timestamp, file_id]
        );

        await db.query(
          `INSERT INTO file_history (file_id, user_id, action, user, timestamp, file_name, consultation_type)
           VALUES (?, ?, 'Moved to Recycle Bin', ?, ?, ?, ?)`,
          [file_id, user_id, username, timestamp, file_name, consultation_type]
        );

        return res.status(200).json({ message: 'File moved to recycle bin', deletedAt: timestamp });
      }

      // ❌ Permanently delete from Supabase + DB
      if (action === 'delete') {
        const { error: deleteError } = await supabase.storage.from('files').remove([storageKey]);
        if (deleteError) {
          return res.status(500).json({ error: 'Failed to delete from Supabase', details: deleteError.message });
        }

        await db.query('DELETE FROM files WHERE id = ?', [file_id]);

        return res.status(200).json({ message: 'File deleted permanently' });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in recycle-bin API:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
