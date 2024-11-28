import React from 'react';
import axios from 'axios';

const Logout: React.FC = () => {
  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      alert('Logout successful');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <button onClick={handleLogout}>Logout</button>
  );
};

export default Logout;
