'use client';

import React from 'react';
import Image from 'next/image';

interface UserProfileProps {
  user: {
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
    position: string;
    profile_picture: string;
  } | null;
  isCollapsed: boolean;
  error: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, isCollapsed, error }) => {
  return (
    <div className={`pb-4 mb-4 border-b border-gray-200 ${isCollapsed ? 'flex justify-center' : ''}`}>
      {error ? (
        <div className="text-red-500">{error}</div>
      ) : user ? (
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          <Image
            src={user.profile_picture || `https://i.pravatar.cc/150?u=${user.username}`}
            alt="User Avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
          {!isCollapsed && (
            <div className="ml-2">
              <div className="font-semibold">{`${user.lastname}, ${user.firstname}`}</div>
              <div className="text-sm text-gray-500">{user.position}</div>
            </div>
          )}
        </div>
      ) : (
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          <Image
            src="https://i.pravatar.cc/150?u=guest"
            alt="Guest Avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
          {!isCollapsed && (
            <div className="ml-2">
              <div className="font-semibold">Guest</div>
              <div className="text-sm text-gray-500">Sign in to continue</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
