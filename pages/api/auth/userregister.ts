// pages/api/auth/userregister.ts
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import pool from '../../../lib/db'; // Adjust if your DB path is different

interface RegisterRequestBody {
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  password: string;
  role: 'student' | 'teacher' | 'admin'; // Extend roles if needed
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      email: rawEmail,
      firstName: rawFirstName,
      middleName: rawMiddleName,
      lastName: rawLastName,
      password,
      role: rawRole,
    }: RegisterRequestBody = req.body;

    // Trim and normalize input
    const email = rawEmail?.trim().toLowerCase();
    const firstName = rawFirstName?.trim();
    const middleName = rawMiddleName?.trim() || null;
    const lastName = rawLastName?.trim();
    const role = rawRole?.trim().toLowerCase() as 'student' | 'teacher' | 'admin';

    if (!email || !firstName || !lastName || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM accounts WHERE email = ?', [email]);
    const existingUsers = existing as { id: number }[];

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into database
    await pool.query(
      `INSERT INTO accounts (email, first_name, middle_name, last_name, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, firstName, middleName, lastName, hashedPassword, role]
    );

    return res.status(201).json({ message: 'Account created successfully' });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Registration error:', error);
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}
