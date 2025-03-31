import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';

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
      // Check if student exists
      const [studentCheck] = await pool.query('SELECT * FROM students WHERE student_id = ?', [student_id]) as [any[], any];
      if (studentCheck.length === 0) {
        return res.status(400).json({ message: 'Invalid student ID.' });
      }

      // Insert health record
      await pool.query(
        `INSERT INTO health_records (
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
          medications
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
    } catch (error: any) {
      console.error('Error saving health record:', error);
      res.status(500).json({ message: 'Error saving health record.', error: error.message });
    }
  } 
  else if (req.method === 'GET') {
    try {
      const [patients] = await pool.query(
        'SELECT COUNT(DISTINCT id) AS totalPatients FROM health_records'
      ) as [{ totalPatients: number }[], any];

      const [patientData] = await pool.query(
        `SELECT 
          student_id,
          name,
          age,
          gender,
          department,
          course,
          year,
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
          COUNT(*) AS patients_treated 
        FROM health_records 
        GROUP BY student_id, name, age, gender, department, course, year, home_address, present_address, contact_number, emergency_contact_name, emergency_contact_relation, emergency_contact_phone, status, date_of_visit, diagnosis, notes, treatment, medications`
      ) as [any[], any];

      res.status(200).json({
        totalPatients: patients[0].totalPatients,
        patientData,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Error fetching dashboard data.', error: error.message });
    }
  } 
  else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default handler;
