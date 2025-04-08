"use client";
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useOptions } from '../options/useOptions';
import DepartmentSelect from '../options/DepartmentSelect';
import CourseSelect from '../options/CourseSelect';
import YearSelect from '../options/YearSelect';

interface AddRecordProps {
  onAddSuccess: () => void;
  onAddFailure: (errorType: string) => void;
}

const AddRecord: React.FC<AddRecordProps> = ({ onAddSuccess, onAddFailure }) => {
  const supabase = createClientComponentClient();
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

  const { departments, coursesByDepartment, years } = useOptions();

  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (studentId.trim() === '') return;

      try {
        const res = await fetch(`/api/students?id=${studentId}`);
        const data = await res.json();

        if (res.ok) {
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setEmail(data.email || '');
        } else {
          setFirstName('');
          setLastName('');
          setEmail('');
        }
      } catch (err) {
        console.error('Error fetching student account:', err);
      }
    };

    fetchStudentInfo();
  }, [studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let photoUrl = '';

    if (studentPhoto) {
      const fileExt = studentPhoto.name.split('.').pop();
      const fileName = `${studentId}.${fileExt}`;
      const filePath = `student-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, studentPhoto, {
          upsert: true,
          contentType: studentPhoto.type,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        onAddFailure('upload');
        return;
      }

      const { data } = supabase.storage.from('student-photos').getPublicUrl(filePath);
      photoUrl = data.publicUrl;
    }

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          gender,
          department,
          date_of_birth: dateOfBirth,
          phone_number: phoneNumber,
          present_address: presentAddress,
          home_address: homeAddress,
          year,
          course,
          medical_history: medicalHistory,
          emergency_contact_name: emergencyContactName,
          emergency_contact_relation: emergencyContactRelation,
          emergency_contact_phone: emergencyContactPhone,
          photo_path: photoUrl,
        }),
      });

      if (response.status === 409) {
        onAddFailure('duplicate');
        return;
      }

      if (!response.ok) throw new Error('Failed to add record');

      onAddSuccess();
    } catch (error) {
      console.error('Error adding student record:', error);
      onAddFailure('general');
    }
  };

  return (
    <div className="relative dark:bg-black p-4 rounded-md">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Student ID</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">First Name</label>
          <input
            type="text"
            value={firstName}
            readOnly
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Last Name</label>
          <input
            type="text"
            value={lastName}
            readOnly
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Gender</label>
          <div className="flex gap-4 text-gray-800 dark:text-gray-200 font-semibold">
            <label>
              <input
                type="radio"
                value="Male"
                checked={gender === 'Male'}
                onChange={(e) => setGender(e.target.value)}
                className="mr-1"
              />
              Male
            </label>
            <label>
              <input
                type="radio"
                value="Female"
                checked={gender === 'Female'}
                onChange={(e) => setGender(e.target.value)}
                className="mr-1"
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
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Date of Birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Email</label>
          <input
            type="email"
            value={email}
            readOnly
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Present Address</label>
          <input
            type="text"
            value={presentAddress}
            onChange={(e) => setPresentAddress(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Home Address</label>
          <input
            type="text"
            value={homeAddress}
            onChange={(e) => setHomeAddress(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Medical History</label>
          <textarea
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
            rows={3}
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Emergency Contact Name</label>
          <input
            type="text"
            value={emergencyContactName}
            onChange={(e) => setEmergencyContactName(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Emergency Contact Relation</label>
          <input
            type="text"
            value={emergencyContactRelation}
            onChange={(e) => setEmergencyContactRelation(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Emergency Contact Phone</label>
          <input
            type="tel"
            value={emergencyContactPhone}
            onChange={(e) => setEmergencyContactPhone(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Student Photo</label>
          <input
            type="file"
            onChange={(e) => setStudentPhoto(e.target.files?.[0] || null)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 text-white rounded-md p-2 w-full font-semibold"
            accept="image/*"
          />
        </div>

        <div className="col-span-3 text-right mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 transition"
          >
            Add Record
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRecord;
