"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Navbar from "../../components/StudentNavbar";
import Image from "next/image";

interface StudentUser {
  first_name: string;
  last_name: string;
  email?: string;
  student_id: string;
  photo_path?: string;
}

export default function StudentDashboard() {
  const [student, setStudent] = useState<StudentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await axios.get("/api/auth/getStudentUser", {
          withCredentials: true,
        });

        if (!response.data || response.status !== 200) {
          throw new Error("User not authenticated");
        }

        setStudent(response.data);
      } catch (error) {
        console.error("Authentication error:", error);
        router.push("/student/login");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen dark:bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const initials = `${student?.first_name?.[0] ?? ''}${student?.last_name?.[0] ?? ''}`.toUpperCase();

  const avatarSrc =
    student?.photo_path && student.photo_path.trim() !== ""
      ? student.photo_path
      : "";

  return (
    <>
      <Navbar />

      <div className="max-w-2xl mx-auto mt-10 p-6 dark:bg-black">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
          Welcome to Your Dashboard
        </h1>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 flex flex-col items-center text-center border dark:border-gray-700">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center text-3xl font-semibold mb-4 overflow-hidden">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt="Student Avatar"
                width={96}
                height={96}
                className="rounded-full object-cover w-full h-full"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Info */}
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {student?.first_name} {student?.last_name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Student ID:</strong> {student?.student_id}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Email:</strong> {student?.email}
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mt-6">
          <Link href="/student/appointments">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition duration-200">
              Manage Appointments
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
