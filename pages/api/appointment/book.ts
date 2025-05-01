import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../../lib/db";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

interface JwtPayload {
  user_id: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  try {
    const cookies = parse(req.headers.cookie || "");
    const token = cookies.userAuthToken;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. No token provided." });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = decoded.user_id;
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

    // ✅ Prevent more than one appointment per user per day
    const [existingForDay] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM appointments 
       WHERE user_id = ? AND date = ? 
       AND status IN ('pending', 'approved')`,
      [userId, date]
    );

    if (existingForDay.length > 0) {
      return res.status(409).json({ error: "You already have an appointment booked for this day." });
    }

    // ✅ Prevent duplicate appointments at the same time
    const [existingAppointments] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM appointments 
       WHERE user_id = ? AND date = ? AND time = ? 
       AND status IN ('pending', 'approved')`,
      [userId, date, time]
    );

    if (existingAppointments.length > 0) {
      return res.status(409).json({ error: "You already have an appointment at this date and time." });
    }

    // ✅ Get current active school term
    const [activeTermResult] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM school_terms WHERE is_active = 1 LIMIT 1"
    );
    const activeTermId = activeTermResult[0]?.id;

    if (!activeTermId) {
      return res.status(400).json({ error: "No active school term found." });
    }

    // 📌 Insert appointment
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO appointments 
       (user_id, date, time, reason, status, admin_approval, user_approval, term_id, created_at) 
       VALUES (?, ?, ?, ?, 'pending', 'pending', 'pending', ?, NOW())`,
      [userId, date, time, reason, activeTermId]
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
