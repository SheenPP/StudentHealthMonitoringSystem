import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import pool from "../../../lib/db";
import { RowDataPacket } from "mysql2";
import { parse } from "cookie";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🛡 Extract token from HTTP-only cookies
    const cookies = parse(req.headers.cookie || "");
    const token = cookies.studentAuthToken; // Match cookie name from login API

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. No token provided." });
    }

    // 🔑 Verify and decode JWT
    const decoded: any = jwt.verify(token, SECRET_KEY);
    const studentId = decoded.studentId; // Ensure correct ID

    if (!studentId) {
      return res.status(401).json({ error: "Invalid token payload." });
    }

    // 🛢 Fetch student details from the database
    const [students] = await pool.query<RowDataPacket[]>(
      "SELECT student_id, first_name, middle_name, last_name, email, status, created_at FROM studentaccount WHERE student_id = ?",
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = students[0];

    // ✅ Return student details (excluding password)
    return res.status(200).json({
      student_id: student.student_id,
      first_name: student.first_name,
      middle_name: student.middle_name,
      last_name: student.last_name,
      email: student.email,
      status: student.status,
      created_at: student.created_at,
    });
  } catch (error) {
    console.error("Error fetching student user:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
 