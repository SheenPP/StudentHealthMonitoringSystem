import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import pool from "../../../lib/db";
import { RowDataPacket } from "mysql2";

interface AdminRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userName, email, password, role, position } = req.body;

  if (!userName || !email || !password || !role || !position) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const [existingAdmin] = await pool.query<AdminRow[]>(
      "SELECT * FROM admin_accounts WHERE email = ?",
      [email]
    );

    if (existingAdmin.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await pool.query(
      `INSERT INTO admin_accounts (username, email, password, role, position)
       VALUES (?, ?, ?, ?, ?)`,
      [userName, email, hashedPassword, role, position]
    );

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error" });
  }
}
