// pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import pool from '../../../lib/db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import { runMiddleware } from '../../../lib/runMiddleware';

// Set up multer to handle file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
      const { firstname, lastname } = req.body as Record<string, string>;
      const fileExtension = path.extname(file.originalname);
      const newFilename = `${firstname}_${lastname}${fileExtension}`;
      cb(null, newFilename);
    },
  }),
});

// Middleware to handle file upload
const uploadMiddleware = upload.single('profilePicture');

// Utility function to run middleware in Next.js API routes
async function runMiddleware(req: IncomingMessage, res: ServerResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await runMiddleware(req, res, uploadMiddleware);

  if (!req.body.firstname || !req.body.lastname || !req.body.position || !req.body.username || !req.body.email || !req.body.password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const { firstname, lastname, position, username, email, password } = req.body;

    console.log('Received data:', req.body);

    // Check if the username or email already exists
    const [existingUser] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      console.log('User already exists:', existingUser);
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    console.log('Password hash generated');

    // Handle profile picture file
    let profilePicturePath = '';
    if (req.file) {
      // Assign a filename based on user details
      profilePicturePath = `/uploads/${req.file.filename}`;
    }

    // Insert the new user into the database with the profile picture path (placeholder)
    const insertResult = await pool.query(
      'INSERT INTO users (firstname, lastname, position, username, email, password_hash, role, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [firstname, lastname, position, username, email, passwordHash, 'admin', profilePicturePath]
    );

    console.log('User created successfully');
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing so `multer` can handle it
  },
};
