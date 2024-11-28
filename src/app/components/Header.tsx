"use client";
import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Ensures we know the component has mounted on the client side
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isClient || currentTime === null) {
    return null; // Avoid rendering until client-side or currentTime is set
  }

  return (
    <header className="w-full flex justify-between items-center p-6 bg-white shadow-md border-b border-gray-200" suppressHydrationWarning>
      <h1 className="text-2xl font-semibold text-gray-800">BISU Clinic</h1>
      
      <div className="text-gray-600">
        {currentTime?.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}{' '}
        {currentTime?.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })}
      </div>
    </header>
  );
};

export default Header;
