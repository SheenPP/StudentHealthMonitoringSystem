import { NextApiRequest, NextApiResponse } from "next";
import db from "../../lib/db"; // Import MySQL connection
import { RowDataPacket } from "mysql2"; // For query typing

// Define expected structure of appointment row for PUT logic
interface AppointmentStatus extends RowDataPacket {
  admin_approval: string;
  user_approval: string;
  status: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // Fetch appointments with student first and last names
      const [appointments] = await db.query<RowDataPacket[]>(`
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

      return res.status(200).json(appointments);
    }

    if (req.method === "PUT") {
      const { id } = req.query;
      const { admin_approval, user_approval } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Missing appointment ID" });
      }

      // Fetch current appointment status
      const [existingAppointments] = await db.query<AppointmentStatus[]>(
        "SELECT admin_approval, user_approval, status FROM appointments WHERE id = ?",
        [id]
      );

      if (existingAppointments.length === 0) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      let currentAdminApproval = existingAppointments[0].admin_approval;
      let currentUserApproval = existingAppointments[0].user_approval;
      let newStatus = existingAppointments[0].status;
      let approvedBy = "";

      // Update approval values if provided
      if (admin_approval) {
        currentAdminApproval = admin_approval;
        approvedBy = "admin";
      }

      if (user_approval) {
        currentUserApproval = user_approval;
        approvedBy = approvedBy ? "both" : "user"; // If admin already approved, mark both
      }

      // Mark status as "approved" if either admin or user approves
      if (currentAdminApproval === "approved" || currentUserApproval === "approved") {
        newStatus = "approved";
      }

      // If either rejects, mark as rejected
      if (currentAdminApproval === "rejected" || currentUserApproval === "rejected") {
        newStatus = "rejected";
        approvedBy = ""; // Reset who approved since it's rejected
      }

      // Update appointment status
      await db.query(
        "UPDATE appointments SET status = ?, admin_approval = ?, user_approval = ?, updated_at = NOW() WHERE id = ?",
        [newStatus, currentAdminApproval, currentUserApproval, id]
      );

      return res.status(200).json({
        message: "Appointment updated successfully",
        status: newStatus,
        approved_by: approvedBy,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
