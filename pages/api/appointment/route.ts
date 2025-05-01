import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../../lib/db";
import { RowDataPacket } from "mysql2";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// Define the expected payload from the JWT token
interface JwtPayload {
  user_id: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cookies = parse(req.headers.cookie || "");
    const token = cookies.userAuthToken;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. No token provided." });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = decoded.user_id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    console.log("Authenticated userId:", userId);

    const [appointments] = await pool.query<RowDataPacket[]>(
      `SELECT id, user_id, date, time, reason, status, admin_approval, user_approval, created_at, updated_at 
       FROM appointments 
       WHERE user_id = ? 
       ORDER BY date DESC`,
      [userId]
    );

    console.log("Database response:", appointments);

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({
        appointments: [],
        message: "No appointments found for this user.",
      });
    }
    

    return res.status(200).json({ appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
