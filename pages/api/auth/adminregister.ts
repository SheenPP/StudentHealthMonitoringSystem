import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import pool from "../../../lib/db";
import { RowDataPacket } from "mysql2"; // ✅ Import

// ✅ Define expected row structure
interface AdminRow extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  password: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { fullName, email, password } = req.body;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Full name, email, and password are required" });
  }

  try {
    // ✅ Type-safe query
    const [existingAdmin] = await pool.query<AdminRow[]>(
      "SELECT * FROM admin_accounts WHERE email = ?",
      [email]
    );

    if (existingAdmin.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await pool.query(
      "INSERT INTO admin_accounts (full_name, email, password) VALUES (?, ?, ?)",
      [fullName, email, hashedPassword]
    );

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({ error: "Server error" });
  }
}
