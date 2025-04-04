import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../../lib/db';
import { serialize } from 'cookie';

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = ?',
      [username]
    );
    const users = rows as Array<{ id: number; username: string; password_hash: string }>;

    if (
      users.length === 0 ||
      !(await bcrypt.compare(password, users[0].password_hash))
    ) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];

    // ✅ Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: 'user',
      },
      SECRET_KEY,
      { expiresIn: '2h' }
    );

    // ✅ Store JWT in secure cookie
    const cookie = serialize('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 2 * 60 * 60, // 2 hours
    });

    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('❌ Error logging in user:', error);
    return res.status(500).json({
      error: 'Server error',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
