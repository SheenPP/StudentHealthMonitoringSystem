import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';
import { RowDataPacket, OkPacket } from 'mysql2';

// Define expected student row shape
interface StudentRow extends RowDataPacket {
  student_id: string;
  first_name: string;
  last_name: string;
  department: string;
  date_of_birth: string;
  gender: string;
  phone_number: string;
  year: string;
  course: string;
  home_address: string;
  present_address: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { studentId } = req.query;

  if (!studentId || typeof studentId !== 'string') {
    return res.status(400).json({ message: 'Invalid or missing student ID.' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const [results] = await db.query<StudentRow[]>(
          'SELECT * FROM students WHERE student_id = ?',
          [studentId]
        );

        if (results.length === 0) {
          return res.status(404).json({ message: 'Student not found.' });
        }

        return res.status(200).json(results[0]);
      } catch (error: unknown) {
        const err = error as Error;
        console.error('Error fetching student:', err);
        return res.status(500).json({ message: 'Failed to fetch student.', error: err.message });
      }

    case 'PUT':
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

        if (!firstName || !lastName || !department) {
          return res.status(400).json({ message: 'Required fields are missing.' });
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
          studentId,
        ];

        // Use OkPacket type for UPDATE result
        const [updateResult] = await db.query<OkPacket>(updateQuery, updateValues);

        if (updateResult.affectedRows === 0) {
          return res.status(404).json({ message: 'Student record not found or no changes made.' });
        }

        return res.status(200).json({ message: 'Student updated successfully.' });
      } catch (error: unknown) {
        const err = error as Error;
        console.error('Error updating student:', err);
        return res.status(500).json({ message: 'Failed to update student.', error: err.message });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
