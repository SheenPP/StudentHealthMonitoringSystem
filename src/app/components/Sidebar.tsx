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
  FiCalendar,
} from "react-icons/fi";
import axios from "axios";
import UserProfile from "./UserProfile";

const SkeletonSidebar = ({ isCollapsed }: { isCollapsed: boolean }) => (
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
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("/api/auth/getUser");
        setUser(response.data.user);
      } catch {
        setError("Failed to fetch user information. Please log in.");
      } finally {
        setLoading(false);
      }
    };

    const fetchUnseenAppointments = async () => {
      try {
        const response = await axios.get("/api/appointment/unseen-count");
        setUnseenCount(response.data.count || 0);
      } catch (error) {
        console.error("Failed to fetch unseen appointment count:", error);
      }
    };

    fetchUser();
    fetchUnseenAppointments();
    const interval = setInterval(fetchUnseenAppointments, 30000);
    return () => clearInterval(interval);
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

  const NavItem = ({
    href,
    icon,
    text,
    showBadge,
  }: {
    href: string;
    icon: React.ReactNode;
    text: string;
    showBadge?: boolean;
  }) => (
    <li className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start"}`}>
      <Link
        href={href}
        className={`flex items-center py-1 px-1 transition-colors rounded-lg font-medium ${
          pathname === href ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200 text-gray-700"
        }`}
      >
        {icon}
        {!isCollapsed && (
          <span className="ml-3 flex items-center gap-2">
            {text}
            {showBadge && unseenCount > 0 && (
              <span className="inline-block bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {unseenCount}
              </span>
            )}
          </span>
        )}
      </Link>
    </li>
  );

  return (
    <div
      className={`sidebar bg-gray-50 ${isCollapsed ? "w-24" : "w-64"} p-6 border-r border-gray-200 shadow-md flex flex-col transition-all duration-300 relative`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="py-1 px-1 bg-white border-2 border-black-400 absolute -right-4 top-6 text-gray-600 mb-6 focus:outline-none"
      >
        {isCollapsed ? <FiChevronRight size={24} /> : <FiChevronLeft size={24} />}
      </button>

      {user && <UserProfile user={user} isCollapsed={isCollapsed} error={error} />}

      <nav className="flex-grow mt-4">
        <ul className="space-y-4">
          <NavItem href="/dashboard" icon={<FiGrid size={20} />} text="Dashboard" />
          <hr className="border-gray-300 my-4" />
          <NavItem href="/records" icon={<FiFileText size={20} />} text="Records" />
          <NavItem href="/student-profile" icon={<FiUser size={20} />} text="Student Profile" />
          <NavItem
            href="/appointments"
            icon={<FiCalendar size={20} />}
            text="Appointments"
            showBadge={true}
          />
          <hr className="border-gray-300 my-4" />
          <NavItem href="/visits" icon={<FiBookOpen size={20} />} text="Visits" />
          <NavItem href="/archives" icon={<FiArchive size={20} />} text="Archives" />
        </ul>
      </nav>

      <div className="mt-6">
        {user ? (
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center py-3 text-gray-600 border-t border-gray-200 hover:bg-gray-100 transition-colors rounded-lg ${
              isCollapsed ? "justify-center" : "justify-start"
            }`}
          >
            {!isCollapsed ? "Sign Out" : <FiChevronRight />}
          </button>
        ) : (
          <Link
            href="/"
            className={`w-full flex items-center py-3 text-gray-600 border-t border-gray-200 hover:bg-gray-100 transition-colors rounded-lg ${
              isCollapsed ? "justify-center" : "justify-start"
            }`}
          >
            {!isCollapsed ? "Sign In" : <FiChevronRight />}
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
