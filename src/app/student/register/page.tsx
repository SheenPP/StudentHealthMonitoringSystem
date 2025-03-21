// pages/student-register.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import StudentRegistration from "../../components/StudentRegistration";
import { FiMenu } from "react-icons/fi";

const StudentRegisterPage = () => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("/api/auth/getStudentUser", {
          withCredentials: true,
        });

        if (response.status === 200 && response.data) {
          setIsLoggedIn(true);
          router.push("/student/dashboard");
        }
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col"
      style={{ backgroundImage: "url('/bisu.jpg')" }}
    >
      {/* Overlay */}
      <div className="bg-black bg-opacity-50 min-h-screen flex flex-col">
        {/* Navbar */}
        <nav className="flex justify-between items-center p-4 md:p-6 bg-white bg-opacity-90 shadow-md">
          <div className="text-lg md:text-xl font-bold text-blue-500">
            BISU Clinic
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <FiMenu className="text-blue-500 text-2xl" />
            </button>
          </div>

          {/* Desktop Menu */}
          <ul className="hidden md:flex space-x-6">
            <li>
              <Link href="/" className="text-blue-500 font-medium">
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/Page404"
                className="text-gray-600 hover:text-blue-500 transition"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/Page404"
                className="text-gray-600 hover:text-blue-500 transition"
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white bg-opacity-90 shadow-md absolute w-full">
            <ul className="flex flex-col items-center p-4 space-y-3">
              <li>
                <Link href="/" className="text-blue-500 font-medium">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/Page404"
                  className="text-gray-600 hover:text-blue-500 transition"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/Page404"
                  className="text-gray-600 hover:text-blue-500 transition"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Hero Section */}
        <section className="flex flex-col md:flex-row items-center justify-center px-6 md:px-12 py-8 md:py-16 text-white">
          <div className="md:w-1/2 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-300">
              HEALTH CARE
            </h1>
            <p className="mt-4 text-gray-200 leading-relaxed text-sm md:text-base">
              Register to access our Student's Profiling Health Management
              System. Keep your health records organized and secure.
            </p>

            {/* Student Registration Section */}
            {!isLoggedIn && (
              <div className="mt-6">
                <StudentRegistration />
              </div>
            )}
          </div>

          <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center">
            <img
              src="/building.gif"
              alt="Healthcare GIF"
              className="w-4/5 md:w-full h-auto max-w-sm md:max-w-full"
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentRegisterPage;
