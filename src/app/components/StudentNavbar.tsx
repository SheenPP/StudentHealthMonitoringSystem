"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiMenu, FiX, FiCalendar, FiUser, FiLogOut } from "react-icons/fi";
import axios from "axios";
import Image from "next/image"; // ✅ Optimized Image import

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ first_name: string; last_name: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("/api/auth/getStudentUser", { withCredentials: true });
        setUser(response.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/studentlogout", {}, { withCredentials: true });
      setUser(null);
      router.push("/student/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <Link href="/" className="text-xl font-semibold text-gray-800">
            BISU Clinic
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-800 focus:outline-none"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex space-x-6">
            <Link href="/student/appointments" className="text-gray-700 hover:text-blue-600 flex items-center gap-2">
              <FiCalendar size={20} />
              <span>Appointments</span>
            </Link>
            <Link href="/student/profile" className="text-gray-700 hover:text-blue-600 flex items-center gap-2">
              <FiUser size={20} />
              <span>Profile</span>
            </Link>
          </div>

          {/* User Info & Logout - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <span className="text-gray-600">Loading...</span>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <span className="text-gray-800 font-medium">{user.first_name} {user.last_name}</span>
                <Image
                  src="/user-placeholder.png"
                  alt="User Avatar"
                  width={32}
                  height={32}
                  className="rounded-full border border-gray-300"
                />
                <button onClick={handleLogout} className="flex items-center text-red-600 hover:text-red-800 font-medium">
                  <FiLogOut size={20} className="mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/student/login" className="text-blue-600 font-medium">Login</Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 w-full">
            <div className="flex flex-col space-y-4 p-4">
              <Link href="/student/appointments" className="text-gray-700 hover:text-blue-600 flex items-center gap-2">
                <FiCalendar size={20} />
                <span>Appointments</span>
              </Link>
              <Link href="/student/profile" className="text-gray-700 hover:text-blue-600 flex items-center gap-2">
                <FiUser size={20} />
                <span>Profile</span>
              </Link>
              {loading ? (
                <span className="text-gray-600">Loading...</span>
              ) : user ? (
                <div className="flex flex-col space-y-3">
                  <span className="text-gray-800 font-medium">{user.first_name} {user.last_name}</span>
                  <Image
                    src="/user-placeholder.png"
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="rounded-full border border-gray-300"
                  />
                  <button onClick={handleLogout} className="flex items-center text-red-600 hover:text-red-800 font-medium">
                    <FiLogOut size={20} className="mr-2" />
                    Logout
                  </button>
                </div>
              ) : (
                <Link href="/student/login" className="text-blue-600 font-medium">Login</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
