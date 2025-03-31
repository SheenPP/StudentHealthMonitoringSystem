import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import pool from '../../../lib/db';
import multer from 'multer';
import path from 'path';
import { RowDataPacket } from 'mysql2';
import { RequestHandler, Request as ExpressRequest, Response as ExpressResponse } from 'express';

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

// Define user row type from DB
interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
}

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

const uploadMiddleware = upload.single('profilePicture');

// ✅ Lint-safe runMiddleware
async function runMiddleware(
  req: ExpressRequest,
  res: ExpressResponse,
  fn: RequestHandler
): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result?: unknown) => {
      if (result instanceof Error) return reject(result);
      return resolve();
    });
  });
}

// ✅ Main API handler
export default async function handler(req: MulterNextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await runMiddleware(req as unknown as ExpressRequest, res as unknown as ExpressResponse, uploadMiddleware);

    const { firstname, lastname, position, username, email, password } = req.body;

    if (!firstname || !lastname || !position || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const [existingUser] = await pool.query<UserRow[]>(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let profilePicturePath = '';
    if (req.file) {
      profilePicturePath = `/uploads/${req.file.filename}`;
    }

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

// ✅ Disable default body parser so multer can handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};
