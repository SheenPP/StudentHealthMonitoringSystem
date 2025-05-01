import { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db";

// Helper function to calculate age from date of birth
const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const ageDate = new Date();
  let age = ageDate.getFullYear() - birthDate.getFullYear();
  const month = ageDate.getMonth() - birthDate.getMonth();
  if (month < 0 || (month === 0 && ageDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET method
  if (req.method === "GET") {
    const { user_id } = req.query;

    try {
      const query = user_id
        ? "SELECT * FROM user_profiles WHERE user_id = ?"
        : "SELECT * FROM user_profiles";
      const values = user_id ? [user_id] : [];

      const [rows] = await db.execute(query, values);
      return res.status(200).json(user_id ? (rows as any)[0] : rows);
    } catch (error) {
      console.error("Error fetching user profiles:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Handle PUT method for updating an existing user's profile
  if (req.method === "PUT") {
    const user_id = Array.isArray(req.query.user_id) ? req.query.user_id[0] : req.query.user_id;
  
    const {
      user_id: new_user_id,
      role,
      first_name,
      middle_name,
      last_name,
      gender,
      date_of_birth,
      email,
      phone_number,
      present_address,
      home_address,
      photo_path,
      medical_history,
      emergency_contact_name,
      emergency_contact_relation,
      emergency_contact_phone,
      department,
      course,
      year,
    } = req.body;
  
    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id in query" });
    }
  
    const conn = await db.getConnection();
    await conn.beginTransaction();
  
    try {
      const age = calculateAge(date_of_birth);
      let finalUserId = user_id;
  
      const isChangingUserId = new_user_id && new_user_id !== user_id;
  
      if (isChangingUserId) {
        // Step 0: Check if new_user_id already exists
        const [existing] = await conn.execute("SELECT 1 FROM accounts WHERE user_id = ?", [new_user_id]);
        if ((existing as any[]).length > 0) {
          await conn.rollback();
          conn.release();
          return res.status(409).json({ error: "User ID already exists in accounts" });
        }
  
        // ✅ Step 1: Fetch full original account
        const [originalResult] = await conn.execute(
          "SELECT * FROM accounts WHERE user_id = ?",
          [user_id]
        );
        const original = (originalResult as any[])[0];
  
        if (!original) {
          await conn.rollback();
          conn.release();
          return res.status(404).json({ error: "Original account not found." });
        }
  
        // ✅ Step 2: Insert full copy with new_user_id
        await conn.execute(
          `INSERT INTO accounts (
            user_id, email, first_name, middle_name, last_name,
            password_hash, status, reset_token, created_at, role
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            new_user_id,
            original.email,
            original.first_name,
            original.middle_name,
            original.last_name,
            original.password_hash,
            original.status,
            original.reset_token,
            original.created_at,
            original.role,
          ]
        );
  
        // ✅ Step 3: Update FK references
        await conn.execute("UPDATE appointments SET user_id = ? WHERE user_id = ?", [new_user_id, user_id]);
        await conn.execute("UPDATE health_records SET user_id = ? WHERE user_id = ?", [new_user_id, user_id]);
        await conn.execute("UPDATE files SET user_id = ? WHERE user_id = ?", [new_user_id, user_id]);
        await conn.execute("UPDATE file_history SET user_id = ? WHERE user_id = ?", [new_user_id, user_id]);
  
        // ✅ Step 4: Update user_profiles
        await conn.execute("UPDATE user_profiles SET user_id = ? WHERE user_id = ?", [new_user_id, user_id]);
  
        // ✅ Step 5: Delete old account row
        await conn.execute("DELETE FROM accounts WHERE user_id = ?", [user_id]);
  
        finalUserId = new_user_id;
      }
  
      // ✅ Step 6: Update user_profiles fields
      await conn.execute(
        `UPDATE user_profiles SET 
          role = ?, first_name = ?, middle_name = ?, last_name = ?, gender = ?, 
          date_of_birth = ?, phone_number = ?, present_address = ?, home_address = ?, 
          photo_path = ?, medical_history = ?, emergency_contact_name = ?, emergency_contact_relation = ?, 
          emergency_contact_phone = ?, department = ?, course = ?, year = ?, age = ?
        WHERE user_id = ?`,
        [
          role,
          first_name,
          middle_name,
          last_name,
          gender,
          date_of_birth,
          phone_number,
          present_address,
          home_address,
          photo_path || null,
          medical_history || null,
          emergency_contact_name || null,
          emergency_contact_relation || null,
          emergency_contact_phone || null,
          department || null,
          course || null,
          year || null,
          age,
          finalUserId,
        ]
      );
  
      await conn.commit();
      conn.release();
  
      return res.status(200).json({
        message: "Profile updated successfully",
        updated_user_id: finalUserId,
      });
    } catch (error) {
      await conn.rollback();
      conn.release();
      console.error("Error updating user profile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  
  
  // Handle POST method for creating a new user profile
  if (req.method === "POST") {
    const {
      user_id,
      role,
      first_name,
      middle_name,
      last_name,
      gender,
      date_of_birth,
      email,
      phone_number,
      present_address,
      home_address,
      photo_path,
      medical_history,
      emergency_contact_name,
      emergency_contact_relation,
      emergency_contact_phone,
      department,
      course,
      year,
    } = req.body;

    try {
      const calculatedAge = calculateAge(date_of_birth);

      const [existing] = await db.execute(
        "SELECT id FROM user_profiles WHERE user_id = ?",
        [user_id]
      );

      if ((existing as any[]).length > 0) {
        return res.status(409).json({ error: "User ID already exists" });
      }

      const [result] = await db.execute(
        `INSERT INTO user_profiles (
          user_id, role, first_name, middle_name, last_name, gender, date_of_birth,
          email, phone_number, present_address, home_address, photo_path, medical_history,
          emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
          department, course, year, age
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          role,
          first_name,
          middle_name,
          last_name,
          gender,
          date_of_birth,
          email,
          phone_number,
          present_address,
          home_address,
          photo_path || null,
          medical_history || null,
          emergency_contact_name || null,
          emergency_contact_relation || null,
          emergency_contact_phone || null,
          department || null,
          course || null,
          year || null,
          calculatedAge,
        ]
      );

      return res.status(201).json({
        message: "Profile created successfully",
        id: (result as any).insertId,
        age: calculatedAge,
      });
    } catch (error) {
      console.error("Error inserting user profile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
