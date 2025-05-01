"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useOptions } from "../options/useOptions";
import DepartmentSelect from "../options/DepartmentSelect";
import CourseSelect from "../options/CourseSelect";
import YearSelect from "../options/YearSelect";
import axios from "axios";

interface AddRecordProps {
  onAddSuccess: () => void;
  onAddFailure: (errorType: string) => void;
}

const AddRecord: React.FC<AddRecordProps> = ({ onAddSuccess, onAddFailure }) => {
  const supabase = createClientComponentClient();
  const [profileType, setProfileType] = useState<"student" | "teacher">("student");

  const [studentId, setStudentId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [studentPhoto, setStudentPhoto] = useState<File | null>(null);
  const [age, setAge] = useState<number | null>(null);

  const { departments, coursesByDepartment, years } = useOptions();

  useEffect(() => {
    if (email) {
      const fetchAccountData = async () => {
        try {
          const response = await axios.get("/api/admin/getUserProfile", {
            params: { email },
            withCredentials: true,
          });

          if (response.status === 200 && response.data) {
            const {
              account_first_name,
              account_middle_name,
              account_last_name,
              profile_first_name,
              middle_name,
              profile_last_name,
              gender,
              date_of_birth,
              age,
              phone_number,
              present_address,
              home_address,
              medical_history,
              emergency_contact_name,
              emergency_contact_relation,
              emergency_contact_phone,
            } = response.data;

            setFirstName(capitalize(profile_first_name ?? account_first_name ?? ""));
            setMiddleName(capitalize(middle_name ?? account_middle_name ?? ""));
            setLastName(capitalize(profile_last_name ?? account_last_name ?? ""));
            setGender(gender ?? "");
            setDateOfBirth(date_of_birth ?? "");
            setAge(age ?? null);
            setPhoneNumber(phone_number ?? "");
            setPresentAddress(present_address ?? "");
            setHomeAddress(home_address ?? "");
            setMedicalHistory(medical_history ?? "");
            setEmergencyContactName(emergency_contact_name ?? "");
            setEmergencyContactRelation(emergency_contact_relation ?? "");
            setEmergencyContactPhone(emergency_contact_phone ?? "");
          }
        } catch (error) {
          console.error("Error fetching account data:", error);
        }
      };

      fetchAccountData();
    }
  }, [email]);

  useEffect(() => {
    if (dateOfBirth) {
      const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const ageDate = new Date();
        let age = ageDate.getFullYear() - birthDate.getFullYear();
        const month = ageDate.getMonth() - birthDate.getMonth();
        if (month < 0 || (month === 0 && ageDate.getDate() < birthDate.getDate())) {
          age--;
        }
        setAge(age);
      };
      calculateAge(dateOfBirth);
    }
  }, [dateOfBirth]);

  const capitalize = (text: string) => {
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = studentId.trim() || `temp-${Date.now()}`;
    let photoUrl = "";

    if (studentPhoto) {
      const fileExt = studentPhoto.name.split(".").pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, studentPhoto, {
          upsert: true,
          contentType: studentPhoto.type,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        onAddFailure("upload");
        return;
      }

      const { data } = supabase.storage.from("profile-photos").getPublicUrl(filePath);
      photoUrl = data.publicUrl;
    }

    const profileRes = await fetch("/api/user-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        role: profileType,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        gender,
        date_of_birth: dateOfBirth,
        email,
        phone_number: phoneNumber,
        present_address: presentAddress,
        home_address: homeAddress,
        photo_path: photoUrl,
        medical_history: medicalHistory,
        emergency_contact_name: emergencyContactName,
        emergency_contact_relation: emergencyContactRelation,
        emergency_contact_phone: emergencyContactPhone,
        age,
        ...(profileType === "student" && { department, course, year }),
      }),
    });

    if (!profileRes.ok) {
      if (profileRes.status === 409) return onAddFailure("duplicate");
      return onAddFailure("general");
    }

    try {
      await fetch("/api/accounts/assignUserId", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, user_id: userId }),
      });
    } catch (error) {
      console.error("Failed to assign user_id to account:", error);
    }

    onAddSuccess();
  };

  return (
    <div className="relative dark:bg-black p-4 rounded-md">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Email */}
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
            required
          />
        </div>

        {/* Profile Type */}
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Profile Type</label>
          <select
            value={profileType}
            onChange={(e) => setProfileType(e.target.value as "student" | "teacher")}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        {/* ID */}
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">ID</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
            placeholder="Leave blank if not yet assigned"
          />
        </div>

        {/* First Name */}
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(capitalize(e.target.value))}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
            required
          />
        </div>

        {/* Middle Name */}
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Middle Name</label>
          <input
            type="text"
            value={middleName}
            onChange={(e) => setMiddleName(capitalize(e.target.value))}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(capitalize(e.target.value))}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
            required
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Gender</label>
          <div className="flex gap-4 text-gray-800 dark:text-gray-200 font-semibold">
            <label>
              <input
                type="radio"
                value="Male"
                checked={gender === "Male"}
                onChange={(e) => setGender(e.target.value)}
                className="mr-1"
              />
              Male
            </label>
            <label>
              <input
                type="radio"
                value="Female"
                checked={gender === "Female"}
                onChange={(e) => setGender(e.target.value)}
                className="mr-1"
              />
              Female
            </label>
          </div>
        </div>

        {/* Student-specific fields */}
        {profileType === "student" && (
          <>
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
          </>
        )}

        {/* Date of Birth */}
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

        {/* Age */}
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Age</label>
          <input
            type="text"
            value={age || ""}
            readOnly
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
          />
        </div>

        {/* Present Address */}
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Present Address</label>
          <input
            type="text"
            value={presentAddress}
            onChange={(e) => setPresentAddress(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
          />
        </div>

        {/* Home Address */}
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Home Address</label>
          <input
            type="text"
            value={homeAddress}
            onChange={(e) => setHomeAddress(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
          />
        </div>

        {/* Medical History */}
        <div>
          <label className="block mb-1">Medical History</label>
          <textarea
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
            rows={3}
          />
        </div>

        {/* Emergency Contact */}
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

        {/* Profile Photo */}
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-200">Profile Photo</label>
          <input
            type="file"
            onChange={(e) => setStudentPhoto(e.target.files?.[0] || null)}
            className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 text-white rounded-md p-2 w-full font-semibold"
            accept="image/*"
          />
        </div>

        {/* Submit Button */}
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
