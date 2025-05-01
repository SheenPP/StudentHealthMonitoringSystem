import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import type { RowDataPacket } from "mysql2";

type AppointmentApproval = {
  admin_approval: string;
  user_approval: string;
};

// ✅ GET - Fetch all appointments with user details
export async function GET() {
  try {
    const [appointments] = await db.query(`
      SELECT 
        a.id, 
        a.user_id, 
        acc.first_name, 
        acc.last_name, 
        a.date, 
        a.time, 
        a.reason, 
        a.status, 
        a.admin_approval, 
        a.user_approval, 
        a.created_at, 
        a.updated_at
      FROM appointments a
      LEFT JOIN accounts acc ON a.user_id = acc.user_id
    `);

    return NextResponse.json(appointments, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ PUT - Update admin approval
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // Extract appointment ID

    if (!id) {
      return NextResponse.json({ error: "Missing appointment ID" }, { status: 400 });
    }

    const { admin_approval } = await req.json();

    if (!admin_approval) {
      return NextResponse.json({ error: "Missing admin approval status" }, { status: 400 });
    }

    const [rows] = await db.query<AppointmentApproval[] & RowDataPacket[]>(
      "SELECT admin_approval, user_approval FROM appointments WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const currentUserApproval = rows[0].user_approval;
    let newStatus = "pending";

    if (admin_approval === "approved" || currentUserApproval === "approved") {
      newStatus = "approved";
    }

    if (admin_approval === "rejected" || currentUserApproval === "rejected") {
      newStatus = "rejected";
    }

    await db.query(
      "UPDATE appointments SET status = ?, admin_approval = ?, updated_at = NOW() WHERE id = ?",
      [newStatus, admin_approval, id]
    );

    return NextResponse.json(
      {
        message: "Appointment updated successfully",
        status: newStatus,
        admin_approval,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
