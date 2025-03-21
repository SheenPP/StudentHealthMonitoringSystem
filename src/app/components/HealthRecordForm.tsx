import { useState } from "react";
import { useOptions } from "../options/useOptions";
import DepartmentSelect from "../options/DepartmentSelect";
import CourseSelect from "../options/CourseSelect";
import YearSelect from "../options/YearSelect";

interface HealthRecordFormProps {
  onClose: () => void;
}

const HealthRecordForm: React.FC<HealthRecordFormProps> = ({ onClose }) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/healthRecords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Health record added successfully!");
        onClose();
      } else {
        console.error("Error adding health record:", await response.json());
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Health Record</h2>
      
      {isLoading && <p className="text-blue-600">Loading student data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-600">Student ID</label>
            <input
              type="text"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-gray-600">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-gray-600">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Dropdown Selections */}
        <div className="grid grid-cols-3 gap-4">
          <DepartmentSelect
            department={formData.department}
            setDepartment={(value) => setFormData({ ...formData, department: value, course: "" })}
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

        {/* Contact Information */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-600">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-gray-600">Contact Number</label>
            <input
              type="text"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-gray-600">Date of Visit</label>
            <input
              type="date"
              name="date_of_visit"
              value={formData.date_of_visit}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-600">Emergency Contact Name</label>
            <input
              type="text"
              name="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-gray-600">Relation</label>
            <input
              type="text"
              name="emergency_contact_relation"
              value={formData.emergency_contact_relation}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-gray-600">Phone</label>
            <input
              type="text"
              name="emergency_contact_phone"
              value={formData.emergency_contact_phone}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        {/* Medical Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600">Diagnosis</label>
            <input
              type="text"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-gray-600">Treatment</label>
            <textarea
              name="treatment"
              value={formData.treatment}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        {/* Submit & Close Buttons */}
        <div className="flex justify-end space-x-4 mt-6 sticky bottom-0 bg-white p-4">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg">
            Add Record
          </button>
        </div>
      </form>
    </div>
  );
};

export default HealthRecordForm;
