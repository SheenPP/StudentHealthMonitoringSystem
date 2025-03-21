import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../../../lib/db";
import rateLimit from "express-rate-limit";
import { serialize } from "cookie";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// 🚀 Rate Limiter: Prevent Brute Force Attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts
  message: { error: "Too many login attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await limiter(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: "Student ID/Email and password are required" });
    }

    try {
      // 🛡 Check if student exists (By Student ID or Email)
      const [students] = await pool.query(
        "SELECT * FROM studentaccount WHERE student_id = ? OR email = ?",
        [identifier, identifier]
      );

      if ((students as any).length === 0) {
        console.warn(`[SECURITY] Failed login attempt for: ${identifier}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const student = (students as any)[0];

      // 🚀 Check if account is approved
      if (student.status !== "approved") {
        return res.status(403).json({ error: "Your account has not been approved yet." });
      }

      // 🔑 Verify Password
      const isMatch = await bcrypt.compare(password, student.password_hash);
      if (!isMatch) {
        console.warn(`[SECURITY] Failed password attempt for: ${identifier}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // 🔐 Generate Secure JWT Token
      const token = jwt.sign(
        { studentId: student.student_id, email: student.email },
        SECRET_KEY,
        { expiresIn: "1h" }
      );

      // 🍪 Set Secure HTTP-Only Cookie
      res.setHeader("Set-Cookie", serialize("studentAuthToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Secure in production
        sameSite: "Strict",
        maxAge: 3600, // 1 hour
        path: "/",
      }));

      return res.status(200).json({ message: "Login successful" });
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
}
