'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AdminProfileProps {
  admin: {
    username: string;
    email?: string;
    position: string;
    profilePicture?: string | null;
  };
  isCollapsed: boolean;
  error: string;
}

const AdminProfileCard: React.FC<AdminProfileProps> = ({ admin, isCollapsed, error }) => {
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <Link
      href="/admin/profile"
      className={`pb-4 mb-4 border-b border-gray-200 flex items-center hover:bg-gray-100 p-2 rounded-lg transition-colors ${
        isCollapsed ? 'justify-center' : ''
      }`}
    >
      <Image
        src={admin.profilePicture || `https://i.pravatar.cc/150?u=${admin.username}`}
        alt="Admin Avatar"
        width={50}
        height={50}
        className="rounded-full object-cover"
      />
      {!isCollapsed && (
        <div className="ml-2">
          <div className="font-semibold">{admin.username}</div>
          <div className="text-sm text-gray-500">{admin.position}</div>
        </div>
      )}
    </Link>
  );
};

export default AdminProfileCard;
