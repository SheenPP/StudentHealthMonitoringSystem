"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import FileList from "../../components/FileList";
import Sidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Header";
import useAdminAuth from "../../hooks/useAdminAuth"; // ✅ use the hook

// ✅ Skeleton loader layout
const SkeletonLayout = () => (
  <div className="flex flex-col min-h-screen bg-gray-100">
    <div className="h-16 bg-gray-200" />
    <div className="flex flex-1">
      <div className="w-64 bg-gray-200" />
      <div className="flex-1 p-6">
        <div className="h-6 w-1/3 bg-gray-300 rounded mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Records = () => {
  const router = useRouter();
  const { authChecked, loading: authLoading } = useAdminAuth(); // ✅ using auth hook


  // ✅ Show skeleton layout during loading or unauthenticated state
  if (authLoading || authChecked === false) {
    return <SkeletonLayout />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* ✅ Navbar on top */}
      <Navbar />

      <div className="flex flex-1">
        {/* ✅ Sidebar on the left */}
        <div className="bg-gray-200 w-64 min-h-full">
          <Sidebar />
        </div>

        {/* ✅ Main content area */}
        <div className="flex-1 p-6 bg-white">
          <FileList />
        </div>
      </div>
    </div>
  );
};

export default Records;
