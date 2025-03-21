import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleRedirect = (role: 'admin' | 'student') => {
    router.push(`/${role}-login`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/login', formData);
      setMessage('Login successful');
    } catch (error) {
      setMessage('Error logging in');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Login</h2>
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => handleRoleRedirect('admin')} 
          style={{ marginRight: '10px', padding: '10px', cursor: 'pointer' }}
        >
          Admin
        </button>
        <button 
          onClick={() => handleRoleRedirect('student')} 
          style={{ padding: '10px', cursor: 'pointer' }}
        >
          Student
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'inline-block' }}>
        <input 
          type="text" 
          name="username" 
          placeholder="Username" 
          value={formData.username} 
          onChange={handleChange} 
          style={{ display: 'block', marginBottom: '10px', padding: '8px' }} 
        />
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          onChange={handleChange} 
          style={{ display: 'block', marginBottom: '10px', padding: '8px' }} 
        />
        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>
          Login
        </button>
      </form>
      <p>{message}</p>
    </div>
  );
};

export default Login;
