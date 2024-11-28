import React from 'react';

interface UserProfileProps {
  user: {
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
    position: string;
    profile_picture: string; // Add profilePicture property
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
          <img
            src={user.profile_picture ? `${user.profile_picture}` : `https://i.pravatar.cc/150?u=${user.username}`}
            alt="User Avatar"
            className="w-10 h-10 rounded-full"
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
          <img
            src="https://i.pravatar.cc/150?u=guest"
            alt="Guest Avatar"
            className="w-10 h-10 rounded-full"
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
