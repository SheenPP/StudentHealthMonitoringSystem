import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import pool from "../../../lib/db";
import { RowDataPacket } from "mysql2";

// Password rule: 8+ chars, upper/lowercase, number, special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

interface StudentRow extends RowDataPacket {
  password_hash: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed. Use PATCH." });
  }

  const { userId, currentPassword, newPassword, confirmPassword } = req.body;

  // ✅ Validate inputs
  if (!userId || !currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "New password and confirmation do not match." });
  }

  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
    });
  }

  try {
    // 🔍 Fetch existing student by ID
    const [rows] = await pool.query<StudentRow[]>(
      "SELECT password_hash FROM accounts WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    // 🔐 Hash the new password
    const newHashed = await bcrypt.hash(newPassword, 12);

    // 💾 Update password in the database
    await pool.query("UPDATE accounts SET password_hash = ? WHERE user_id = ?", [
      newHashed,
      userId,
    ]);

    return res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}
