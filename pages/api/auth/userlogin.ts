// pages/api/auth/userlogin.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../../../lib/db";
import { serialize } from "cookie";
import { RowDataPacket } from "mysql2";

interface AccountRow extends RowDataPacket {
  id: number;  // 'id' is the primary key in the 'accounts' table
  email: string;
  password_hash: string;
  role: string;  // 'teacher' or 'student'
  status: string;
}

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const [rows] = await pool.query<AccountRow[]>(
      "SELECT * FROM accounts WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      console.warn(`[SECURITY] Failed login attempt for email: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];

    if (user.status !== "approved") {
      return res.status(403).json({ error: "Your account has not been approved yet." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.warn(`[SECURITY] Failed password attempt for email: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token with 'email' and 'role' in the payload
    const token = jwt.sign(
      {
        email: user.email,
        role: user.role,
        user_id: user.user_id, // ✅ add this
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Set the cookie with 'userAuthToken'
    res.setHeader("Set-Cookie", serialize("userAuthToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",  // Ensure cookies are secure in production
      sameSite: "strict",
      maxAge: 3600,  // 1 hour
      path: "/",
    }));

    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
