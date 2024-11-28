import React from 'react';

interface CourseSelectProps {
  department: string;
  course: string;
  setCourse: (value: string) => void;
  coursesByDepartment: Record<string, string[]>;
}

const CourseSelect: React.FC<CourseSelectProps> = ({ department, course, setCourse, coursesByDepartment }) => {
  return (
    <div>
      <label className="block mb-1">Filter by Course</label>
      <select
        value={course}
        onChange={(e) => setCourse(e.target.value)}
        className="border border-gray-300 rounded-md p-2 w-full"
        required
        disabled={!department}
      >
        <option value="">Select Course</option>
        {department && coursesByDepartment[department]?.map((course) => (
          <option key={course} value={course}>{course}</option>
        ))}
      </select>
    </div>
  );
};

export default CourseSelect;
