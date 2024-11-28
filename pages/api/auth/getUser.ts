import type { NextApiRequest, NextApiResponse } from 'next';
import { getCookie } from 'cookies-next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Retrieve the user_id cookie
    const userId = await getCookie('user_id', { req, res });
    console.log('Received user_id cookie:', userId, 'Type:', typeof userId);

    // Check if the cookie is missing
    if (userId === undefined || userId === null) {
      console.error('User ID is missing or undefined');
      return res.status(401).json({ error: 'Not authenticated - Missing user_id cookie' });
    }

    let sanitizedUserId: number;

    // Check if userId is a number or a string and parse accordingly
    if (typeof userId === 'string') {
      sanitizedUserId = parseInt(userId, 10);
      if (isNaN(sanitizedUserId)) {
        console.error('Invalid user_id format, not a valid number:', userId);
        return res.status(400).json({ error: 'Invalid user ID format' });
      }
    } else if (typeof userId === 'number') {
      sanitizedUserId = userId;
    } else {
      console.error('Invalid user_id type:', typeof userId);
      return res.status(400).json({ error: 'Invalid user_id type' });
    }

    // Query database for user information including firstname, lastname, and profile_picture
    const [rows] = await pool.query(
      'SELECT id, username, firstname, lastname, role, position, profile_picture FROM users WHERE id = ?',
      [sanitizedUserId]
    );

    const users = rows as Array<{
      id: number;
      username: string;
      firstname: string;
      lastname: string;
      role: string;
      position: string;
      profile_picture: string | null; // Add profile_picture property
    }>;

    if (users.length === 0) {
      console.error('User not found for user_id:', sanitizedUserId);
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    console.log('User found:', user);

    // Add full URL for profile_picture if available
    const profilePictureUrl = user.profile_picture ? `/uploads/${user.profile_picture}` : null;

    // Return user information, including profile picture URL if present
    return res.status(200).json({
      user: {
        ...user,
        profilePicture: profilePictureUrl, // Add profilePicture to the response
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
