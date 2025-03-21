import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../../lib/db";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id, type, status } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    jwt.verify(token, SECRET_KEY);

    let table, idColumn;
    
    // Assign correct table and ID column based on type
    if (type === "student") {
      table = "studentaccount";
      idColumn = "student_id"; // Ensure this matches your DB schema
    } else if (type === "user") {
      table = "users";
      idColumn = "id"; // Ensure this matches your DB schema
    } else if (type === "admin") {
      table = "admin_accounts";
      idColumn = "admin_id"; // Ensure this matches your DB schema
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    // Update status with correct ID column
    await pool.query(`UPDATE ${table} SET status = ? WHERE ${idColumn} = ?`, [status, id]);

    res.status(200).json({ message: `${type} ${status} successfully` });
  } catch (error) {
    console.error("Error updating account status:", error);
    res.status(500).json({ error: "Server error" });
  }
}
