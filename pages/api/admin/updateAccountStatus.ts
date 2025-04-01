import type { NextApiRequest, NextApiResponse } from "next";
import pool from "../../../lib/db";
import jwt from "jsonwebtoken";
import { parse } from "cookie";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    jwt.verify(token, SECRET_KEY);

    const { id, type, status } = req.body;

    if (!id || !type || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let table: string, idColumn: string;

    switch (type) {
      case "student":
        table = "studentaccount";
        idColumn = "student_id";
        break;
      case "user":
        table = "users";
        idColumn = "id";
        break;
      case "admin":
        table = "admin_accounts";
        idColumn = "admin_id";
        break;
      default:
        return res.status(400).json({ error: "Invalid type provided" });
    }

    await pool.query(`UPDATE ${table} SET status = ? WHERE ${idColumn} = ?`, [status, id]);

    return res.status(200).json({ message: `${type} ${status} successfully` });
  } catch (error: unknown) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    console.error("Error updating account status:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
