import { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db";
import type { RowDataPacket } from "mysql2";

type AppointmentApproval = {
  admin_approval: string;
  user_approval: string;
  email?: string;
  first_name?: string;
};

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

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
          a.updated_at,
          a.term_id
        FROM appointments a
        LEFT JOIN accounts s ON a.user_id = s.user_id
      `;

      const values: any[] = [];
      const whereClauses: string[] = [];

      if (term_id) {
        whereClauses.push("a.term_id = ?");
        values.push(term_id);
      }

      if (status) {
        whereClauses.push("a.status = ?");
        values.push(status);
      }

      if (whereClauses.length > 0) {
        query += " WHERE " + whereClauses.join(" AND ");
      }

      query += " ORDER BY a.date DESC";

      const [appointments] = await db.query(query, values);
      return res.status(200).json(appointments);
    }

    if (req.method === "PUT") {
      const { id } = req.query;
      const { admin_approval, reason } = req.body;

      if (!id || !admin_approval) {
        return res.status(400).json({ error: "Missing appointment ID or admin approval status" });
      }

      const [existingAppointments] = await db.query<AppointmentApproval[] & RowDataPacket[]>(
        `SELECT a.user_id, a.admin_approval, a.user_approval, s.email, s.first_name 
         FROM appointments a 
         LEFT JOIN accounts s ON a.user_id = s.user_id 
         WHERE a.id = ?`,
        [id]
      );

      if (existingAppointments.length === 0) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      const appointment = existingAppointments[0];
      const currentUserApproval = appointment.user_approval;
      const studentEmail = appointment.email;
      const studentName = appointment.first_name ? capitalize(appointment.first_name) : "there";

      let newStatus = "pending";

      if (admin_approval === "approved" || currentUserApproval === "approved") {
        newStatus = "approved";
      }

      if (admin_approval === "rejected" || currentUserApproval === "rejected") {
        newStatus = "rejected";
      }

      // Update appointment record
      await db.query(
        "UPDATE appointments SET status = ?, admin_approval = ?, updated_at = NOW() WHERE id = ?",
        [newStatus, admin_approval, id]
      );

      if (studentEmail) {
        const nodemailer = require("nodemailer");

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        if (admin_approval === "rejected") {
          await transporter.sendMail({
            from: `"BISU Clinic" <${process.env.EMAIL_USER}>`,
            to: studentEmail,
            subject: "Appointment Rejected",
            text: `Hello ${studentName},\n\nYour appointment has been rejected for the following reason:\n\n"${reason}"\n\nPlease contact the clinic for further assistance.\n\nThank you.`,
          });
        }

        if (admin_approval === "approved") {
          await transporter.sendMail({
            from: `"BISU Clinic" <${process.env.EMAIL_USER}>`,
            to: studentEmail,
            subject: "Appointment Approved",
            text: `Hello ${studentName},\n\nGood news! Your appointment has been approved by the clinic. Please make sure to attend on your scheduled date.\n\nThank you.`,
          });
        }
      }

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
