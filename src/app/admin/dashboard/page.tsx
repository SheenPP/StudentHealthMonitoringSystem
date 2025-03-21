"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/AdminSidebar";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function AdminDashboard() {
  const [appointmentStats, setAppointmentStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [userStats, setUserStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("/api/auth/getAdminUser", {
          withCredentials: true,
        });

        setUser(response.data.user);
      } catch (err) {
        router.push("/admin/login"); // Redirect if not authenticated
      }
    };

    const fetchStats = async () => {
      try {
        const response = await axios.get("/api/admin/stats", {
          withCredentials: true, // Ensures authentication cookies are sent
        });
        
        setAppointmentStats(response.data.appointmentStats);
        setUserStats(response.data.userStats);
      } catch (err) {
        console.error("Error fetching statistics:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    fetchStats();
  }, [router]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-gray-700">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-semibold text-gray-800">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Manage appointments and users efficiently.</p>

        {/* Appointment & User Statistics */}
        <div className="grid grid-cols-2 gap-6 mt-8">
          {/* Appointments Section */}
          <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">Appointments Overview</h2>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-yellow-100 rounded-lg text-center">
                <h3 className="text-md font-medium text-gray-800">Pending</h3>
                <p className="text-2xl font-bold text-yellow-700">{appointmentStats.pending}</p>
              </div>
              <div className="p-4 bg-green-100 rounded-lg text-center">
                <h3 className="text-md font-medium text-gray-800">Approved</h3>
                <p className="text-2xl font-bold text-green-700">{appointmentStats.approved}</p>
              </div>
              <div className="p-4 bg-red-100 rounded-lg text-center">
                <h3 className="text-md font-medium text-gray-800">Rejected</h3>
                <p className="text-2xl font-bold text-red-700">{appointmentStats.rejected}</p>
              </div>
            </div>
          </div>

          {/* Users Section */}
          <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">Users Overview</h2>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-yellow-100 rounded-lg text-center">
                <h3 className="text-md font-medium text-gray-800">Pending</h3>
                <p className="text-2xl font-bold text-yellow-700">{userStats.pending}</p>
              </div>
              <div className="p-4 bg-green-100 rounded-lg text-center">
                <h3 className="text-md font-medium text-gray-800">Approved</h3>
                <p className="text-2xl font-bold text-green-700">{userStats.approved}</p>
              </div>
              <div className="p-4 bg-red-100 rounded-lg text-center">
                <h3 className="text-md font-medium text-gray-800">Rejected</h3>
                <p className="text-2xl font-bold text-red-700">{userStats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-2 gap-6 mt-8">
          <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">Manage Users</h2>
            <p className="text-gray-600 mt-2">Approve, reject, and monitor user accounts.</p>
            <button
              className="mt-4 px-5 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition"
              onClick={() => router.push("/admin/accounts")}
            >
              View Users
            </button>
          </div>

          <div className="p-6 bg-white border border-gray-300 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">Manage Appointments</h2>
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
  );
}
