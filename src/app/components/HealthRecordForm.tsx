import { useState } from 'react';
import { useOptions } from '../options/useOptions'; // Import the hook
import DepartmentSelect from '../options/DepartmentSelect';
import CourseSelect from '../options/CourseSelect';
import YearSelect from '../options/YearSelect';

interface HealthRecordFormProps {
  onClose: () => void; // Function to close the modal
}

const HealthRecordForm: React.FC<HealthRecordFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    department: '',
    course: '',
    year: '',
    gender: '',
    age: '', // New field
    home_address: '',
    present_address: '',
    contact_number: '',
    emergency_contact_name: '',
    emergency_contact_relation: '',
    emergency_contact_phone: '',
    status: 'Sick', // default value
    date_of_visit: '',
    diagnosis: '',
    notes: '',
    treatment: '', // New field
    medications: '', // New field
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { departments, coursesByDepartment, years } = useOptions(); // Use the hook

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));

    if (name === 'student_id') {
      fetchStudentData(value);
    }
  };

  const handleDepartmentChange = (value: string) => {
    setFormData(prevData => ({
      ...prevData,
      department: value,
      course: '', // Reset course when department changes
    }));
  };

  const handleCourseChange = (value: string) => {
    setFormData(prevData => ({
      ...prevData,
      course: value,
    }));
  };

  const handleYearChange = (value: string) => {
    setFormData(prevData => ({
      ...prevData,
      year: value,
    }));
  };

  const fetchStudentData = async (studentId: string) => {
    if (studentId) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/students?id=${studentId.trim()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch student data");
        }

        const student = await response.json();

        setFormData(prevData => ({
          ...prevData,
          name: `${student.first_name} ${student.last_name}`,
          department: student.department,
          course: student.course,
          year: student.year,
          gender: student.gender,
          age: student.age, // New field
          home_address: student.home_address,
          present_address: student.present_address,
          contact_number: student.phone_number,
          emergency_contact_name: student.emergency_contact_name,
          emergency_contact_relation: student.emergency_contact_relation,
          emergency_contact_phone: student.emergency_contact_phone,
        }));

        setError(null);
      } catch (error) {
        console.error("Error fetching student data:", error);
        setError("Error fetching student data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const studentExists = await checkStudentExists(formData.student_id);
    if (!studentExists) {
      alert('Student ID does not exist. Please check and try again.');
      return;
    }

    try {
      const response = await fetch('/api/healthRecords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Health record added successfully!');
        setFormData({
          student_id: '',
          name: '',
          department: '',
          course: '',
          year: '',
          gender: '',
          age: '', // Reset the age field
          home_address: '',
          present_address: '',
          contact_number: '',
          emergency_contact_name: '',
          emergency_contact_relation: '',
          emergency_contact_phone: '',
          status: 'Sick',
          date_of_visit: '',
          diagnosis: '',
          notes: '',
          treatment: '', // Reset treatment field
          medications: '', // Reset medications field
        });
        onClose();
      } else {
        console.error('Error adding health record:', await response.json());
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const checkStudentExists = async (studentId: string) => {
    try {
      const response = await fetch(`/api/students?id=${studentId.trim()}`);
      return response.ok;
    } catch (error) {
      console.error('Error checking student existence:', error);
      return false;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-lg shadow-md z-50 max-w-7xl mx-auto"
    >
      <h2 className="text-lg font-bold text-gray-800 mb-4">Add Health Record</h2>

      {isLoading && <p>Loading student data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="block text-gray-600">Student ID</label>
          <input
            type="text"
            name="student_id"
            value={formData.student_id}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
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
            className="mt-1 block w-full p-2 border rounded-md"
            required
          />
        </div>

        <DepartmentSelect
          department={formData.department}
          setDepartment={handleDepartmentChange}
          departments={departments}
        />

        <CourseSelect
          department={formData.department}
          course={formData.course}
          setCourse={handleCourseChange}
          coursesByDepartment={coursesByDepartment}
        />

        <YearSelect
          year={formData.year}
          setYear={handleYearChange}
          years={years}
        />

        <div>
          <label className="block text-gray-600">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-600">Age</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-gray-600">Present Address</label>
          <textarea
            name="present_address"
            value={formData.present_address}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-gray-600">Home Address</label>
          <textarea
            name="home_address"
            value={formData.home_address}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-gray-600">Contact Number</label>
          <input
            type="text"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-gray-600">Emergency Contact Name</label>
          <input
            type="text"
            name="emergency_contact_name"
            value={formData.emergency_contact_name}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-gray-600">Emergency Contact Relation</label>
          <input
            type="text"
            name="emergency_contact_relation"
            value={formData.emergency_contact_relation}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-gray-600">Emergency Contact Phone</label>
          <input
            type="text"
            name="emergency_contact_phone"
            value={formData.emergency_contact_phone}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-gray-600">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
          >
            <option value="Sick">Sick</option>
            <option value="Recovered">Recovered</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-600">Date of Visit</label>
          <input
            type="date"
            name="date_of_visit"
            value={formData.date_of_visit}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-gray-600">Diagnosis</label>
          <input
            type="text"
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-gray-600">Treatment</label>
          <textarea
            name="treatment"
            value={formData.treatment}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
            rows={4}
          />
        </div>
        <div>
          <label className="block text-gray-600">Medications</label>
          <textarea
            name="medications"
            value={formData.medications}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
            rows={4}
          />
        </div>
        <div className="col-span-3">
          <label className="block text-gray-600">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border rounded-md"
            rows={4}
          />
        </div>
      </div>

      <button type="submit" className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg">
        Add Record
      </button>
    </form>
  );
};

export default HealthRecordForm;
