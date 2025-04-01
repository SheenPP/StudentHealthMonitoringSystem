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

  try {
    const [appointmentRows] = await db.query<StatsResult[]>(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected
      FROM appointments
    `);

    const [userRows] = await db.query<StatsResult[]>(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected
      FROM users
    `);

    const [studentRows] = await db.query<StatsResult[]>(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected
      FROM studentaccount
    `);

    const appointmentStats = appointmentRows[0] || { pending: 0, approved: 0, rejected: 0 };
    const userOnly = userRows[0] || { pending: 0, approved: 0, rejected: 0 };
    const studentOnly = studentRows[0] || { pending: 0, approved: 0, rejected: 0 };

    const userStats = {
      pending: userOnly.pending + studentOnly.pending,
      approved: userOnly.approved + studentOnly.approved,
      rejected: userOnly.rejected + studentOnly.rejected,
    };

    return res.status(200).json({
      appointmentStats,
      userStats,
      userOnly,
      studentOnly,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
