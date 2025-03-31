import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db"; // MySQL pool (e.g. mysql2)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { studentId } = req.query;

  if (!studentId || typeof studentId !== "string") {
    return res.status(400).json({ message: "Invalid or missing student ID." });
  }

  switch (req.method) {
    case "GET":
      try {
        const [results] = await db.query(
          "SELECT * FROM students WHERE student_id = ?",
          [studentId]
        ) as [Array<any>, any];

        if (results.length === 0) {
          return res.status(404).json({ message: "Student not found." });
        }

        return res.status(200).json(results[0]);
      } catch (error) {
        console.error("Error fetching student:", error);
        return res.status(500).json({ message: "Failed to fetch student." });
      }

    case "PUT":
      try {
        const updatedData = req.body;

        const {
          firstName,
          lastName,
          department,
          date_of_birth,
          gender,
          phone_number,
          year,
          course,
          home_address,
          present_address,
          emergency_contact_name,
          emergency_contact_relation,
          emergency_contact_phone,
        } = updatedData;

        // Simple validation
        if (!firstName || !lastName || !department) {
          return res.status(400).json({ message: "Required fields are missing." });
        }

        const updateQuery = `
          UPDATE students
          SET 
            first_name = ?, last_name = ?, department = ?, date_of_birth = ?, gender = ?,
            phone_number = ?, year = ?, course = ?, home_address = ?, present_address = ?,
            emergency_contact_name = ?, emergency_contact_relation = ?, emergency_contact_phone = ?
          WHERE student_id = ?
        `;

        const updateValues = [
          firstName, lastName, department, date_of_birth, gender,
          phone_number, year, course, home_address, present_address,
          emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
          studentId
        ];

        const [updateResult] = await db.query(updateQuery, updateValues) as [any, any];

        if (updateResult.affectedRows === 0) {
          return res.status(404).json({ message: "Student not found or no changes made." });
        }

        return res.status(200).json({ message: "Student updated successfully." });
      } catch (error) {
        console.error("Error updating student:", error);
        return res.status(500).json({ message: "Failed to update student." });
      }

    default:
      res.setHeader("Allow", ["GET", "PUT"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
