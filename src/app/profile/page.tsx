'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';

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

const ProfilePage = () => {
  const { user, authChecked, loading: authLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    position: '',
  });

  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authChecked && !user) {
      router.push('/');
    } else if (authChecked && user) {
      setFormData({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        username: user.username || '',
        email: user.email || '',
        position: user.position || '',
      });
      setProfilePicture(user.profilePicture || null);
    }
  }, [authChecked, user, router]);

  useEffect(() => {
    return () => {
      if (profilePicture?.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicture);
      }
    };
  }, [profilePicture]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setProfilePicture(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async () => {
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password && !isPasswordValid(password)) {
      toast.error(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
      );
      return;
    }

    setIsSaving(true);

    try {
      let uploadedUrl = profilePicture;

      if (file) {
        const form = new FormData();
        form.append('file', file);
        form.append('firstname', formData.firstname.trim());
        form.append('lastname', formData.lastname.trim());
        form.append('currentUrl', user?.profilePicture || '');

        const uploadRes = await fetch('/api/profile-upload', {
          method: 'POST',
          body: form,
        });

        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        uploadedUrl = uploadData.url;
        toast.success('Image uploaded!');
      }

      const sanitizedFormData = {
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        position: formData.position.trim(),
      };

      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sanitizedFormData,
          profile_picture: uploadedUrl,
          password: password || undefined,
          id: user?.id,
        }),
      });

      if (!res.ok) throw new Error();
      toast.success('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
      window.location.reload();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : '';
  const showSkeleton = authLoading || !authChecked;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="p-6 w-full">
          <h1 className="text-3xl font-bold text-center mb-6">Edit Profile</h1>

          <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-md">
            {showSkeleton ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded" />
                ))}
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
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
                    type="text"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="w-full border border-gray-300 p-2 rounded"
                  />
                  <input
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="w-full border border-gray-300 p-2 rounded"
                  />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username"
                    className="w-full border border-gray-300 p-2 rounded"
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full border border-gray-300 p-2 rounded"
                  />
                  <input
                    type="text"
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

                    {password && !isPasswordValid(password) && (
                      <p className="text-sm text-red-500 mt-1">
                        Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      className="w-full border border-gray-300 p-2 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 text-gray-600"
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className={`w-full py-2 px-4 rounded transition ${
                      isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
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

export default ProfilePage;
