import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import multer from 'multer';
import path from 'path';
import pool from '../../lib/db';
import { RowDataPacket, OkPacket } from 'mysql2';

// Configure Multer storage
const upload = multer({
  storage: multer.diskStorage({
    destination: 'public/uploads',
    filename: (req, file, cb) => {
      const student_id = req.body.student_id;
      const fileExtension = path.extname(file.originalname);
      cb(null, `${student_id}${fileExtension}`);
    },
  }),
});

// Disable body parsing so Multer can handle file
export const config = {
  api: {
    bodyParser: false,
  },
};

// Define the request type with Multer's file and expected body
interface MulterRequest extends NextApiRequest {
  file?: Express.Multer.File;
  body: {
    student_id: string;
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
  };
}

// Student row interface
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

// Initialize handler
const apiRoute = nextConnect<NextApiRequest, NextApiResponse>({
  onError(error, req, res) {
    const err = error as Error;
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  },
  onNoMatch(req, res) {
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  },
});

// Apply Multer middleware
apiRoute.use(upload.single('student_photo'));

// POST - Create student with photo
apiRoute.post(async (req: MulterRequest, res: NextApiResponse) => {
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
  } = req.body;

  const studentPhotoPath = req.file ? `/uploads/${req.file.filename}` : null;

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
        studentPhotoPath,
      ]
    );

    res.status(201).json({ message: 'Student record added successfully!' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(err);
    res.status(500).json({ message: 'Error saving student record.', error: err.message });
  }
});

// GET - Get all students or one by ID
apiRoute.get(async (req: NextApiRequest, res: NextApiResponse) => {
  const studentId = req.query.id as string | undefined;

  try {
    if (studentId) {
      const [result] = await pool.query<StudentRow[]>(
        `SELECT sa.student_id, sa.first_name, sa.middle_name, sa.last_name, sa.email,
                s.gender, s.department, s.date_of_birth, s.phone_number, s.present_address, 
                s.home_address, s.year, s.course, s.medical_history, s.emergency_contact_name, 
                s.emergency_contact_relation, s.emergency_contact_phone, s.photo_path
         FROM studentaccount sa
         LEFT JOIN students s ON sa.student_id = s.student_id
         WHERE sa.student_id = ?`,
        [studentId]
      );

      if (result.length === 0) {
        return res.status(404).json({ message: 'Student not found.' });
      }

      res.status(200).json(result[0]);
    } else {
      const [result] = await pool.query<StudentRow[]>(
        `SELECT sa.student_id, sa.first_name, sa.middle_name, sa.last_name, sa.email,
                s.gender, s.department, s.date_of_birth, s.phone_number, s.present_address, 
                s.home_address, s.year, s.course, s.medical_history, s.emergency_contact_name, 
                s.emergency_contact_relation, s.emergency_contact_phone, s.photo_path
         FROM studentaccount sa
         LEFT JOIN students s ON sa.student_id = s.student_id`
      );

      res.status(200).json(result);
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error(err);
    res.status(500).json({ message: 'Error fetching student data.', error: err.message });
  }
});

// PUT - Update student details
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
  } = req.body as Record<string, string>;

  try {
    const [result] = await pool.query<OkPacket>(
      `UPDATE students SET 
        gender = ?, department = ?, date_of_birth = ?, phone_number = ?, 
        present_address = ?, home_address = ?, year = ?, course = ?, 
        medical_history = ?, emergency_contact_name = ?, emergency_contact_relation = ?, 
        emergency_contact_phone = ?
       WHERE student_id = ?`,
      [
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
        studentId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student record not found.' });
    }

    res.status(200).json({ message: 'Student record updated successfully!' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(err);
    res.status(500).json({ message: 'Error updating student record.', error: err.message });
  }
});

export default apiRoute;
