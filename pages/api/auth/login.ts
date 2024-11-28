// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import pool from '../../../lib/db';
import { setCookie } from 'cookies-next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Query database to retrieve user information by username
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const users = rows as Array<{ id: number; username: string; password_hash: string }>;

    // Check if the user exists and if the password is correct
    if (users.length === 0 || !(await bcrypt.compare(password, users[0].password_hash))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];

    // Set a session cookie with the user ID
    setCookie('user_id', user.id, {
      req,
      res,
      maxAge: 5 * 60 * 60, // 5 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Return success response
    return res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
