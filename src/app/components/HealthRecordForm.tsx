"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useOptions } from "../options/useOptions";
import DepartmentSelect from "../options/DepartmentSelect";
import CourseSelect from "../options/CourseSelect";
import YearSelect from "../options/YearSelect";
import { useSchoolTerm } from "../context/SchoolTermContext";

interface HealthRecordFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface UserProfile {
  user_id: string;
  role: "student" | "teacher";
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  phone_number: string;
  present_address: string;
  home_address: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  department: string | null;
  course: string | null;
  year: string | null;
}

const HealthRecordForm: React.FC<HealthRecordFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    user_id: "",
    name: "",
    role: "",
    department: "",
    course: "",
    year: "",
    gender: "",
    age: "",
    date_of_birth: "",
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
  const { selectedTermId } = useSchoolTerm();

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [nameSuggestions, setNameSuggestions] = useState<UserProfile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/user-profiles");
        const data: UserProfile[] = await res.json();
        setAllUsers(data);
      } catch (err) {
        console.error("Failed to load user profiles for suggestions");
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/user-profiles?user_id=${userId}`);
      if (!res.ok) throw new Error("User not found");

      const data: UserProfile = await res.json();

      const birthDate = new Date(data.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      setFormData((prev) => ({
        ...prev,
        user_id: data.user_id,
        name: `${data.first_name} ${data.last_name}`,
        role: data.role,
        department: data.department ?? "",
        course: data.course ?? "",
        year: data.year ?? "",
        gender: data.gender,
        date_of_birth: data.date_of_birth.split("T")[0],
        age: age.toString(),
        home_address: data.home_address,
        present_address: data.present_address,
        contact_number: data.phone_number,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_relation: data.emergency_contact_relation,
        emergency_contact_phone: data.emergency_contact_phone,
      }));

      toast.success(`User found (${data.role}) and info auto-filled`);
    } catch (error) {
      console.warn("User not found. Manual entry enabled.");
      toast.info("User not found. You may manually fill out the form.");
      setFormData((prev) => ({ ...prev, role: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!selectedTermId) {
      toast.error("Please select a school term.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/healthRecords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, term_id: selectedTermId }),
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
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">User ID</label>
            <input
              type="text"
              name="user_id"
              value={formData.user_id}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => {
                handleChange(e);
                const input = e.target.value.toLowerCase();
                if (input.length >= 2) {
                  const filtered = allUsers.filter((u) =>
                    `${u.first_name} ${u.last_name}`.toLowerCase().includes(input)
                  );
                  setNameSuggestions(filtered);
                  setShowSuggestions(true);
                } else {
                  setShowSuggestions(false);
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onFocus={() => formData.name.length >= 2 && setShowSuggestions(true)}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
              required
            />
            {showSuggestions && nameSuggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {nameSuggestions.map((user) => {
                  const fullName = `${user.first_name} ${user.last_name}`;
                  return (
                    <li
                      key={user.user_id}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        fetchUserProfile(user.user_id);
                        setFormData((prev) => ({ ...prev, name: fullName }));
                        setShowSuggestions(false);
                      }}
                    >
                      {fullName}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Role</label>
            <input
              type="text"
              name="role"
              value={formData.role}
              disabled
              className="w-full mt-1 p-2 border rounded-md bg-gray-100 dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>
        </div>

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

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Birthday</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
            />
          </div>
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
        </div>

        <div className="grid grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Emergency Contact Relation</label>
            <input
              type="text"
              name="emergency_contact_relation"
              value={formData.emergency_contact_relation}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Emergency Contact Phone</label>
            <input
              type="text"
              name="emergency_contact_phone"
              value={formData.emergency_contact_phone}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Diagnosis</label>
            <input
              type="text"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Medications</label>
            <textarea
              name="medications"
              value={formData.medications}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-md font-semibold dark:bg-gray-900 dark:text-white dark:border-gray-700"
              rows={3}
            />
          </div>
        </div>

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
