import React from 'react';

interface DepartmentSelectProps {
  department: string;
  setDepartment: (value: string) => void;
  departments: string[];
}

const DepartmentSelect: React.FC<DepartmentSelectProps> = ({
  department,
  setDepartment,
  departments,
}) => {
  return (
    <div>
      <label className="block mb-1 text-gray-700 dark:text-gray-200">Filter by Department</label>
      <select
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        className="border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md p-2 w-full font-semibold"
        required
      >
        <option value="">Select Department</option>
        {departments.map((dept) => (
          <option key={dept} value={dept}>
            {dept}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DepartmentSelect;
