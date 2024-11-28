import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username, password, role, position } = req.body;

  // Check if the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if the username and password are provided
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required' });
  }

  try {
    // Check if the username already exists in the database
    const [existingUser] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert the new user into the database with the role and position fields
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role, position) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, role, position || ''] // Default position if not provided
    );

    // Send a success response
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
