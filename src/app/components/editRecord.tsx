'use client';
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useOptions } from '../options/useOptions';
import DepartmentSelect from '../options/DepartmentSelect';
import CourseSelect from '../options/CourseSelect';
import YearSelect from '../options/YearSelect';
import Image from 'next/image';

export interface UserProfile {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'teacher';
  gender: string;
  date_of_birth: string;
  email: string;
  phone_number: string;
  present_address: string;
  home_address: string;
  medical_history: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  photo_path: string;
  department: string | null;
  course: string | null;
  year: string | null;
}

interface EditRecordProps {
  userId: string;
  onClose: (updatedProfile?: UserProfile) => void;
}

const EditRecord: React.FC<EditRecordProps> = ({ userId, onClose }) => {
  const supabase = createClientComponentClient();
  const { departments, coursesByDepartment, years } = useOptions();

  const [initialUserId, setInitialUserId] = useState(userId);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/user-profiles?user_id=${userId}`);
        const data = await res.json();

        setProfileData({
          ...data,
          date_of_birth: data.date_of_birth?.split('T')[0] || '',
          medical_history: data.medical_history ?? '', // ✅ null-safe for textarea
          present_address: data.present_address ?? '',
          home_address: data.home_address ?? '',
          phone_number: data.phone_number ?? '',
          emergency_contact_name: data.emergency_contact_name ?? '',
          emergency_contact_relation: data.emergency_contact_relation ?? '',
          emergency_contact_phone: data.emergency_contact_phone ?? '',
        });
        setInitialUserId(data.user_id);
      } catch (error) {
        console.error('Error loading user profile:', error);
        setError('Error loading profile data.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData) return;

    const trimmedUserId = profileData.user_id.trim();
    let photoUrl = profileData.photo_path;

    if (newPhoto) {
      const fileExt = newPhoto.name.split('.').pop();
      const filePath = `profile-photos/${trimmedUserId}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, newPhoto, {
          upsert: true,
          contentType: newPhoto.type,
        });

      if (uploadError) {
        alert('Image upload failed.');
        return;
      }

      const { data } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
      photoUrl = data.publicUrl;
    }

    try {
      const response = await fetch(`/api/user-profiles?user_id=${initialUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData, user_id: trimmedUserId, photo_path: photoUrl }),
      });

      const data = await response.text();
      console.log('Response:', data);

      if (!response.ok) {
        alert(`Update failed: ${data}`);
        return;
      }

      const updated = { ...profileData, user_id: trimmedUserId, photo_path: photoUrl };
      onClose(updated);
    } catch (error) {
      console.error("Error updating user profile:", error);
      alert("An error occurred while updating the profile.");
    }
  };

  const handleChange = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setProfileData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  if (loading || !profileData) {
    return <p className="text-center py-10 text-gray-800 dark:text-white">Loading profile...</p>;
  }

  return (
    <div className="relative dark:bg-black p-4 rounded-md">
      <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1">User ID</label>
          <input
            type="text"
            value={profileData.user_id}
            onChange={(e) => handleChange('user_id', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block mb-1">First Name</label>
          <input
            type="text"
            value={profileData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block mb-1">Last Name</label>
          <input
            type="text"
            value={profileData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            className="input"
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
                  checked={profileData.gender === g}
                  onChange={(e) => handleChange('gender', e.target.value as UserProfile['gender'])}
                  className="mr-1"
                />
                {g}
              </label>
            ))}
          </div>
        </div>

        {profileData.role === 'student' && (
          <>
            <DepartmentSelect
              department={profileData.department || ''}
              setDepartment={(val) => handleChange('department', val)}
              departments={departments}
            />
            <CourseSelect
              department={profileData.department || ''}
              course={profileData.course || ''}
              setCourse={(val) => handleChange('course', val)}
              coursesByDepartment={coursesByDepartment}
            />
            <YearSelect
              year={profileData.year || ''}
              setYear={(val) => handleChange('year', val)}
              years={years}
            />
          </>
        )}

        <div>
          <label className="block mb-1">Date of Birth</label>
          <input
            type="date"
            value={profileData.date_of_birth}
            onChange={(e) => handleChange('date_of_birth', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block mb-1">Email</label>
          <input type="email" value={profileData.email} disabled className="input" />
        </div>

        <div>
          <label className="block mb-1">Phone Number</label>
          <input
            type="text"
            value={profileData.phone_number}
            onChange={(e) => handleChange('phone_number', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block mb-1">Present Address</label>
          <input
            type="text"
            value={profileData.present_address}
            onChange={(e) => handleChange('present_address', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block mb-1">Home Address</label>
          <input
            type="text"
            value={profileData.home_address}
            onChange={(e) => handleChange('home_address', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block mb-1">Medical History</label>
          <textarea
            value={profileData.medical_history}
            onChange={(e) => handleChange('medical_history', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block mb-1">Emergency Contact Name</label>
          <input
            type="text"
            value={profileData.emergency_contact_name}
            onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block mb-1">Emergency Contact Relation</label>
          <input
            type="text"
            value={profileData.emergency_contact_relation}
            onChange={(e) => handleChange('emergency_contact_relation', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block mb-1">Emergency Contact Phone</label>
          <input
            type="text"
            value={profileData.emergency_contact_phone}
            onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block mb-1">Profile Photo</label>
          {profileData.photo_path && (
            <Image
              src={profileData.photo_path}
              alt="Profile"
              width={96}
              height={96}
              className="mb-2 rounded object-cover"
            />
          )}
          <input
            type="file"
            onChange={(e) => setNewPhoto(e.target.files?.[0] || null)}
            className="input"
            accept="image/*"
          />
        </div>

        <div className="col-span-3 flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={() => onClose()}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditRecord;
