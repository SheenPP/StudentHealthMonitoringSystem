import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import pool from '../../../lib/db';

interface UpdateUserBody {
  id: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  username?: string;
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
    firstname,
    lastname,
    email,
    username,
    position,
    profile_picture,
    password,
  }: UpdateUserBody = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing user ID' });
  }

  try {
    const fieldsToUpdate: string[] = [];
    const values: (string | number)[] = [];

    if (firstname?.trim()) {
      fieldsToUpdate.push('firstname = ?');
      values.push(firstname.trim());
    }

    if (lastname?.trim()) {
      fieldsToUpdate.push('lastname = ?');
      values.push(lastname.trim());
    }

    if (email?.trim()) {
      fieldsToUpdate.push('email = ?');
      values.push(email.trim());
    }

    if (username?.trim()) {
      fieldsToUpdate.push('username = ?');
      values.push(username.trim());
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

    const sql = `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    values.push(id);

    await pool.query(sql, values);

    return res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Update error:', errMsg);
    return res.status(500).json({ error: 'Server error' });
  }
}
