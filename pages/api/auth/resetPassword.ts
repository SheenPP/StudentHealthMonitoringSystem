import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import pool from "../../../lib/db";
import { RowDataPacket } from "mysql2";

// ✅ Password validation regex
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// ✅ Define the expected structure of a row in studentaccount
interface StudentRow extends RowDataPacket {
  email: string;
  reset_token: string | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Missing token or password" });
  }

  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
    });
  }

  try {
    const [rows] = await pool.query<StudentRow[]>(
      "SELECT * FROM accounts WHERE reset_token = ?",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const email = rows[0].email;

    await pool.query(
      "UPDATE accounts SET password_hash = ?, reset_token = NULL WHERE email = ?",
      [hashedPassword, email]
    );

    return res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
