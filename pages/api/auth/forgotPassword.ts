import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../../lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { RowDataPacket } from "mysql2";

interface StudentRow extends RowDataPacket {
  email: string;
  reset_token: string;
  // Add other fields from studentaccount as needed
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email } = req.body;
  console.log("📧 Requested email:", email);

  try {
    const [rows] = await pool.query<StudentRow[]>("SELECT * FROM studentaccount WHERE email = ?", [email]);
    console.log("🔎 Found users:", rows);

    if (rows.length === 0) return res.status(404).json({ error: "Email not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const resetLink = `${process.env.BASE_URL}/student/reset-password/${token}`;
    console.log("🔗 Generated reset link:", resetLink);

    await pool.query("UPDATE studentaccount SET reset_token = ? WHERE email = ?", [token, email]);
    console.log("✅ Token saved to database");

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const result = await transporter.sendMail({
      to: email,
      subject: "Reset your BISU Clinic password",
      html: `<p>Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    });

    console.log("📬 Email sent:", result);

    return res.status(200).json({ message: "Reset link sent to your email." });
  } catch (error) {
    const err = error as Error;
    console.error("❌ Forgot Password Error:", err.message || err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
