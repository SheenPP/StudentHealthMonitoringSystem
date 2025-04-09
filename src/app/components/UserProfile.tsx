'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface UserProfileProps {
  user: {
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
    position: string;
    profile_picture: string;
  };
  isCollapsed: boolean;
  error: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, isCollapsed, error }) => {
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <Link
      href="/profile"
      className={`pb-4 mb-4 border-b border-gray-200 flex items-center hover:bg-gray-100 p-2 rounded-lg transition-colors ${
        isCollapsed ? 'justify-center' : ''
      }`}
    >
      <Image
        src={user.profile_picture || `https://i.pravatar.cc/150?u=${user.username}`}
        alt="User Avatar"
        width={60}
        height={60}
        className="rounded-full"
      />
      {!isCollapsed && (
        <div className="ml-2">
          <div className="font-semibold">{`${user.lastname}, ${user.firstname}`}</div>
          <div className="text-sm text-gray-500">{user.position}</div>
        </div>
      )}
    </Link>
  );
};

export default UserProfile;
