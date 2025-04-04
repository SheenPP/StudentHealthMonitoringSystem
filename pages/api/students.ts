import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import pool from '../../lib/db';
import { RowDataPacket, OkPacket } from 'mysql2';

export const config = {
  api: {
    bodyParser: true, // Allow JSON or URL-encoded payloads
  },
};

// Interfaces
interface StudentRow extends RowDataPacket {
  student_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  gender: string;
  department: string;
  date_of_birth: string;
  phone_number: string;
  present_address: string;
  home_address: string;
  year: string;
  course: string;
  medical_history: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  photo_path: string | null;
}

const apiRoute = nextConnect<NextApiRequest, NextApiResponse>({
  onError(err, req, res) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  },
  onNoMatch(req, res) {
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  },
});

// POST - Create student record with Supabase image path
apiRoute.post(async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    student_id,
    gender,
    department,
    date_of_birth,
    phone_number,
    present_address,
    home_address,
    year,
    course,
    medical_history,
    emergency_contact_name,
    emergency_contact_relation,
    emergency_contact_phone,
    photo_path, // 📸 Supabase image path sent from frontend
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO students 
      (student_id, gender, department, date_of_birth, phone_number, present_address, home_address, year, course, medical_history, emergency_contact_name, emergency_contact_relation, emergency_contact_phone, photo_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id,
        gender,
        department,
        date_of_birth,
        phone_number,
        present_address,
        home_address,
        year,
        course,
        medical_history,
        emergency_contact_name,
        emergency_contact_relation,
        emergency_contact_phone,
        photo_path,
      ]
    );

    res.status(201).json({ message: 'Student record added successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving student record.', error: (err as Error).message });
  }
});

// GET - Get all students or one by ID
apiRoute.get(async (req: NextApiRequest, res: NextApiResponse) => {
  const studentId = req.query.id as string | undefined;

  try {
    const query = studentId
      ? `SELECT sa.student_id, sa.first_name, sa.middle_name, sa.last_name, sa.email,
              s.gender, s.department, s.date_of_birth, s.phone_number, s.present_address, 
              s.home_address, s.year, s.course, s.medical_history, s.emergency_contact_name, 
              s.emergency_contact_relation, s.emergency_contact_phone, s.photo_path
         FROM studentaccount sa
         LEFT JOIN students s ON sa.student_id = s.student_id
         WHERE sa.student_id = ?`
      : `SELECT sa.student_id, sa.first_name, sa.middle_name, sa.last_name, sa.email,
              s.gender, s.department, s.date_of_birth, s.phone_number, s.present_address, 
              s.home_address, s.year, s.course, s.medical_history, s.emergency_contact_name, 
              s.emergency_contact_relation, s.emergency_contact_phone, s.photo_path
         FROM studentaccount sa
         LEFT JOIN students s ON sa.student_id = s.student_id`;

    const [result] = await pool.query<StudentRow[]>(query, studentId ? [studentId] : []);
    if (studentId && result.length === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    res.status(200).json(studentId ? result[0] : result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching student data.', error: (err as Error).message });
  }
});

// PUT - Update student data including Supabase photo path
apiRoute.put(async (req: NextApiRequest, res: NextApiResponse) => {
  const studentId = req.query.id as string;

  const {
    gender,
    department,
    date_of_birth,
    phone_number,
    present_address,
    home_address,
    year,
    course,
    medical_history,
    emergency_contact_name,
    emergency_contact_relation,
    emergency_contact_phone,
    photo_path, // 🆕 optional field for updated image URL
  } = req.body;

  try {
    const updateFields = [
      gender,
      department,
      date_of_birth,
      phone_number,
      present_address,
      home_address,
      year,
      course,
      medical_history,
      emergency_contact_name,
      emergency_contact_relation,
      emergency_contact_phone,
    ];
    let updateQuery = `
      UPDATE students SET 
        gender = ?, department = ?, date_of_birth = ?, phone_number = ?, 
        present_address = ?, home_address = ?, year = ?, course = ?, 
        medical_history = ?, emergency_contact_name = ?, emergency_contact_relation = ?, 
        emergency_contact_phone = ?
    `;

    if (photo_path) {
      updateQuery += `, photo_path = ?`;
      updateFields.push(photo_path);
    }

    updateQuery += ` WHERE student_id = ?`;
    updateFields.push(studentId);

    const [result] = await pool.query<OkPacket>(updateQuery, updateFields);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student record not found.' });
    }

    res.status(200).json({ message: 'Student record updated successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating student record.', error: (err as Error).message });
  }
});

export default apiRoute;
