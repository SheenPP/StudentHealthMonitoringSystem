import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../../../lib/db";
import { serialize } from "cookie";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // Query the database for the admin
    const [admin] = await pool.query(
      "SELECT admin_id, username, email, password_hash, role, position, status FROM admin_accounts WHERE username = ?",
      [username]
    ) as [Array<{
      admin_id: number;
      username: string;
      email: string;
      password_hash: string;
      role: string;
      position: string;
      status: string;
    }>, any];

    if (admin.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const adminData = admin[0];

    // Check approval status
    if (adminData.status !== "approved") {
      return res.status(403).json({ error: "Your account is pending approval" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, adminData.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Create JWT
    const token = jwt.sign(
      {
        adminId: adminData.admin_id,
        username: adminData.username,
        email: adminData.email,
        role: adminData.role,
        position: adminData.position,
      },
      SECRET_KEY,
      { expiresIn: "2h" }
    );

    // Set cookie
    const cookie = serialize("adminAuthToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // ✅ lowercase fix
      path: "/",
      maxAge: 2 * 60 * 60,
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
