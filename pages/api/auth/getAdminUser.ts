import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import pool from "../../../lib/db";
import { parse } from "cookie";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get the token from cookies instead of headers
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.adminAuthToken;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. No token provided." });
  }

  try {
    // Verify JWT
    const decoded: any = jwt.verify(token, SECRET_KEY);

    // Fetch admin details from the database
    const [admins] = await pool.query(
      "SELECT admin_id, username, email, role, position FROM admin_accounts WHERE admin_id = ?",
      [decoded.adminId]
    );

    if ((admins as any).length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Return admin details
    res.status(200).json({ user: (admins as any)[0] });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
