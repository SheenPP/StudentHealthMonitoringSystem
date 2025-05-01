import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../../lib/db";
import jwt from "jsonwebtoken";
import { parse } from "cookie";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

interface PendingAccount {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cookies = parse(req.headers.cookie || "");
  const token = cookies.adminAuthToken;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. No token provided." });
  }

  try {
    jwt.verify(token, SECRET_KEY);

    // Get both students and teachers from unified 'accounts' table
    const [accounts] = await pool.query(
      `
      SELECT 
        id, 
        CONCAT(first_name, ' ', last_name) AS name, 
        email,
        role
      FROM accounts 
      WHERE status = 'pending' 
        AND role IN ('student', 'teacher')
      `
    );

    // Keep these legacy queries (optional, might be removed later)
    const [users] = await pool.query(
      "SELECT id, CONCAT(firstname, ' ', lastname) AS name, email FROM users WHERE status = 'pending'"
    );
    const [admins] = await pool.query(
      "SELECT admin_id AS id, username AS name, email FROM admin_accounts WHERE status = 'pending'"
    );

    res.status(200).json({ accounts, users, admins });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error fetching pending accounts:", error);
    }
    res.status(500).json({ error: "Server error" });
  }
}
