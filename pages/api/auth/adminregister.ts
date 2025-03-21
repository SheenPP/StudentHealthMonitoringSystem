import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import pool from "../../../lib/db"; // Ensure your MySQL connection is set up

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { fullName, email, password } = req.body;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Full name, email, and password are required" });
  }

  try {
    // Check if the email already exists
    const [existingAdmin] = await pool.query("SELECT * FROM admin_accounts WHERE email = ?", [
      email,
    ]);
    if (existingAdmin.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert the new admin into the database
    await pool.query("INSERT INTO admin_accounts (full_name, email, password) VALUES (?, ?, ?)", [
      fullName,
      email,
      hashedPassword,
    ]);

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({ error: "Server error" });
  }
}
