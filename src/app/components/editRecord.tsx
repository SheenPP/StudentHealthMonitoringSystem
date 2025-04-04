'use client';
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useOptions } from '../options/useOptions';
import DepartmentSelect from '../options/DepartmentSelect';
import CourseSelect from '../options/CourseSelect';
import YearSelect from '../options/YearSelect';

interface EditRecordProps {
  studentId: string;
  onClose: (updatedStudent?: any) => void;
}

const EditRecord: React.FC<EditRecordProps> = ({ studentId, onClose }) => {
  const supabase = createClientComponentClient();
  const [studentData, setStudentData] = useState<any>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const { departments, coursesByDepartment, years } = useOptions();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(`/api/students?id=${studentId}`);
        const data = await res.json();
        setStudentData({
          ...data,
          date_of_birth: data.date_of_birth?.split('T')[0] || '',
        });
      } catch (error) {
        console.error('Error loading student data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [studentId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    let photoUrl = studentData.photo_path;

    if (newPhoto) {
      const fileExt = newPhoto.name.split('.').pop();
      const filePath = `student-photos/${studentId}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, newPhoto, {
          upsert: true,
          contentType: newPhoto.type,
        });

      if (uploadError) {
        alert('Image upload failed.');
        return;
      }

      const { data } = supabase.storage.from('student-photos').getPublicUrl(filePath);
      photoUrl = data.publicUrl;
    }

    const response = await fetch(`/api/students?id=${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...studentData, photo_path: photoUrl }),
    });

    if (!response.ok) {
      const data = await response.json();
      alert(`Update failed: ${data.message}`);
    } else {
      const updated = { ...studentData, photo_path: photoUrl };
      onClose(updated); // ✅ this triggers toast from parent
    }
  };

  const handleChange = (field: string, value: any) => {
    setStudentData((prev: any) => ({ ...prev, [field]: value }));
  };

  if (loading || !studentData) {
    return <p className="text-center py-10">Loading student record...</p>;
  }

  return (
    <div className="relative">
      <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1">Student ID</label>
          <input type="text" value={studentData.student_id} className="border p-2 w-full" disabled />
        </div>
        <div>
          <label className="block mb-1">First Name</label>
          <input
            type="text"
            value={studentData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Last Name</label>
          <input
            type="text"
            value={studentData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1">Gender</label>
          <div className="flex gap-4">
            {['Male', 'Female'].map((g) => (
              <label key={g}>
                <input
                  type="radio"
                  value={g}
                  checked={studentData.gender === g}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="mr-1"
                />
                {g}
              </label>
            ))}
          </div>
        </div>

        <DepartmentSelect
          department={studentData.department}
          setDepartment={(val) => handleChange('department', val)}
          departments={departments}
        />
        <CourseSelect
          department={studentData.department}
          course={studentData.course}
          setCourse={(val) => handleChange('course', val)}
          coursesByDepartment={coursesByDepartment}
        />
        <YearSelect year={studentData.year} setYear={(val) => handleChange('year', val)} years={years} />

        <div>
          <label className="block mb-1">Date of Birth</label>
          <input
            type="date"
            value={studentData.date_of_birth}
            onChange={(e) => handleChange('date_of_birth', e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1">Email</label>
          <input type="email" value={studentData.email} className="border p-2 w-full" readOnly />
        </div>

        <div>
          <label className="block mb-1">Phone Number</label>
          <input
            type="text"
            value={studentData.phone_number}
            onChange={(e) => handleChange('phone_number', e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1">Present Address</label>
          <input
            type="text"
            value={studentData.present_address}
            onChange={(e) => handleChange('present_address', e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Home Address</label>
          <input
            type="text"
            value={studentData.home_address}
            onChange={(e) => handleChange('home_address', e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1">Medical History</label>
          <textarea
            value={studentData.medical_history}
            onChange={(e) => handleChange('medical_history', e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1">Emergency Contact Name</label>
          <input
            type="text"
            value={studentData.emergency_contact_name}
            onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Emergency Contact Relation</label>
          <input
            type="text"
            value={studentData.emergency_contact_relation}
            onChange={(e) => handleChange('emergency_contact_relation', e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Emergency Contact Phone</label>
          <input
            type="text"
            value={studentData.emergency_contact_phone}
            onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label className="block mb-1">Student Photo</label>
          {studentData.photo_path && (
            <img src={studentData.photo_path} alt="Profile" className="w-24 h-24 mb-2 rounded object-cover" />
          )}
          <input
            type="file"
            onChange={(e) => setNewPhoto(e.target.files?.[0] || null)}
            className="border p-2 w-full"
            accept="image/*"
          />
        </div>

        <div className="col-span-3 flex justify-end gap-4 mt-4">
          <button type="button" onClick={() => onClose()} className="bg-gray-500 text-white px-4 py-2 rounded-md">
            Cancel
          </button>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditRecord;
