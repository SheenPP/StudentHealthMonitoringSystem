"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/AdminSidebar";
import Header from "../../components/Header"; // ✅ Import Header here
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  UserGroupIcon,
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import useAdminAuth from "../../hooks/useAdminAuth";

export default function AdminDashboard() {
  const { authChecked, loading: authLoading } = useAdminAuth();
  const [appointmentStats, setAppointmentStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [userStats, setUserStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [userOnly, setUserOnly] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [studentOnly, setStudentOnly] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get("/api/admin/stats", {
          withCredentials: true,
        });

        setAppointmentStats(response.data.appointmentStats);
        setUserStats(response.data.userStats);
        setUserOnly(response.data.userOnly);
        setStudentOnly(response.data.studentOnly);
      } catch (err) {
        console.error("Error fetching statistics:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    if (authChecked) {
      fetchStats();
    }
  }, [authChecked]);

  const StatCard = ({ title, icon: Icon, stats, color }: any) => (
    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`w-6 h-6 ${color}`} />
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-gray-500 text-sm">Pending</p>
          <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">Approved</p>
          <p className="text-xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">Rejected</p>
          <p className="text-xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>
    </div>
  );

  const SkeletonCard = () => (
    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow animate-pulse">
      <div className="h-6 w-2/3 bg-gray-200 rounded mb-4" />
      <div className="grid grid-cols-3 gap-4 text-center">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
            <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );

  const showSkeleton = authLoading || loadingStats;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* ✅ Header at the top */}
      <Header />

      <div className="flex flex-1">
        <Sidebar />

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor system metrics and manage users effectively.</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Refresh Stats
            </button>
          </div>

          {/* Appointments */}
          <h2 className="text-lg font-semibold mt-10 mb-4 text-gray-700 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" /> Appointments Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {showSkeleton ? (
              <SkeletonCard />
            ) : (
              <StatCard title="Appointments" icon={CalendarIcon} stats={appointmentStats} color="text-blue-500" />
            )}
          </div>

          {/* Users */}
          <h2 className="text-lg font-semibold mt-10 mb-4 text-gray-700 flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5" /> Users Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {showSkeleton ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <StatCard title="Admin Users" icon={UserIcon} stats={userOnly} color="text-purple-500" />
                <StatCard title="Students" icon={AcademicCapIcon} stats={studentOnly} color="text-pink-500" />
                <StatCard title="Total Users" icon={UserGroupIcon} stats={userStats} color="text-indigo-500" />
              </>
            )}
          </div>

          {/* Management Tools */}
          <h2 className="text-lg font-semibold mt-10 mb-4 text-gray-700">Management Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow hover:shadow-md transition">
              <h3 className="text-xl font-semibold text-gray-800">Manage Users</h3>
              <p className="text-gray-600 mt-2">Approve, reject, and monitor user accounts.</p>
              <button
                className="mt-4 px-5 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition"
                onClick={() => router.push("/admin/accounts")}
              >
                View Users
              </button>
            </div>

            <div className="p-6 bg-white border border-gray-200 rounded-xl shadow hover:shadow-md transition">
              <h3 className="text-xl font-semibold text-gray-800">Manage Appointments</h3>
              <p className="text-gray-600 mt-2">View and manage appointment requests.</p>
              <button
                className="mt-4 px-5 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition"
                onClick={() => router.push("/admin/appointments")}
              >
                View Appointments
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
