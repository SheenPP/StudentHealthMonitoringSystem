import { NextApiRequest, NextApiResponse } from "next";
import db from "../../../lib/db"; // Replace with your database connection utility

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { studentId } = req.query;

  if (!studentId || typeof studentId !== "string") {
    return res.status(400).json({ message: "Invalid or missing student ID." });
  }

  switch (req.method) {
    case "GET":
      try {
        const student = await db.student.findUnique({
          where: { studentId },
        });
        if (!student) {
          return res.status(404).json({ message: "Student not found." });
        }
        return res.status(200).json(student);
      } catch (error) {
        console.error("Error fetching student:", error);
        return res.status(500).json({ message: "Failed to fetch student." });
      }

    case "PUT":
      try {
        const updatedData = req.body;

        // Ensure data validation
        if (!updatedData.firstName || !updatedData.lastName || !updatedData.department) {
          return res.status(400).json({ message: "Required fields are missing." });
        }

        const updatedStudent = await db.student.update({
          where: { studentId },
          data: updatedData,
        });

        return res.status(200).json(updatedStudent);
      } catch (error) {
        console.error("Error updating student:", error);
        return res.status(500).json({ message: "Failed to update student." });
      }

    default:
      res.setHeader("Allow", ["GET", "PUT"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
