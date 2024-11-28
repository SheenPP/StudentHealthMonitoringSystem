"use client";
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import React, { useState } from 'react';

const AddRecord: React.FC = () => {
  const [studentId, setStudentId] = useState(''); // New state for student ID
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState(''); // New state for department
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const newStudent = {
      student_id: studentId, // Include student ID in the new student object
      first_name: firstName,
      last_name: lastName,
      department: department, // Include department in the new student object
      date_of_birth: dateOfBirth,
      email: email,
      phone_number: phoneNumber,
      address: address,
      medical_history: medicalHistory,
      emergency_contact_name: emergencyContactName,
      emergency_contact_relation: emergencyContactRelation,
      emergency_contact_phone: emergencyContactPhone,
    };
  
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStudent),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const result = await response.json();
      console.log(result.message); // Handle success message
    } catch (error) {
      console.error('Error adding student record:', error);
    }
  };
  
  return (
    <div className="flex-1">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4">
          <h1 className="text-2xl font-semibold mb-4">Add Student Record</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Student ID</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="border border-gray-300 p-2 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border border-gray-300 p-2 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border border-gray-300 p-2 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Department</label> {/* Moved department field here */}
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="border border-gray-300 p-2 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="border border-gray-300 p-2 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-300 p-2 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="border border-gray-300 p-2 w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="border border-gray-300 p-2 w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Medical History</label>
              <textarea
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                className="border border-gray-300 p-2 w-full"
                rows={4}
              />
            </div>
            <div>
              <label className="block mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="border border-gray-300 p-2 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Emergency Contact Relation</label>
              <input
                type="text"
                value={emergencyContactRelation}
                onChange={(e) => setEmergencyContactRelation(e.target.value)}
                className="border border-gray-300 p-2 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Emergency Contact Phone</label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="border border-gray-300 p-2 w-full"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 mt-4 rounded hover:bg-blue-600"
            >
              Add Record
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AddRecord;
