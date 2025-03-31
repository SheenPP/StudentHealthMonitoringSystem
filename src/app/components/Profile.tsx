type Student = {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export default function Profile({ student }: { student: Student }) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-left">
      {/* Avatar Placeholder */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-3xl font-semibold">
        {student.first_name.charAt(0)}
        {student.last_name.charAt(0)}
      </div>

      {/* Profile Details */}
      <div className="w-full">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Student Profile</h2>
        <div className="text-gray-700 space-y-2">
          <p>
            <strong className="text-gray-900">Student ID:</strong>{" "}
            {student.student_id}
          </p>
          <p>
            <strong className="text-gray-900">Name:</strong>{" "}
            {student.first_name} {student.last_name}
          </p>
          <p>
            <strong className="text-gray-900">Email:</strong> {student.email}
          </p>
        </div>
      </div>
    </div>
  );
}
