import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parseCookies } from 'nookies';
import pool from '../../../lib/db';
import type { RowDataPacket } from 'mysql2';

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

// ✅ Define the expected JWT payload structure
interface JwtPayload {
  userId: number;
  role: string;
  iat?: number;
  exp?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cookies = parseCookies({ req });
    const token = cookies.authToken;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated - Missing token' });
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { userId, role } = decoded;

    if (!userId || role !== 'user') {
      return res.status(403).json({ error: 'Forbidden - Not a valid user' });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, firstname, lastname, role, position, profile_picture FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    const profilePictureUrl = user.profile_picture ? `/uploads/${user.profile_picture}` : null;

    return res.status(200).json({
      user: {
        ...user,
        profilePicture: profilePictureUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
