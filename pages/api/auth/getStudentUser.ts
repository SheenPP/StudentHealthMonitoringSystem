import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import pool from "../../../lib/db";
import { RowDataPacket } from "mysql2";
import { parse } from "cookie";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

interface StudentRow extends RowDataPacket {
  student_id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
  photo_path: string | null;
}

// ✅ Define JWT payload structure
interface JwtPayload {
  studentId: number;
  iat?: number;
  exp?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cookies = parse(req.headers.cookie || "");
    const token = cookies.studentAuthToken;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. No token provided." });
    }

    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;

    const studentId = decoded.studentId;

    if (!studentId) {
      return res.status(401).json({ error: "Invalid token payload." });
    }

    const [students] = await pool.query<StudentRow[]>(
      `SELECT sa.student_id, sa.first_name, sa.middle_name, sa.last_name, sa.email, sa.status, sa.created_at, s.photo_path
       FROM studentaccount sa
       LEFT JOIN students s ON sa.student_id = s.student_id
       WHERE sa.student_id = ?`,
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = students[0];

    return res.status(200).json({
      student_id: student.student_id,
      first_name: student.first_name,
      middle_name: student.middle_name,
      last_name: student.last_name,
      email: student.email,
      status: student.status,
      created_at: student.created_at,
      photo_path: student.photo_path,
    });
  } catch (error) {
    console.error("Error fetching student user:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
