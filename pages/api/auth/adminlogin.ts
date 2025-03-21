import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../../../lib/db"; // Ensure your MySQL connection is set up
import { serialize } from "cookie"; // Helps manage cookies in Next.js API routes

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key"; // Use environment variable for security

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // Check if the admin exists and is approved
    const [admin] = await pool.query(
      "SELECT admin_id, username, email, password_hash, role, position, status FROM admin_accounts WHERE username = ?",
      [username]
    );

    if ((admin as any).length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const adminData = (admin as any)[0];

    // Check if the admin is approved
    if (adminData.status !== "approved") {
      return res.status(403).json({ error: "Your account is pending approval" });
    }

    // Verify password using bcrypt
    const isMatch = await bcrypt.compare(password, adminData.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        adminId: adminData.admin_id,
        username: adminData.username,
        email: adminData.email,
        role: adminData.role,
        position: adminData.position,
      },
      SECRET_KEY,
      { expiresIn: "2h" } // Token expires in 2 hours
    );

    // Set HTTP-only Cookie (More Secure)
    const cookie = serialize("adminAuthToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only set secure in production
      sameSite: "Strict",
      path: "/",
      maxAge: 2 * 60 * 60, // 2 hours
    });

    res.setHeader("Set-Cookie", cookie);
    res.status(200).json({
      message: "Login successful",
      user: {
        adminId: adminData.admin_id,
        username: adminData.username,
        email: adminData.email,
        role: adminData.role,
        position: adminData.position,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
}
