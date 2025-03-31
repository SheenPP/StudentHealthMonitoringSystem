import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import pool from '../../../lib/db';
import { RowDataPacket } from 'mysql2';

// ✅ Define the shape of the returned user row
interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  role: string;
  position: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username, password, role, position } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required' });
  }

  try {
    // ✅ Type-safe query result
    const [existingUser] = await pool.query<UserRow[]>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await pool.query(
      'INSERT INTO users (username, password_hash, role, position) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, role, position || '']
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
