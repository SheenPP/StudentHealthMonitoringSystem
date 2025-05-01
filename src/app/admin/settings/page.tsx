"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/AdminSidebar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SchoolTermSettings from "../../components/settings/SchoolTermSettings";
import ConsultationSettings from "../../components/settings/ConsultationSettings";
import useAdminAuth from "../../hooks/useAdminAuth";

const Header = dynamic(() => import("../../components/Header"), { ssr: false });

const SkeletonCard = () => (
  <div className="w-full h-64 bg-white border border-gray-300 shadow rounded-xl animate-pulse" />
);

export default function AdminSettingsPage() {
  const router = useRouter();
  const { authChecked, loading: authLoading } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !authChecked) {
      router.replace("/admin/login");
    }
  }, [authLoading, authChecked, router]);

  useEffect(() => {
    if (authChecked) {
      const timeout = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(timeout);
    }
  }, [authChecked]);

  if (authLoading || !authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 p-8 overflow-y-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Settings</h1>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-1/2">
              {isLoading ? <SkeletonCard /> : <SchoolTermSettings />}
            </div>
            <div className="w-full lg:w-1/2">
              {isLoading ? <SkeletonCard /> : <ConsultationSettings />}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
