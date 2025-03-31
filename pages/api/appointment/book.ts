import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../../lib/db";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

interface JwtPayload {
  studentId: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  try {
    // 🛡 Extract token from HTTP-only cookies
    const cookies = parse(req.headers.cookie || "");
    const token = cookies.studentAuthToken;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. No token provided." });
    }

    // 🔑 Verify JWT
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const studentId = decoded.studentId;

    if (!studentId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    const { date, time, reason } = req.body;

    if (!date || !time || !reason) {
      return res.status(400).json({ error: "Missing required fields (date, time, reason)." });
    }

    const appointmentDate = new Date(date);
    const currentDate = new Date();

    if (appointmentDate.getTime() < currentDate.setHours(0, 0, 0, 0)) {
      return res.status(400).json({ error: "Cannot book an appointment for a past date." });
    }

    if (appointmentDate.toDateString() === currentDate.toDateString()) {
      const appointmentTime = new Date(`${date}T${time}`);
      if (appointmentTime.getTime() < currentDate.getTime()) {
        return res.status(400).json({ error: "Cannot book an appointment for a past time today." });
      }
    }

    // ✅ Prevent duplicate bookings
    const [existingAppointments] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM appointments 
       WHERE student_id = ? AND date = ? AND time = ? 
       AND status IN ('pending', 'approved')`,
      [studentId, date, time]
    );

    if (existingAppointments.length > 0) {
      return res.status(409).json({ error: "You already have an appointment at this date and time." });
    }

    // 📌 Insert appointment
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO appointments 
       (student_id, date, time, reason, status, admin_approval, user_approval, created_at) 
       VALUES (?, ?, ?, ?, 'pending', 'pending', 'pending', NOW())`,
      [studentId, date, time, reason]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: "Failed to book appointment." });
    }

    return res.status(201).json({ message: "Appointment booked successfully." });
  } catch (error: unknown) {
    console.error("Error booking appointment:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
