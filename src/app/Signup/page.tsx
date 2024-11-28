"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    position: '',
    username: '',
    email: '',
    password: ''
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }
    if (profilePicture) {
      data.append('profilePicture', profilePicture);
    }

    try {
      await axios.post('/api/auth/signup', data);
      setMessage('User created successfully');
    } catch (error) {
      setMessage('Error creating user');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-center text-2xl font-bold text-gray-800 mb-6">Sign Up</h2>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <input
            type="text"
            name="firstname"
            placeholder="First Name"
            onChange={handleChange}
            required
            className="mb-4 p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            name="lastname"
            placeholder="Last Name"
            onChange={handleChange}
            required
            className="mb-4 p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            name="position"
            placeholder="Position"
            onChange={handleChange}
            required
            className="mb-4 p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            onChange={handleChange}
            required
            className="mb-4 p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="mb-4 p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="mb-4 p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="file"
            name="profilePicture"
            onChange={handleFileChange}
            accept="image/*"
            className="mb-4"
          />
          <button type="submit" className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700" disabled={loading}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        {message && <p className="text-center text-gray-700 mt-4">{message}</p>}
      </div>
    </div>
  );
};

export default Signup;
