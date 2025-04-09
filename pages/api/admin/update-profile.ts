import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import pool from '../../../lib/db';

interface UpdateAdminBody {
  id: number;
  username?: string;
  email?: string;
  position?: string;
  profile_picture?: string;
  password?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    id,
    username,
    email,
    position,
    profile_picture,
    password,
  }: UpdateAdminBody = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing admin ID' });
  }

  try {
    const fieldsToUpdate: string[] = [];
    const values: (string | number)[] = [];

    if (username?.trim()) {
      fieldsToUpdate.push('username = ?');
      values.push(username.trim());
    }

    if (email?.trim()) {
      fieldsToUpdate.push('email = ?');
      values.push(email.trim());
    }

    if (position?.trim()) {
      fieldsToUpdate.push('position = ?');
      values.push(position.trim());
    }

    if (profile_picture) {
      fieldsToUpdate.push('profile_picture = ?');
      values.push(profile_picture);
    }

    if (password) {
      const hashed = await bcrypt.hash(password, 12);
      fieldsToUpdate.push('password_hash = ?');
      values.push(hashed);
    }

    fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');

    const sql = `UPDATE admin_accounts SET ${fieldsToUpdate.join(', ')} WHERE admin_id = ?`;
    values.push(id);

    await pool.query(sql, values);

    return res.status(200).json({ message: 'Admin profile updated successfully' });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Admin profile update error:', errMsg);
    return res.status(500).json({ error: 'Server error' });
  }
}
