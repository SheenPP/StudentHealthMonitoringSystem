"use client";
import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { useOptions } from '../options/useOptions'; // Import the hook
import DepartmentSelect from '../options/DepartmentSelect';
import CourseSelect from '../options/CourseSelect';
import YearSelect from '../options/YearSelect';

interface EditRecordProps {
  studentId: string; // studentId passed as a prop for editing an existing record
  onClose: () => void; // Function to close the modal
}

const EditRecord: React.FC<EditRecordProps> = ({ studentId, onClose }) => {
  const [studentData, setStudentData] = useState({
    studentId: "",
    firstName: "",
    lastName: "",
    gender: "", // Gender field
    department: "",
    course: "",
    year: "",
    dateOfBirth: "",
    email: "",
    phoneNumber: "",
    presentAddress: "",
    homeAddress: "",
    medicalHistory: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
    photoPath: "", // Photo path field to hold the existing photo
  });
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { departments, coursesByDepartment, years } = useOptions(); // Use the hook

  // Fetch student data when editing
  useEffect(() => {
    if (!studentId || studentId.trim() === "") {
      console.error("Invalid or missing Student ID.");
      setError("Student ID is required to edit a record.");
      setIsLoading(false);
      return;
    }

    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/students?id=${studentId.trim()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch student data");
        }

        const result = await response.json();

        // Convert date to "yyyy-MM-dd" format
        const formatDate = (dateString: string) => {
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        setStudentData({
          studentId: result.student_id || "",
          firstName: result.first_name || "",
          lastName: result.last_name || "",
          gender: result.gender || "",
          department: result.department || "",
          course: result.course || "",
          year: result.year || "",
          dateOfBirth: result.date_of_birth ? formatDate(result.date_of_birth) : "",
          email: result.email || "",
          phoneNumber: result.phone_number || "",
          presentAddress: result.present_address || "",
          homeAddress: result.home_address || "",
          medicalHistory: result.medical_history || "",
          emergencyContactName: result.emergency_contact_name || "",
          emergencyContactRelation: result.emergency_contact_relation || "",
          emergencyContactPhone: result.emergency_contact_phone || "",
          photoPath: result.photo_path || "",
        });

        setError(null);
      } catch (error) {
        console.error("Error fetching student data:", error);
        setError("Error fetching student data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId || studentId.trim() === "") {
      alert("Student ID is required to update the record.");
      return;
    }

    const formData = new FormData();
    formData.append("student_id", studentData.studentId);
    formData.append("first_name", studentData.firstName);
    formData.append("last_name", studentData.lastName);
    formData.append("gender", studentData.gender);
    formData.append("department", studentData.department);
    formData.append("course", studentData.course);
    formData.append("year", studentData.year);
    formData.append("date_of_birth", studentData.dateOfBirth);
    formData.append("email", studentData.email);
    formData.append("phone_number", studentData.phoneNumber);
    formData.append("present_address", studentData.presentAddress);
    formData.append("home_address", studentData.homeAddress);
    formData.append("medical_history", studentData.medicalHistory);
    formData.append("emergency_contact_name", studentData.emergencyContactName);
    formData.append("emergency_contact_relation", studentData.emergencyContactRelation);
    formData.append("emergency_contact_phone", studentData.emergencyContactPhone);

    if (newPhoto) {
      formData.append("student_photo", newPhoto);
    }

    try {
      const response = await fetch(`/api/students?id=${studentId.trim()}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        console.error("Failed to update student record:", result.message);
        alert("Failed to update student record.");
      } else {
        alert("Student record updated successfully!");
        onClose();
      }
    } catch (error) {
      console.error("Error submitting student data:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? Unsaved changes will be lost.")) {
      onClose();
    }
  };

  const handleChange = (field: string, value: string) => {
    setStudentData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewPhoto(e.target.files[0]);
    }
  };

  return (
    <>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
      >
        <FiX size={24} />
      </button>
      <h2 className="text-xl font-semibold mb-4">Edit Student Record</h2>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" encType="multipart/form-data">
          <div>
            <label className="block mb-1">Student ID</label>
            <input
              type="text"
              value={studentData.studentId}
              onChange={(e) => handleChange("studentId", e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
              required
              disabled
            />
          </div>
          <div>
            <label className="block mb-1">First Name</label>
            <input
              type="text"
              value={studentData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Last Name</label>
            <input
              type="text"
              value={studentData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Gender</label>
            <select
              value={studentData.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <DepartmentSelect
            department={studentData.department}
            setDepartment={(value) => handleChange("department", value)}
            departments={departments}
          />

          <CourseSelect
            department={studentData.department}
            course={studentData.course}
            setCourse={(value) => handleChange("course", value)}
            coursesByDepartment={coursesByDepartment}
          />

          <YearSelect
            year={studentData.year}
            setYear={(value) => handleChange("year", value)}
            years={years}
          />

          <div>
            <label className="block mb-1">Date of Birth</label>
            <input
              type="date"
              value={studentData.dateOfBirth}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              value={studentData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Phone Number</label>
            <input
              type="text"
              value={studentData.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Present Address</label>
            <input
              type="text"
              value={studentData.presentAddress}
              onChange={(e) => handleChange("presentAddress", e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Home Address</label>
            <input
              type="text"
              value={studentData.homeAddress}
              onChange={(e) => handleChange("homeAddress", e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Medical History</label>
            <textarea
              value={studentData.medicalHistory}
              onChange={(e) => handleChange("medicalHistory", e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Emergency Contact Name</label>
            <input
              type="text"
              value={studentData.emergencyContactName}
              onChange={(e) => handleChange("emergencyContactName", e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Emergency Contact Relation</label>
            <input
              type="text"
              value={studentData.emergencyContactRelation}
              onChange={(e) => handleChange("emergencyContactRelation", e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Emergency Contact Phone</label>
            <input
              type="text"
              value={studentData.emergencyContactPhone}
              onChange={(e) => handleChange("emergencyContactPhone", e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Student Photo</label>
            {studentData.photoPath && (
              <div className="mb-2">
                <img
                  src={studentData.photoPath}
                  alt="Student Photo"
                  className="w-24 h-24 object-cover rounded-md"
                />
              </div>
            )}
            <input
              type="file"
              onChange={handlePhotoChange}
              className="border border-gray-300 rounded-md p-2 w-full"
              accept="image/*"
            />
          </div>

          <div className="col-span-2 text-right mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 text-white py-2 px-4 rounded-md mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}
    </>
  );
};

export default EditRecord;
