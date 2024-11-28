import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';

const SignupModal: React.FC<{ isOpen: boolean; onRequestClose: () => void }> = ({ isOpen, onRequestClose }) => {
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
      setMessage('User created successfully');
    } catch (error) {
      setMessage('Error creating user');
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose} contentLabel="Sign Up" className="modal-class">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="firstname" placeholder="First Name" onChange={handleChange} required />
        <input type="text" name="lastname" placeholder="Last Name" onChange={handleChange} required />
        <input type="text" name="position" placeholder="Position" onChange={handleChange} required />
        <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit">Sign Up</button>
      </form>
      <p>{message}</p>
      <button onClick={onRequestClose}>Close</button>
    </Modal>
  );
};

export default SignupModal;
