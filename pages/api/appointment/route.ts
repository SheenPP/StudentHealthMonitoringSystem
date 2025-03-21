import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../../lib/db"; // Ensure this path is correct
import { RowDataPacket } from "mysql2";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Extract token from HTTP-only cookies
    const cookies = parse(req.headers.cookie || "");
    const token = cookies.studentAuthToken;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. No token provided." });
    }

    // Verify and decode JWT
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const studentId = (decoded as any).studentId;

    if (!studentId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    console.log("Authenticated studentId:", studentId);

    // Fetch appointments only for the authenticated student
    const [appointments] = await pool.query<RowDataPacket[]>(
      "SELECT id, student_id, date, time, reason, status, admin_approval, user_approval, created_at, updated_at FROM appointments WHERE student_id = ? ORDER BY date DESC",
      [studentId]
    );

    console.log("Database response:", appointments); // ✅ Log fetched data

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ error: `No appointments found.` });
    }

    return res.status(200).json({ appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
