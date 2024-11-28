import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express'; // Import Request type from express

// Configure Multer to store images in the 'public/uploads' directory
const upload = multer({
  storage: multer.diskStorage({
    destination: 'public/uploads',
    filename: (req: Request, file, cb) => {
      const { student_id, first_name, last_name } = req.body as Record<string, string>;
      const fileExtension = path.extname(file.originalname);
      const newFilename = `${student_id}_${first_name}_${last_name}${fileExtension}`;
      cb(null, newFilename);
    },
  }),
});

// Extending NextApiRequest to include file
interface MulterRequest extends NextApiRequest {
  file?: Express.Multer.File;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    // Handling POST request (create a new student with photo)
    upload.single('student_photo')(req as MulterRequest, res as any, async (uploadErr) => {
      if (uploadErr) {
        console.error(uploadErr);
        return res.status(500).json({ message: 'Error uploading student photo.', error: (uploadErr as Error).message });
      }

      const {
        student_id,
        first_name,
        last_name,
        gender,
        department,
        date_of_birth,
        email,
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

      // Create the photo path relative to the public directory
      const studentPhotoPath = (req as MulterRequest).file ? `/uploads/${(req as MulterRequest).file?.filename}` : null;

      try {
        const [result]: any = await pool.query(
          'INSERT INTO student (student_id, first_name, last_name, gender, department, date_of_birth, email, phone_number, present_address, home_address, year, course, medical_history, emergency_contact_name, emergency_contact_relation, emergency_contact_phone, photo_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            student_id,
            first_name,
            last_name,
            gender,
            department,
            date_of_birth,
            email,
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
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error saving student record.', error: (error as Error).message });
      }
    });
  } else if (req.method === 'GET' && req.query.id) {
    // Handling GET request for a specific student
    const studentId = req.query.id as string;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required.' });
    }

    try {
      const [rows]: any = await pool.query('SELECT * FROM student WHERE student_id = ?', [studentId]);

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Student not found.' });
      }

      res.status(200).json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching student data.', error: (error as Error).message });
    }
  } else if (req.method === 'GET') {
    // Handling GET request to retrieve all students
    try {
      const [rows]: any = await pool.query('SELECT * FROM student');
      res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching student data.', error: (error as Error).message });
    }
  } else if (req.method === 'PUT' && req.query.id) {
    // Handling PUT request to update a specific student
    const studentId = req.query.id as string;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required for updating.' });
    }

    const {
      first_name,
      last_name,
      gender,
      department,
      date_of_birth,
      email,
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
      const [result]: any = await pool.query(
        'UPDATE student SET first_name = ?, last_name = ?, gender = ?, department = ?, date_of_birth = ?, email = ?, phone_number = ?, present_address = ?, home_address = ?, year = ?, course = ?, medical_history = ?, emergency_contact_name = ?, emergency_contact_relation = ?, emergency_contact_phone = ? WHERE student_id = ?',
        [
          first_name,
          last_name,
          gender,
          department,
          date_of_birth,
          email,
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
        return res.status(404).json({ message: 'Student record not found for the provided ID.' });
      }

      res.status(200).json({ message: 'Student record updated successfully!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating student record.', error: (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

// Export API config to disable body parsing for Multer to handle form-data
export const config = {
  api: {
    bodyParser: false, // Disables body parsing by Next.js to handle multipart form-data
  },
};

export default handler;
