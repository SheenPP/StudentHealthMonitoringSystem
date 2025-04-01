"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiFileText,
  FiArchive,
  FiBookOpen,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
} from "react-icons/fi";
import axios from "axios";
import UserProfile from "./UserProfile";

const SkeletonSidebar = ({ isCollapsed }: { isCollapsed: boolean }) => {
  return (
    <div
      className={`sidebar bg-gray-50 ${isCollapsed ? "w-24" : "w-64"} p-6 border-r border-gray-200 shadow-md flex flex-col transition-all duration-300 relative animate-pulse`}
    >
      <div className="h-16 w-full bg-gray-200 rounded mb-4"></div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-10 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="mt-auto h-10 bg-gray-200 rounded"></div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<{
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
    position: string;
    profile_picture: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("/api/auth/getUser");
        setUser(response.data.user);
      } catch (err) {
        setError("Failed to fetch user information. Please log in.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await axios.post("/api/auth/logout");
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  if (loading) {
    return <SkeletonSidebar isCollapsed={isCollapsed} />;
  }

  return (
    <div className={`sidebar bg-gray-50 ${isCollapsed ? "w-24" : "w-64"} p-6 border-r border-gray-200 shadow-md flex flex-col transition-all duration-300 relative`}>
      {/* Toggle Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="py-1 px-1 bg-white border-2 border-black-400 absolute -right-4 top-6 text-gray-600 mb-6 focus:outline-none"
      >
        {isCollapsed ? <FiChevronRight size={24} /> : <FiChevronLeft size={24} />}
      </button>

      {/* User Profile */}
      {user && (
        <UserProfile
          user={user}
          isCollapsed={isCollapsed}
          error={error}
        />
      )}

      {/* Navigation */}
      <nav className="flex-grow mt-4">
        <ul className="space-y-4">
          <li className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start"}`}>
            <Link
              href="/dashboard"
              className={`flex items-center py-1 px-1 transition-colors rounded-lg font-medium ${pathname === "/dashboard" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200 text-gray-700"}`}
            >
              <FiGrid size={20} />
              {!isCollapsed && <span className="ml-3">Dashboard</span>}
            </Link>
          </li>
          <hr className="border-gray-300 my-4" />
          <li className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start"}`}>
            <Link
              href="/records"
              className={`flex items-center py-1 px-1 transition-colors rounded-lg font-medium ${pathname === "/records" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200 text-gray-700"}`}
            >
              <FiFileText size={20} />
              {!isCollapsed && <span className="ml-3">Records</span>}
            </Link>
          </li>
          <li className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start"}`}>
            <Link
              href="/student-profile"
              className={`flex items-center py-1 px-1 transition-colors rounded-lg font-medium ${pathname === "/student-profile" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200 text-gray-700"}`}
            >
              <FiUser size={20} />
              {!isCollapsed && <span className="ml-3">Student Profile</span>}
            </Link>
          </li>
          <hr className="border-gray-300 my-4" />
          <li className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start"}`}>
            <Link
              href="/logs"
              className={`flex items-center py-1 px-1 transition-colors rounded-lg font-medium ${pathname === "/logs" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200 text-gray-700"}`}
            >
              <FiBookOpen size={20} />
              {!isCollapsed && <span className="ml-3">Logs</span>}
            </Link>
          </li>
          <li className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start"}`}>
            <Link
              href="/archives"
              className={`flex items-center py-1 px-1 transition-colors rounded-lg font-medium ${pathname === "/archives" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200 text-gray-700"}`}
            >
              <FiArchive size={20} />
              {!isCollapsed && <span className="ml-3">Archives</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Footer Section */}
      <div className="mt-6">
        {user ? (
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center py-3 text-gray-600 border-t border-gray-200 hover:bg-gray-100 transition-colors rounded-lg ${isCollapsed ? "justify-center" : "justify-start"}`}
          >
            {!isCollapsed ? "Sign Out" : <FiChevronRight />}
          </button>
        ) : (
          <Link
            href="/"
            className={`w-full flex items-center py-3 text-gray-600 border-t border-gray-200 hover:bg-gray-100 transition-colors rounded-lg ${isCollapsed ? "justify-center" : "justify-start"}`}
          >
            {!isCollapsed ? "Sign In" : <FiChevronRight />}
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
