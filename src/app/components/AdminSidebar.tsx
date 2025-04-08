"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FiGrid,
  FiFileText,
  FiCalendar,
  FiArchive,
  FiBookOpen,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
} from "react-icons/fi";
import axios from "axios";

// Skeleton Sidebar Loader
const SkeletonSidebar = ({ isCollapsed }: { isCollapsed: boolean }) => {
  return (
    <div
      className={`bg-gray-50 ${isCollapsed ? "w-24" : "w-64"} h-screen p-6 border-r border-gray-200 shadow-md flex flex-col transition-all duration-300 animate-pulse`}
    >
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-10 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="mt-auto h-10 bg-gray-200 rounded"></div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<{
    username: string;
    email?: string;
    role: string;
    position: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("/api/auth/getAdminUser", {
          withCredentials: true,
        });
        setUser(response.data.user);
      } catch {
        setError("Failed to fetch user information. Please log in.");
      } finally {
        setLoading(false);
      }
    };

    const fetchUnseenCount = async () => {
      try {
        const response = await axios.get("/api/appointment/unseen-count");
        console.log("API response:", response.data);
        setUnseenCount(response.data.count || 0);
      } catch (error) {
        console.error("Failed to fetch unseen appointment count:", error);
      }
    };
    

    fetchUser();
    fetchUnseenCount();
    const interval = setInterval(fetchUnseenCount, 5000); // refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      await axios.post("/api/auth/adminlogout", {}, { withCredentials: true });
      router.push("/admin/login");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  if (loading) {
    return <SkeletonSidebar isCollapsed={isCollapsed} />;
  }

  return (
    <div
      className={`bg-gray-50 ${
        isCollapsed ? "w-24" : "w-64"
      } h-screen p-6 border-r border-gray-200 shadow-md flex flex-col transition-all duration-300 relative`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="py-1 px-1 bg-white border-2 border-black-400 absolute -right-4 top-6 text-gray-600 mb-6 focus:outline-none"
      >
        {isCollapsed ? <FiChevronRight size={24} /> : <FiChevronLeft size={24} />}
      </button>

      {user ? (
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold text-gray-800">{user.username}</h2>
          <p className="text-sm text-gray-500">{user.position}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center">{error}</p>
      )}

      <nav className="flex-grow mt-4">
        <ul className="space-y-4">
          <SidebarItem
            href="/admin/dashboard"
            icon={<FiGrid size={20} />}
            text="Dashboard"
            isCollapsed={isCollapsed}
            active={pathname === "/admin/dashboard"}
          />
          <hr className="border-gray-300 my-4" />
          <SidebarItem
            href="/admin/records"
            icon={<FiFileText size={20} />}
            text="Records"
            isCollapsed={isCollapsed}
            active={pathname === "/admin/records"}
          />
          <SidebarItem
            href="/admin/student-profile"
            icon={<FiUser size={20} />}
            text="Student Profiles"
            isCollapsed={isCollapsed}
            active={pathname === "/admin/student-profile"}
          />
          <SidebarItem
            href="/admin/appointments"
            icon={<FiCalendar size={20} />}
            text="Appointments"
            isCollapsed={isCollapsed}
            active={pathname === "/admin/appointments"}
            badgeCount={unseenCount}
          />
          <hr className="border-gray-300 my-4" />
          <SidebarItem
            href="/admin/logs"
            icon={<FiBookOpen size={20} />}
            text="Logs"
            isCollapsed={isCollapsed}
            active={pathname === "/admin/logs"}
          />
          <SidebarItem
            href="/admin/archives"
            icon={<FiArchive size={20} />}
            text="Archives"
            isCollapsed={isCollapsed}
            active={pathname === "/admin/archives"}
          />
          <SidebarItem
            href="/admin/accounts"
            icon={<FiUser size={20} />}
            text="Accounts"
            isCollapsed={isCollapsed}
            active={pathname === "/admin/accounts"}
          />
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
            <FiLogOut size={20} className="mr-2" />
            {!isCollapsed && "Sign Out"}
          </button>
        ) : (
          <Link
            href="/admin/login"
            className={`w-full flex items-center py-3 text-gray-600 border-t border-gray-200 hover:bg-gray-100 transition-colors rounded-lg ${
              isCollapsed ? "justify-center" : "justify-start"
            }`}
          >
            <FiUser size={20} className="mr-2" />
            {!isCollapsed && "Sign In"}
          </Link>
        )}
      </div>
    </div>
  );
};

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  text: string;
  isCollapsed: boolean;
  active: boolean;
  badgeCount?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  href,
  icon,
  text,
  isCollapsed,
  active,
  badgeCount,
}) => {
  return (
    <li className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start"}`}>
      <Link
        href={href}
        className={`flex items-center py-1 px-3 transition-colors rounded-lg font-medium w-full ${
          active ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200 text-gray-700"
        }`}
      >
        {icon}
        {!isCollapsed && (
          <span className="ml-3 flex items-center space-x-2">
            <span>{text}</span>
            {badgeCount !== undefined && badgeCount > 0 && (
              <span className="inline-block bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {badgeCount}
              </span>
            )}
          </span>
        )}
      </Link>
    </li>
  );
};

export default Sidebar;
