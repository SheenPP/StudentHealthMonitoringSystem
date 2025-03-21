import { NextResponse } from "next/server";
import db from "../../../../lib/db"; // Adjust the path if needed

export async function GET() {
  try {
    const [appointmentStats]: any = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected
      FROM appointments
    `);

    const [userStats]: any = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected
      FROM users
    `);

    return NextResponse.json({ appointmentStats: appointmentStats[0], userStats: userStats[0] });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
