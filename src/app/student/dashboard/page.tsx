"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/StudentNavbar";
import Profile from "../../components/Profile";
import axios from "axios";

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Next.js router for redirection

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await axios.get("/api/auth/getStudentUser", {
          withCredentials: true, // Ensures cookies are sent/received
        });

        if (!response.data || response.status !== 200) {
          throw new Error("User not authenticated");
        }

        setStudent(response.data);
      } catch (error) {
        console.error("Authentication error:", error); // ✅ Use the error here
        // If user is not authenticated, redirect to login page
        router.push("/student/login");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [router]); // Ensure router is available in useEffect

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      {/* Navbar */}
      <Navbar />

      {/* Main Dashboard Container */}
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Welcome to Your Dashboard
        </h1>

        {/* Profile Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            Your Profile
          </h2>
          {student && <Profile student={student} />}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Link href="/student/appointments">
            <button className="px-5 py-3 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600 transition-all">
              Manage Appointments
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
