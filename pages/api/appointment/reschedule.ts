import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db";
import nodemailer from "nodemailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Missing appointment ID" });
  }

  try {
    // Get student's email and first_name by joining with studentaccount
    const [rows] = await db.query(
      `SELECT s.email, s.first_name
       FROM appointments a
       JOIN studentaccount s ON a.student_id = s.student_id
       WHERE a.id = ?`,
      [id]
    );

    const student = Array.isArray(rows) ? (rows[0] as any) : null;

    if (!student?.email) {
      return res.status(404).json({ error: "Student not found or missing email." });
    }

    // Update appointment status
    await db.query("UPDATE appointments SET status = 'reschedule' WHERE id = ?", [id]);

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"BISU Clinic" <${process.env.EMAIL_USER}>`,
      to: student.email,
      subject: "Appointment For Reschedule",
      text: `Hello ${student.first_name},\n\nYour appointment has been marked for reschedule. Please log in to the BISU Clinic system to book a new date.\n\nThank you.`,
    });

    return res.status(200).json({ message: "Email sent and status updated." });
  } catch (error) {
    console.error("Reschedule error:", error);
    return res.status(500).json({ error: "Failed to mark for reschedule." });
  }
}
