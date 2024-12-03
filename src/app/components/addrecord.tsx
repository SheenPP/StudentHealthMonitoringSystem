'use client';
import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useOptions } from '../options/useOptions'; // Import the hook
import DepartmentSelect from '../options/DepartmentSelect';
import CourseSelect from '../options/CourseSelect';
import YearSelect from '../options/YearSelect';

interface AddRecordProps {
  onAddSuccess: () => void;
  onAddFailure: (errorType: string) => void; // Callback for failure
}

const AddRecord: React.FC<AddRecordProps> = ({ onAddSuccess, onAddFailure }) => {
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [studentPhoto, setStudentPhoto] = useState<File | null>(null);

  const { departments, coursesByDepartment, years } = useOptions(); // Use the hook

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('student_id', studentId);
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('gender', gender);
    formData.append('department', department);
    formData.append('course', course);
    formData.append('year', year);
    formData.append('date_of_birth', dateOfBirth);
    formData.append('email', email);
    formData.append('phone_number', phoneNumber);
    formData.append('present_address', presentAddress);
    formData.append('home_address', homeAddress);
    formData.append('medical_history', medicalHistory);
    formData.append('emergency_contact_name', emergencyContactName);
    formData.append('emergency_contact_relation', emergencyContactRelation);
    formData.append('emergency_contact_phone', emergencyContactPhone);

    if (studentPhoto) {
      formData.append('student_photo', studentPhoto);
    }

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 409) {
        // Handle duplicate entry
        onAddFailure('duplicate');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to add record');
      }

      const result = await response.json();
      console.log(result.message); // Handle success message
      onAddSuccess(); // Notify parent component
    } catch (error) {
      console.error('Error adding student record:', error);
      onAddFailure('general'); // Notify parent about a general failure
    }
  };

  return (
    <div className="relative">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        encType="multipart/form-data"
      >
        <div>
          <label className="block mb-1">Student ID</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Gender</label>
          <div className="flex items-center gap-4">
            <label>
              <input
                type="radio"
                value="Male"
                checked={gender === 'Male'}
                onChange={(e) => setGender(e.target.value)}
                className="mr-2"
                required
              />
              Male
            </label>
            <label>
              <input
                type="radio"
                value="Female"
                checked={gender === 'Female'}
                onChange={(e) => setGender(e.target.value)}
                className="mr-2"
              />
              Female
            </label>
          </div>
        </div>

        <DepartmentSelect
          department={department}
          setDepartment={setDepartment}
          departments={departments}
        />

        <CourseSelect
          department={department}
          course={course}
          setCourse={setCourse}
          coursesByDepartment={coursesByDepartment}
        />

        <YearSelect year={year} setYear={setYear} years={years} />

        <div>
          <label className="block mb-1">Date of Birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Present Address</label>
          <input
            type="text"
            value={presentAddress}
            onChange={(e) => setPresentAddress(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Home Address</label>
          <input
            type="text"
            value={homeAddress}
            onChange={(e) => setHomeAddress(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Medical History</label>
          <textarea
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
            rows={4}
          />
        </div>
        <div>
          <label className="block mb-1">Emergency Contact Name</label>
          <input
            type="text"
            value={emergencyContactName}
            onChange={(e) => setEmergencyContactName(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Emergency Contact Relation</label>
          <input
            type="text"
            value={emergencyContactRelation}
            onChange={(e) => setEmergencyContactRelation(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Emergency Contact Phone</label>
          <input
            type="tel"
            value={emergencyContactPhone}
            onChange={(e) => setEmergencyContactPhone(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Student Photo</label>
          <input
            type="file"
            onChange={(e) => setStudentPhoto(e.target.files?.[0] || null)}
            className="border border-gray-300 rounded-md p-2 w-full"
            accept="image/*"
          />
        </div>

        <div className="col-span-3 text-right mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded-md"
          >
            Add Record
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRecord;
