import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';
import { RowDataPacket, OkPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  user_id: string;
}

interface PatientCountRow extends RowDataPacket {
  totalPatients: number;
}

interface HealthRecordRow extends RowDataPacket {
  user_id: string;
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
  term_id: number;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const {
      user_id,
      name,
      role,
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
      term_id,
    } = req.body;

    if (!term_id || !user_id || !date_of_visit || !name) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
      // Validate if user_id exists in user_profiles table (optional)
      const [userCheck] = await pool.query<UserRow[]>(
        `SELECT user_id FROM user_profiles WHERE user_id = ?`,
        [user_id]
      );

      // Allow manual entry for first-time patients (no rejection even if not found)
      if (userCheck.length === 0) {
        console.warn(`No matching profile for user_id: ${user_id}. Proceeding with manual entry.`);
      }

      await pool.query<OkPacket>(
        `INSERT INTO health_records (
          user_id, name, role, department, course, year, gender, age, home_address,
          present_address, contact_number, emergency_contact_name,
          emergency_contact_relation, emergency_contact_phone, status,
          date_of_visit, diagnosis, notes, treatment, medications, term_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          name,
          role,
          department || null,
          course || null,
          year || null,
          gender,
          age || null,
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
          term_id,
        ]
      );

      res.status(201).json({ message: 'Health record added successfully!' });
    } catch (error) {
      const err = error as Error;
      console.error('Error saving health record:', err);
      res.status(500).json({ message: 'Error saving health record.', error: err.message });
    }
  } else if (req.method === 'GET') {
    const { term_id } = req.query;

    try {
      let patientQuery = `
        SELECT 
          user_id, name, age, gender, department, course, year,
          home_address, present_address, contact_number,
          emergency_contact_name, emergency_contact_relation, emergency_contact_phone,
          status, date_of_visit, diagnosis, notes, treatment, medications,
          COUNT(*) AS patients_treated
        FROM health_records
      `;
      const queryValues: (string | number)[] = [];

      if (term_id) {
        patientQuery += " WHERE term_id = ?";
        queryValues.push(term_id as string);
      }

      patientQuery += `
        GROUP BY user_id, name, age, gender, department, course, year, home_address,
                 present_address, contact_number, emergency_contact_name,
                 emergency_contact_relation, emergency_contact_phone,
                 status, date_of_visit, diagnosis, notes, treatment, medications
      `;

      const [patients] = await pool.query<PatientCountRow[]>(
        'SELECT COUNT(DISTINCT id) AS totalPatients FROM health_records' +
        (term_id ? ' WHERE term_id = ?' : ''),
        term_id ? [term_id] : []
      );

      const [patientData] = await pool.query<HealthRecordRow[]>(patientQuery, queryValues);

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
