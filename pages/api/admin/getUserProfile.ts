import { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { email } = req.query;

    try {
      // Admin authorization
      const token = req.cookies["adminAuthToken"];
      if (!token) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const decoded = jwt.verify(token, SECRET_KEY) as { role: string };
      if (decoded.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Join accounts and user_profiles based on email
      const [rows] = await db.execute<any[]>(
        `SELECT 
          a.id AS user_id, 
          a.email, 
          a.role, 
          a.first_name AS account_first_name, 
          a.middle_name AS account_middle_name, 
          a.last_name AS account_last_name, 
          a.status AS account_status,
          up.first_name AS profile_first_name, 
          up.middle_name, 
          up.last_name AS profile_last_name,
          up.gender, 
          up.date_of_birth, 
          up.age, 
          up.phone_number, 
          up.present_address, 
          up.home_address, 
          up.photo_path, 
          up.medical_history, 
          up.department, 
          up.course, 
          up.year, 
          up.emergency_contact_name, 
          up.emergency_contact_relation, 
          up.emergency_contact_phone 
        FROM accounts a
        LEFT JOIN user_profiles up ON a.email = up.email
        WHERE a.email = ?`,
        [email]
      );

      // Check if user data exists
      if (rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Combine account and profile data
      const user = rows[0];
      const combinedData = {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        account_first_name: user.account_first_name,
        account_middle_name: user.account_middle_name,
        account_last_name: user.account_last_name,
        account_status: user.account_status,
        profile_first_name: user.profile_first_name,
        middle_name: user.middle_name,
        profile_last_name: user.profile_last_name,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        age: user.age,
        phone_number: user.phone_number,
        present_address: user.present_address,
        home_address: user.home_address,
        photo_path: user.photo_path,
        medical_history: user.medical_history,
        department: user.department,
        course: user.course,
        year: user.year,
        emergency_contact_name: user.emergency_contact_name,
        emergency_contact_relation: user.emergency_contact_relation,
        emergency_contact_phone: user.emergency_contact_phone
      };

      return res.status(200).json(combinedData);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
