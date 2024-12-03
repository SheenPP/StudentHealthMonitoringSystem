"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiGrid, FiFileText, FiPlus, FiArchive, FiBookOpen, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import axios from 'axios';
import UserProfile from './UserProfile';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<{ username: string; email?: string; role: string; position: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch user data when the component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/auth/getUser');
        setUser(response.data.user);
      } catch (err) {
        setError('Failed to fetch user information. Please log in.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Handle the sign-out functionality
  const handleSignOut = async () => {
    try {
      // Make a request to the logout API to clear the session cookie
      await axios.post('/api/auth/logout');

      // Redirect the user to the homepage after logging out
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className={`bg-gray-50 ${isCollapsed ? 'w-24' : 'w-64'} h-auto p-6 border-r border-gray-200 shadow-md flex flex-col transition-all duration-300 relative`}>
      {/* Toggle Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="py-1 px-1 bg-white border-2 border-black-400 absolute -right-4 top-6 text-gray-600 mb-6 focus:outline-none"
      >
        {isCollapsed ? <FiChevronRight size={24} /> : <FiChevronLeft size={24} />}
      </button>

      {/* User Profile */}
      {user && <UserProfile user={user} isCollapsed={isCollapsed} error={error} />}

      {/* Navigation */}
      <nav className="flex-grow mt-4">
        <ul className="space-y-4">
          <li className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
            <Link
              href="/dashboard"
              className={`flex items-center py-1 px-1 transition-colors rounded-lg font-medium ${pathname === '/dashboard' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-700'}`}
            >
              <FiGrid size={20} />
              {!isCollapsed && <span className="ml-3">Dashboard</span>}
            </Link>
          </li>
          <li className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
            <Link
              href="/records"
              className={`flex items-center py-1 px-1 transition-colors rounded-lg font-medium ${pathname === '/records' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-700'}`}
            >
              <FiFileText size={20} />
              {!isCollapsed && <span className="ml-3">Records</span>}
            </Link>
          </li>
          <hr className="border-gray-300 my-4" />
          <li className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
            <Link
              href="/logs"
              className={`flex items-center py-1 px-1 transition-colors rounded-lg font-medium ${pathname === '/logs' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-700'}`}
            >
              <FiBookOpen size={20} />
              {!isCollapsed && <span className="ml-3">Logs</span>}
            </Link>
          </li>
          <li className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
            <Link
              href="/archives"
              className={`flex items-center py-1 px-1 transition-colors rounded-lg font-medium ${pathname === '/archives' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-700'}`}
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
            className={`w-full flex items-center py-3 text-gray-600 border-t border-gray-200 hover:bg-gray-100 transition-colors rounded-lg ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            {!isCollapsed ? 'Sign Out' : <FiChevronRight />}
          </button>
        ) : (
          <Link
            href="/"
            className={`w-full flex items-center py-3 text-gray-600 border-t border-gray-200 hover:bg-gray-100 transition-colors rounded-lg ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            {!isCollapsed ? 'Sign In' : <FiChevronRight />}
          </Link>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
