import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import pool from "../../../lib/db";
import { parse } from "cookie";
import { RowDataPacket } from "mysql2";

// ✅ Secret key for JWT verification
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// ✅ Type for the decoded JWT payload
interface JwtPayload {
  adminId: number;
}

// ✅ Type for a row from the admin_accounts table
interface AdminRow extends RowDataPacket {
  admin_id: number;
  username: string;
  email: string;
  role: string;
  position: string;
  profile_picture: string | null;
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
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;

    const [admins] = await pool.query<AdminRow[]>(
      "SELECT admin_id, username, email, role, position, profile_picture FROM admin_accounts WHERE admin_id = ?",
      [decoded.adminId]
    );

    if (admins.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const admin = admins[0];

    res.status(200).json({
      user: {
        id: admin.admin_id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        position: admin.position,
        profilePicture: admin.profile_picture || null,
      },
    });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
