import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db";
import { RowDataPacket } from "mysql2";

interface StatsResult extends RowDataPacket {
  pending: number;
  approved: number;
  rejected: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { term_id } = req.query;
  const termFilter = term_id ? "WHERE term_id = ?" : "";
  const values = term_id ? [term_id] : [];

  try {
    // Appointment Stats (with term_id filter)
    const [appointmentRows] = await db.query<StatsResult[]>(
      `
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected
      FROM appointments
      ${termFilter}
    `,
      values
    );

    // Admin Users (from users table — not filtered by term)
    const [userRows] = await db.query<StatsResult[]>(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected
      FROM users
    `);

    // Students (from accounts where role = 'student')
    const [studentRows] = await db.query<StatsResult[]>(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected
      FROM accounts
      WHERE role = 'student'
    `);

    // Teachers (from accounts where role = 'teacher')
    const [teacherRows] = await db.query<StatsResult[]>(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected
      FROM accounts
      WHERE role = 'teacher'
    `);

    const appointmentStats = appointmentRows[0] || { pending: 0, approved: 0, rejected: 0 };
    const userOnly = userRows[0] || { pending: 0, approved: 0, rejected: 0 };
    const studentOnly = studentRows[0] || { pending: 0, approved: 0, rejected: 0 };
    const teacherOnly = teacherRows[0] || { pending: 0, approved: 0, rejected: 0 };

    const userStats = {
      pending: userOnly.pending + studentOnly.pending + teacherOnly.pending,
      approved: userOnly.approved + studentOnly.approved + teacherOnly.approved,
      rejected: userOnly.rejected + studentOnly.rejected + teacherOnly.rejected,
    };

    return res.status(200).json({
      appointmentStats,
      userStats,
      userOnly,
      studentOnly,
      teacherOnly,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
