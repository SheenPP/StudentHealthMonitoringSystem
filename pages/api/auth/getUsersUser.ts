// pages/api/auth/getUsersUser.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import pool from "../../../lib/db";
import { RowDataPacket } from "mysql2";
import { parse } from "cookie";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// Account row structure from the 'accounts' table
interface AccountProfileRow extends RowDataPacket {
  id: number;  // 'id' from the 'accounts' table
  email: string;
  role: string;
  status: string;
  created_at: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  photo_path: string | null;
}

interface JwtPayload {
  email: string;  // 'email' from the JWT payload
  role: string;
  iat?: number;
  exp?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Parse cookies and look for 'userAuthToken'
    const cookies = parse(req.headers.cookie || "");
    const token = cookies.userAuthToken;  // This matches the cookie name set during login

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Decode the JWT token
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    const email = decoded.email;  // Get the 'email' from the token payload
    const role = decoded.role;  // Get the 'role' from the token payload

    if (!email) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    // First query: Fetch user details from the 'accounts' table using 'email'
    const [users] = await pool.query<AccountProfileRow[]>(
      `SELECT 
         a.id,
         a.user_id, 
         a.email, 
         a.role, 
         a.status, 
         a.created_at, 
         a.first_name, 
         a.middle_name, 
         a.last_name, 
         up.photo_path
       FROM accounts a
       LEFT JOIN user_profiles up ON a.email = up.email
       WHERE a.email = ?`,  // Query by 'email' from the decoded JWT token
      [email]  // Pass 'email' for querying
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];  // Only one result expected

    // Return user data along with optional profile data
    return res.status(200).json({
      user_id: user.user_id,  // Return 'id' from the database
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      photo_path: user.photo_path,
    });
  } catch (error: unknown) {
    console.error("Error verifying token or fetching user profile:", error);

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
}
