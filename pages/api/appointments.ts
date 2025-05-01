import { NextApiRequest, NextApiResponse } from "next";
import db from "../../lib/db";
import { RowDataPacket } from "mysql2";

interface AppointmentStatus extends RowDataPacket {
  admin_approval: string;
  user_approval: string;
  status: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const { term_id, status } = req.query;

      let query = `
        SELECT 
          a.id, 
          a.user_id, 
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
        LEFT JOIN accounts s ON a.user_id = s.user_id
      `;

      const conditions: string[] = [];
      const values: (string | number)[] = [];

      if (term_id) {
        conditions.push("a.term_id = ?");
        values.push(term_id as string);
      }

      if (status) {
        conditions.push("a.status = ?");
        values.push(status as string);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      query += " ORDER BY a.date DESC";

      const [appointments] = await db.query<RowDataPacket[]>(query, values);
      return res.status(200).json(appointments);
    }

    if (req.method === "PUT") {
      const { id } = req.query;
      const { admin_approval, user_approval } = req.body;

      if (!id) return res.status(400).json({ error: "Missing appointment ID" });

      const [existingAppointments] = await db.query<AppointmentStatus[]>(
        "SELECT admin_approval, user_approval, status FROM appointments WHERE id = ?",
        [id]
      );

      if (existingAppointments.length === 0)
        return res.status(404).json({ error: "Appointment not found" });

      let currentAdminApproval = existingAppointments[0].admin_approval;
      let currentUserApproval = existingAppointments[0].user_approval;
      let newStatus = existingAppointments[0].status;
      let approvedBy = "";

      if (admin_approval) {
        currentAdminApproval = admin_approval;
        approvedBy = "admin";
      }

      if (user_approval) {
        currentUserApproval = user_approval;
        approvedBy = approvedBy ? "both" : "user";
      }

      if (currentAdminApproval === "approved" || currentUserApproval === "approved") {
        newStatus = "approved";
      }

      if (currentAdminApproval === "rejected" || currentUserApproval === "rejected") {
        newStatus = "rejected";
        approvedBy = "";
      }

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
