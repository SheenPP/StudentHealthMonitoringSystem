"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FileList from "../components/FileList";
import Sidebar from "../components/Sidebar";

const Records = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken"); // Adjust according to your authentication method

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
      router.replace("/"); // Ensures immediate redirect
    }
  }, [isAuthenticated, router]);

  if (loading || isAuthenticated === false) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          {/* Spinner */}
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          <p className="mt-2 text-gray-700 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="bg-gray-200 transition-all duration-300">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <FileList />
      </div>
    </div>
  );
};

export default Records;
