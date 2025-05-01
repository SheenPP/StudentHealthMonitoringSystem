'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMenu, FiX, FiCalendar, FiLogOut, FiUser } from 'react-icons/fi';
import axios from 'axios';
import Image from 'next/image';

interface StudentUser {
  first_name: string;
  last_name: string;
  email?: string;
  photo_path?: string;
}

interface SchoolTerm {
  id: number;
  school_year: string;
  semester: string;
  is_active: number;
}

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<StudentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<SchoolTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/auth/getUsersUser', {
          withCredentials: true,
        });
        setUser(response.data);
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setUser(null);
        } else {
          console.error('Unexpected error fetching user:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchTerms = async () => {
      try {
        const res = await fetch('/api/school-terms/all');
        const data = await res.json();
        setTerms(data);
        const active = data.find((t: SchoolTerm) => t.is_active === 1);
        if (active) {
          setSelectedTermId(active.id);
          localStorage.setItem('term_id', active.id.toString());
        }
      } catch (err) {
        console.error('Failed to fetch school terms:', err);
      }
    };

    fetchUser();
    fetchTerms();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/studentlogout', {}, { withCredentials: true });
      setUser(null);
      router.push('/user/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleTermChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = parseInt(e.target.value);
    setSelectedTermId(newId);
    localStorage.setItem('term_id', newId.toString());
  };

  const avatarSrc =
    user?.photo_path && user.photo_path.trim() !== ''
      ? user.photo_path
      : '/user-placeholder.png';

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center gap-6">
            <Link href="/user/dashboard" className="text-xl font-semibold text-gray-800">
              BISU Clinic
            </Link>

            {/* School Term Dropdown */}
            <select
              value={selectedTermId ?? ''}
              onChange={handleTermChange}
              className="text-sm border px-2 py-1 rounded text-gray-700"
            >
              <option value="" disabled>Select Term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  A.Y. {term.school_year} | {term.semester}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-800 focus:outline-none"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            <Link
              href="/user/appointments"
              className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
            >
              <FiCalendar size={20} />
              <span>Appointments</span>
            </Link>
            <Link
              href="/user/profile"
              className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
            >
              <FiUser size={20} />
              <span>Profile</span>
            </Link>
          </div>

          {/* User Info - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <span className="text-gray-600">Loading...</span>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <Image
                  src={avatarSrc}
                  alt="User Avatar"
                  width={32}
                  height={32}
                  className="rounded-full border border-gray-300 object-cover"
                />
                <button
                  onClick={handleLogout}
                  className="flex items-center text-red-600 hover:text-red-800 font-medium"
                >
                  <FiLogOut size={20} className="mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/user/login" className="text-blue-600 font-medium">
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 w-full">
            <div className="flex flex-col space-y-4 p-4">
              <Link
                href="/user/appointments"
                className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
              >
                <FiCalendar size={20} />
                <span>Appointments</span>
              </Link>

              <Link
                href="/user/profile"
                className="text-gray-700 hover:text-blue-600 flex items-center gap-2"
              >
                <FiUser size={20} />
                <span>Profile</span>
              </Link>

              {/* Mobile Term Dropdown */}
              <div>
                <select
                  value={selectedTermId ?? ''}
                  onChange={handleTermChange}
                  className="text-sm border px-2 py-1 rounded w-full text-gray-700"
                >
                  <option value="" disabled>Select Term</option>
                  {terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      A.Y. {term.school_year} | {term.semester}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <span className="text-gray-600">Loading...</span>
              ) : user ? (
                <div className="flex flex-col space-y-3">
                  <span className="text-gray-800 font-medium">
                    {user.first_name} {user.last_name}
                  </span>
                  <Image
                    src={avatarSrc}
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="rounded-full border border-gray-300 object-cover"
                  />
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-red-600 hover:text-red-800 font-medium"
                  >
                    <FiLogOut size={20} className="mr-2" />
                    Logout
                  </button>
                </div>
              ) : (
                <Link href="/user/login" className="text-blue-600 font-medium">
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
