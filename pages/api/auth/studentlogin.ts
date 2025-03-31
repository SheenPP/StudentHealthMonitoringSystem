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

  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Student ID/Email and password are required" });
  }

  try {
    const [students]: any = await pool.query(
      "SELECT * FROM studentaccount WHERE student_id = ? OR email = ?",
      [identifier, identifier]
    );

    if (students.length === 0) {
      console.warn(`[SECURITY] Failed login attempt for: ${identifier}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const student = students[0];

    if (student.status !== "approved") {
      return res.status(403).json({ error: "Your account has not been approved yet." });
    }

    const isMatch = await bcrypt.compare(password, student.password_hash);
    if (!isMatch) {
      console.warn(`[SECURITY] Failed password attempt for: ${identifier}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { studentId: student.student_id, email: student.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.setHeader("Set-Cookie", serialize("studentAuthToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // ✅ FIXED
      maxAge: 3600,
      path: "/",
    }));

    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
