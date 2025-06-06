"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useOptions } from "../options/useOptions";
import DepartmentSelect from "../options/DepartmentSelect";
import CourseSelect from "../options/CourseSelect";
import YearSelect from "../options/YearSelect";

interface HealthRecordFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const HealthRecordForm: React.FC<HealthRecordFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    student_id: "",
    name: "",
    department: "",
    course: "",
    year: "",
    gender: "",
    age: "",
    home_address: "",
    present_address: "",
    contact_number: "",
    emergency_contact_name: "",
    emergency_contact_relation: "",
    emergency_contact_phone: "",
    status: "Sick",
    date_of_visit: "",
    diagnosis: "",
    treatment: "",
    medications: "",
    notes: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { departments, coursesByDepartment, years } = useOptions();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const fetchStudentInfo = async (studentId: string) => {
    try {
      const res = await fetch(`/api/students?id=${studentId}`);
      if (!res.ok) throw new Error("Student not found");
      const data = await res.json();

      setFormData((prev) => ({
        ...prev,
        name: `${data.first_name} ${data.last_name}`,
        department: data.department,
        course: data.course,
        year: data.year,
        gender: data.gender,
        home_address: data.home_address,
        present_address: data.present_address,
        contact_number: data.phone_number,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_relation: data.emergency_contact_relation,
        emergency_contact_phone: data.emergency_contact_phone,
      }));

      toast.success("Student info auto-filled");
    } catch {
      toast.error("Student not found or error fetching data");
    }
  };

  const handleStudentIdBlur = () => {
    if (formData.student_id.trim()) {
      fetchStudentInfo(formData.student_id.trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/healthRecords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Health record added successfully!");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to add health record.");
        toast.error(errorData.message || "Failed to add health record.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-black p-6 rounded-lg shadow-xl max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Add Health Record</h2>

      {isLoading && <p className="text-blue-500 mb-2">Submitting health record...</p>}
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Student ID</label>
            <input
              type="text"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              onBlur={handleStudentIdBlur}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-3 gap-4">
          <DepartmentSelect
            department={formData.department}
            setDepartment={(value) =>
              setFormData({ ...formData, department: value, course: "" })
            }
            departments={departments}
          />
          <CourseSelect
            department={formData.department}
            course={formData.course}
            setCourse={(value) => setFormData({ ...formData, course: value })}
            coursesByDepartment={coursesByDepartment}
          />
          <YearSelect
            year={formData.year}
            setYear={(value) => setFormData({ ...formData, year: value })}
            years={years}
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Contact Number</label>
            <input
              type="text"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Date of Visit</label>
            <input
              type="date"
              name="date_of_visit"
              value={formData.date_of_visit}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
              required
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Emergency Contact Name</label>
            <input
              type="text"
              name="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Relation</label>
            <input
              type="text"
              name="emergency_contact_relation"
              value={formData.emergency_contact_relation}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Phone</label>
            <input
              type="text"
              name="emergency_contact_phone"
              value={formData.emergency_contact_phone}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
            />
          </div>
        </div>

        {/* Medical Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Diagnosis</label>
            <input
              type="text"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Treatment</label>
            <textarea
              name="treatment"
              value={formData.treatment}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
              rows={3}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-400 text-gray-700 dark:text-white dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Add Record
          </button>
        </div>
      </form>
    </div>
  );
};

export default HealthRecordForm;
