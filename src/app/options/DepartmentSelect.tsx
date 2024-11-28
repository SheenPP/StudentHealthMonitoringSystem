import React from 'react';

interface DepartmentSelectProps {
  department: string;
  setDepartment: (value: string) => void;
  departments: string[];
}

const DepartmentSelect: React.FC<DepartmentSelectProps> = ({ department, setDepartment, departments }) => {
  return (
    <div>
      <label className="block mb-1">Filter by Department</label>
      <select
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        className="border border-gray-300 rounded-md p-2 w-full"
        required
      >
        <option value="">Select Department</option>
        {departments.map((dept) => (
          <option key={dept} value={dept}>{dept}</option>
        ))}
      </select>
    </div>
  );
};

export default DepartmentSelect;
