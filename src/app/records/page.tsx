"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../hooks/useAuth"; // ✅ uses authToken from cookies
import FileList from "../components/FileList";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Header";

const Records = () => {
  const { user, authChecked, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authChecked && !user) {
      router.replace("/");
    }
  }, [authChecked, user, router]);

  if (!authChecked || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          <p className="mt-2 text-gray-700 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <div className="bg-gray-200 w-64 min-h-full">
          <Sidebar />
        </div>
        <div className="flex-1 p-6 bg-white">
          <FileList />
        </div>
      </div>
    </div>
  );
};

export default Records;
