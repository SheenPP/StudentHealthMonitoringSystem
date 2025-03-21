import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db"; // Adjust the path based on your structure

// ✅ GET - Fetch all appointments
export async function GET() {
  try {
    const [appointments] = await db.query(`
      SELECT 
        a.id, 
        a.student_id, 
        s.first_name, 
        s.last_name, 
        a.date, 
        a.time, 
        a.reason, 
        a.status, 
        a.admin_approval, 
        a.user_approval, 
        a.created_at, 
        a.updated_at
      FROM appointments a
      LEFT JOIN studentaccount s ON a.student_id = s.student_id
    `);

    return NextResponse.json(appointments, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ PUT - Update admin approval (adjusted for App Router)
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // Extracts ID from the URL

    if (!id) {
      return NextResponse.json({ error: "Missing appointment ID" }, { status: 400 });
    }

    const { admin_approval } = await req.json();
    if (!admin_approval) {
      return NextResponse.json({ error: "Missing admin approval status" }, { status: 400 });
    }

    // Fetch current appointment details
    const [existingAppointments]: any = await db.query(
      "SELECT admin_approval, user_approval FROM appointments WHERE id = ?",
      [id]
    );

    if (existingAppointments.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    let currentUserApproval = existingAppointments[0].user_approval;
    let newStatus = "pending";

    // ✅ If either admin or user approves, mark as "approved"
    if (admin_approval === "approved" || currentUserApproval === "approved") {
      newStatus = "approved";
    }

    // ❌ If either rejects, mark as "rejected"
    if (admin_approval === "rejected" || currentUserApproval === "rejected") {
      newStatus = "rejected";
    }

    // ✅ Update the database
    await db.query(
      "UPDATE appointments SET status = ?, admin_approval = ?, updated_at = NOW() WHERE id = ?",
      [newStatus, admin_approval, id]
    );

    return NextResponse.json({
      message: "Appointment updated successfully",
      status: newStatus,
      admin_approval,
    }, { status: 200 });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
