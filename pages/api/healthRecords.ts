import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';
import { RowDataPacket, OkPacket } from 'mysql2';

interface StudentRow extends RowDataPacket {
  student_id: string;
}

interface PatientCountRow extends RowDataPacket {
  totalPatients: number;
}

interface HealthRecordRow extends RowDataPacket {
  student_id: string;
  name: string;
  age: number;
  gender: string;
  department: string;
  course: string;
  year: string;
  home_address: string;
  present_address: string;
  contact_number: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  status: string;
  date_of_visit: string;
  diagnosis: string;
  notes: string;
  treatment: string;
  medications: string;
  patients_treated: number;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const {
      student_id,
      name,
      department,
      course,
      year,
      gender,
      age,
      home_address,
      present_address,
      contact_number,
      emergency_contact_name,
      emergency_contact_relation,
      emergency_contact_phone,
      status,
      date_of_visit,
      diagnosis,
      notes,
      treatment,
      medications,
    } = req.body;

    try {
      const [studentCheck] = await pool.query<StudentRow[]>(
        `SELECT student_id FROM students WHERE student_id = ?
         UNION
         SELECT student_id FROM studentaccount WHERE student_id = ?`,
        [student_id, student_id]
      );
      

      if (studentCheck.length === 0) {
        return res.status(400).json({ message: 'Invalid student ID.' });
      }

      // ✅ Insert data (no need to type return if unused)
      await pool.query<OkPacket>(
        `INSERT INTO health_records (
          student_id, name, department, course, year, gender, age, home_address,
          present_address, contact_number, emergency_contact_name,
          emergency_contact_relation, emergency_contact_phone, status,
          date_of_visit, diagnosis, notes, treatment, medications
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          student_id,
          name,
          department,
          course,
          year,
          gender,
          age,
          home_address,
          present_address,
          contact_number,
          emergency_contact_name,
          emergency_contact_relation,
          emergency_contact_phone,
          status,
          date_of_visit,
          diagnosis,
          notes,
          treatment,
          medications,
        ]
      );

      res.status(201).json({ message: 'Health record added successfully!' });
    } catch (error) {
      const err = error as Error;
      console.error('Error saving health record:', err);
      res.status(500).json({ message: 'Error saving health record.', error: err.message });
    }
  } else if (req.method === 'GET') {
    try {
      // ✅ Get total count
      const [patients] = await pool.query<PatientCountRow[]>(
        'SELECT COUNT(DISTINCT id) AS totalPatients FROM health_records'
      );

      // ✅ Get detailed records
      const [patientData] = await pool.query<HealthRecordRow[]>(
        `SELECT 
          student_id, name, age, gender, department, course, year,
          home_address, present_address, contact_number,
          emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
          status, date_of_visit, diagnosis, notes, treatment, medications,
          COUNT(*) AS patients_treated
        FROM health_records 
        GROUP BY student_id, name, age, gender, department, course, year, home_address,
                 present_address, contact_number, emergency_contact_name,
                 emergency_contact_relation, emergency_contact_phone,
                 status, date_of_visit, diagnosis, notes, treatment, medications`
      );

      res.status(200).json({
        totalPatients: patients[0].totalPatients,
        patientData,
      });
    } catch (error) {
      const err = error as Error;
      console.error('Error fetching dashboard data:', err);
      res.status(500).json({ message: 'Error fetching dashboard data.', error: err.message });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default handler;
