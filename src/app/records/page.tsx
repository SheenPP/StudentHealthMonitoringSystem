"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FileList from "../components/FileList";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Header"; // ✅ Import Navbar

const Records = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
      setLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  if (loading || isAuthenticated === false) {
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
