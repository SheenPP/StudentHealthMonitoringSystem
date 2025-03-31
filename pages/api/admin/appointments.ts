import { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db"; // Import MySQL connection
import type { RowDataPacket } from "mysql2";

type AppointmentApproval = {
  admin_approval: string;
  user_approval: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // Fetch appointments with student first and last name
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

      return res.status(200).json(appointments);
    }

    if (req.method === "PUT") {
      const { id } = req.query;
      const { admin_approval } = req.body;

      if (!id || !admin_approval) {
        return res.status(400).json({ error: "Missing appointment ID or admin approval status" });
      }

      // ✅ Properly typed DB query result
      const [existingAppointments] = await db.query<AppointmentApproval[] & RowDataPacket[]>(
        "SELECT admin_approval, user_approval FROM appointments WHERE id = ?",
        [id]
      );

      if (existingAppointments.length === 0) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      const currentUserApproval = existingAppointments[0].user_approval;
      let newStatus = "pending";

      // If either the admin or user approves, set status to "approved"
      if (admin_approval === "approved" || currentUserApproval === "approved") {
        newStatus = "approved";
      }

      // If either rejects, mark as "rejected"
      if (admin_approval === "rejected" || currentUserApproval === "rejected") {
        newStatus = "rejected";
      }

      // Update the database
      await db.query(
        "UPDATE appointments SET status = ?, admin_approval = ?, updated_at = NOW() WHERE id = ?",
        [newStatus, admin_approval, id]
      );

      return res.status(200).json({
        message: "Appointment updated successfully",
        status: newStatus,
        admin_approval,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
