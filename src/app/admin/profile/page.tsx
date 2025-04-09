'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Sidebar from '../../components/AdminSidebar';
import Header from '../../components/Header';

const getPasswordStrength = (password: string): string => {
  if (password.length < 8) return 'Weak';
  if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[@$!%*?&._-]/.test(password)) {
    return 'Strong';
  }
  return 'Medium';
};

const isPasswordValid = (password: string): boolean => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/;
  return regex.test(password);
};

const AdminProfilePage = () => {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    admin_id: 0,
    username: '',
    email: '',
    position: '',
    profile_picture: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await fetch('/api/auth/getAdminUser', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error();
        setAdmin(data.user);
        setFormData({
          admin_id: data.user.admin_id,
          username: data.user.username,
          email: data.user.email,
          position: data.user.position,
          profile_picture: data.user.profilePicture || '',
        });
        setProfilePicture(data.user.profilePicture || null); // use null instead of ""
      } catch {
        toast.error('Failed to load admin info');
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setProfilePicture(URL.createObjectURL(selected)); // Preview the selected file
    }
  };

  const handleSubmit = async () => {
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password && !isPasswordValid(password)) {
      toast.error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }

    try {
      let uploadedUrl = formData.profile_picture;

      if (file && admin) {
        const form = new FormData();
        form.append('file', file);
        form.append('admin_id', admin.id); // ✅ now passed to API
        form.append('username', admin.username);
        form.append('currentUrl', admin.profile_picture || '');

        const res = await fetch('/api/admin/profile-upload', {
          method: 'POST',
          body: form,
        });

        const data = await res.json();
        if (!res.ok) throw new Error();
        uploadedUrl = data.url;
      }

      const res = await fetch('/api/admin/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: admin?.id,
          ...formData,
          profile_picture: uploadedUrl,
          password: password || undefined,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 2000);
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : '';
  const showSkeleton = loading;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="p-6 w-full">
          <h1 className="text-3xl font-bold text-center mb-6">Admin Profile</h1>

          <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-md">
            {showSkeleton ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded" />
                ))}
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  {/* Display existing profile picture if available or preview */}
                  {profilePicture || formData.profile_picture ? (
                    <img
                      src={profilePicture || formData.profile_picture}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 border flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username"
                    className="w-full border border-gray-300 p-2 rounded"
                  />
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full border border-gray-300 p-2 rounded"
                    type="email"
                  />
                  <input
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="Position"
                    className="w-full border border-gray-300 p-2 rounded"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full"
                  />

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="New Password (optional)"
                      className="w-full border border-gray-300 p-2 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 text-gray-600"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>

                    {password && (
                      <p
                        className={`mt-1 text-sm font-medium ${
                          passwordStrength === 'Weak'
                            ? 'text-red-500'
                            : passwordStrength === 'Medium'
                            ? 'text-yellow-500'
                            : 'text-green-600'
                        }`}
                      >
                        Strength: {passwordStrength}
                      </p>
                    )}
                  </div>

                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full border border-gray-300 p-2 rounded"
                  />

                  <button
                    onClick={handleSubmit}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                  >
                    Save Changes
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminProfilePage;
