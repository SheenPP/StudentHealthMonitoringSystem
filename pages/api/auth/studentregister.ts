import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import pool from "../../../lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Password must be at least 8 characters with uppercase, lowercase, number, and special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
// Name validation (letters, spaces, dashes, and dots allowed)
const nameRegex = /^[a-zA-Z\s\-.]+$/;

// ✅ Type for checking existing student
interface ExistingStudentRow extends RowDataPacket {
  student_id: string;
  email: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { studentId, firstName, middleName, lastName, email, password } = req.body;

  // 🛡 Validate Required Fields
  if (!studentId || !firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: "All required fields must be provided." });
  }

  // ✅ Validate Input Formats
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }
  if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
    return res.status(400).json({ error: "Names can only contain letters, spaces, dashes, and dots." });
  }
  if (middleName && !nameRegex.test(middleName)) {
    return res.status(400).json({ error: "Middle name contains invalid characters." });
  }
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
    });
  }

  try {
    // 🔍 Check if the student ID or email already exists
    const [existingStudent] = await pool.query<ExistingStudentRow[]>(
      "SELECT student_id, email FROM studentaccount WHERE student_id = ? OR email = ?",
      [studentId, email]
    );

    if (existingStudent.length > 0) {
      return res.status(409).json({ error: "Student ID or email already exists." });
    }

    // 🔒 Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 📌 Insert the new student into the database
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO studentaccount (student_id, first_name, middle_name, last_name, email, password_hash, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [studentId, firstName, middleName || null, lastName, email, hashedPassword]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: "Registration failed. Please try again." });
    }

    // 🎉 Success
    return res.status(201).json({ message: "Student registered successfully. Awaiting approval." });
  } catch (error) {
    console.error("Error registering student:", error);
    return res.status(500).json({ error: "Internal Server Error. Please try again later." });
  }
}
