import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db";
import nodemailer from "nodemailer";

interface UserInfo {
  email: string;
  first_name: string;
}

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id, reason } = req.body;

  if (!id || !reason) {
    return res.status(400).json({ error: "Missing appointment ID or reason." });
  }

  try {
    // Fetch user's email and first name using user_id
    const [rows] = await db.query(
      `SELECT acc.email, acc.first_name
       FROM appointments a
       JOIN accounts acc ON a.user_id = acc.user_id
       WHERE a.id = ?`,
      [id]
    );

    const user = Array.isArray(rows) ? (rows[0] as UserInfo) : null;

    if (!user?.email) {
      return res.status(404).json({ error: "User not found or missing email." });
    }

    const capitalizedFirstName = capitalize(user.first_name);

    // Update appointment status to reschedule
    await db.query("UPDATE appointments SET status = 'reschedule', updated_at = NOW() WHERE id = ?", [id]);

    // Send email with reschedule reason
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"BISU Clinic" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Appointment For Reschedule",
      text: `Hello ${capitalizedFirstName},\n\nYour appointment has been marked for reschedule.\n\nReason: "${reason}"\n\nPlease log in to the BISU Clinic system to book a new date.\n\nThank you.`,
    });

    return res.status(200).json({ message: "Email sent and status updated." });
  } catch (error) {
    console.error("Reschedule error:", error);
    return res.status(500).json({ error: "Failed to mark for reschedule." });
  }
}
