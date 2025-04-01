"use client";

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';

const SignupModal: React.FC<{ isOpen: boolean; onRequestClose: () => void }> = ({
  isOpen,
  onRequestClose,
}) => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    position: '',
    username: '',
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Modal.setAppElement(document.body); // Set the app element to the body tag
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/signup', formData);
      setMessage('✅ User created successfully');
    } catch (err) {
      console.error("Signup error:", err);
      setMessage('❌ Error creating user');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Sign Up"
      className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto mt-20 outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <h2 className="text-xl font-bold text-gray-800 mb-4">Sign Up</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="firstname"
          placeholder="First Name"
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          name="lastname"
          placeholder="Last Name"
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          name="position"
          placeholder="Position"
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-300 rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Sign Up
        </button>
      </form>

      {message && <p className="text-center mt-4 text-sm text-gray-700">{message}</p>}

      <button
        onClick={onRequestClose}
        className="mt-4 w-full border border-gray-300 py-2 rounded hover:bg-gray-100 transition text-sm"
      >
        Close
      </button>
    </Modal>
  );
};

export default SignupModal;
