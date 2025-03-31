import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import pool from '../../../lib/db';
import multer from 'multer';
import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';

// Define Multer file type manually
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Extend NextApiRequest to include the uploaded file
interface MulterNextApiRequest extends NextApiRequest {
  file: MulterFile;
}

// Set up multer to handle file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads', // Make sure this folder exists
    filename: (req, file, cb) => {
      const { firstname, lastname } = req.body as Record<string, string>;
      const fileExtension = path.extname(file.originalname);
      const newFilename = `${firstname}_${lastname}${fileExtension}`;
      cb(null, newFilename);
    },
  }),
});

const uploadMiddleware = upload.single('profilePicture');

// Utility function to run middleware in Next.js API routes
async function runMiddleware(req: IncomingMessage, res: ServerResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// Main API handler
export default async function handler(req: MulterNextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run the upload middleware to handle the file upload
    await runMiddleware(req, res, uploadMiddleware);

    const { firstname, lastname, position, username, email, password } = req.body;

    if (!firstname || !lastname || !position || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const [existingUser]: any = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Handle uploaded profile picture path
    let profilePicturePath = '';
    if (req.file) {
      profilePicturePath = `/uploads/${req.file.filename}`;
    }

    // Insert user data into database
    await pool.query(
      'INSERT INTO users (firstname, lastname, position, username, email, password_hash, role, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [firstname, lastname, position, username, email, passwordHash, 'admin', profilePicturePath]
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

// Important: disable default body parser so multer can handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};
