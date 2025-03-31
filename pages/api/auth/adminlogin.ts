import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../../../lib/db"; // Ensure this works in serverless (see tip below)
import { serialize } from "cookie";
import { RowDataPacket, FieldPacket } from "mysql2";

// 🔐 Use environment variable for JWT
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// ✅ Admin type extending RowDataPacket for compatibility with mysql2
interface Admin extends RowDataPacket {
  admin_id: number;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  position: string;
  status: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // ✅ Typed MySQL query
    const [admin] = await pool.query<Admin[]>(
      "SELECT admin_id, username, email, password_hash, role, position, status FROM admin_accounts WHERE username = ?",
      [username]
    ) as [Admin[], FieldPacket[]];

    if (admin.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const adminData = admin[0];

    if (adminData.status !== "approved") {
      return res.status(403).json({ error: "Your account is pending approval" });
    }

    const isMatch = await bcrypt.compare(password, adminData.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

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

    const cookie = serialize("adminAuthToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
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
