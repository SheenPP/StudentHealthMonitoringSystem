// pages/api/healthRecords.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Handle POST request to add a health record
  if (req.method === 'POST') {
    const {
      student_id,
      name,
      department,
      course,
      year,
      gender,
      age, // New field
      home_address,
      present_address,
      contact_number,
      emergency_contact_name,
      emergency_contact_relation,
      emergency_contact_phone,
      status, // e.g., 'Sick', 'Recovered', etc.
      date_of_visit,
      diagnosis,
      notes,
      treatment, // New field
      medications, // New field
    } = req.body;

    try {
      // Check if student_id exists in the student table
      const [studentCheck] = await pool.query('SELECT * FROM student WHERE student_id = ?', [student_id]);
      if (studentCheck.length === 0) {
        return res.status(400).json({ message: 'Invalid student ID.' });
      }

      // Insert new health record including all the fields from the form
      await pool.query(
        `INSERT INTO health_records (
          student_id,
          name,
          department,
          course,
          year,
          gender,
          age, -- New field
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
          treatment, -- New field
          medications -- New field
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
      console.error('Error saving health record:', error);
      res.status(500).json({ message: 'Error saving health record.', error: error.message });
    }
  } 
  // Handle GET request to fetch total patients and patient data for chart
  else if (req.method === 'GET') {
    try {
      // Fetch total number of distinct patients
      const [patients] = await pool.query('SELECT COUNT(DISTINCT id) AS totalPatients FROM health_records');
  
      // Fetch patient data (including date_of_visit and department for the chart)
      const [patientData] = await pool.query(
        `SELECT 
          student_id,
          name,
          age, -- New field
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
          treatment, -- New field
          medications, -- New field
          COUNT(*) AS patients_treated 
        FROM health_records 
        GROUP BY student_id, name, age, gender, department, course, year, home_address, present_address, contact_number, emergency_contact_name, emergency_contact_relation, emergency_contact_phone, status, date_of_visit, diagnosis, notes, treatment, medications`
      );
  
      // Send back the data including patientData
      res.status(200).json({
        totalPatients: patients[0].totalPatients,
        patientData, // Send patient data for the chart and event details
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Error fetching dashboard data.', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default handler;
