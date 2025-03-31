"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../../components/AdminSidebar";
import { useRouter } from "next/navigation";
import axios from "axios";
import { format } from "date-fns"; // ✅ import for formatting

// Define an interface for appointments
interface Appointment {
  id: number;
  first_name: string;
  last_name: string;
  date: string;
  admin_approval: "approved" | "rejected" | "pending";
  status: "approved" | "rejected" | "pending";
}

// Format date as "April 1, 2025"
const formatDate = (dateStr: string): string =>
  format(new Date(dateStr), "MMMM d, yyyy");

// Skeleton Loader for Table
const SkeletonTable = () => {
  return (
    <div className="mt-6 bg-white shadow-md rounded-lg p-6 border border-gray-300 animate-pulse">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Admin Approval</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index} className="border-b">
              <td className="p-3">
                <div className="h-5 w-32 bg-gray-300 rounded"></div>
              </td>
              <td className="p-3">
                <div className="h-5 w-24 bg-gray-300 rounded"></div>
              </td>
              <td className="p-3">
                <div className="h-6 w-20 bg-gray-300 rounded"></div>
              </td>
              <td className="p-3">
                <div className="h-6 w-20 bg-gray-300 rounded"></div>
              </td>
              <td className="p-3 space-x-2">
                <div className="h-8 w-24 bg-gray-300 rounded inline-block"></div>
                <div className="h-8 w-24 bg-gray-300 rounded inline-block"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axios.get<Appointment[]>("/api/admin/appointments", {
          withCredentials: true,
        });
        setAppointments(response.data);
      } catch (err) {
        console.error("Error fetching appointments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const updateAppointmentStatus = async (id: number, adminApproval: "approved" | "rejected") => {
    try {
      await axios.put(
        `/api/admin/appointments?id=${id}`,
        { admin_approval: adminApproval },
        { withCredentials: true }
      );

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === id
            ? { ...appointment, admin_approval: adminApproval, status: adminApproval }
            : appointment
        )
      );
    } catch (err) {
      console.error("Error updating appointment status:", err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-semibold text-gray-800">Manage Appointments</h1>
        <p className="mt-2 text-gray-600">Approve or reject appointment requests.</p>

        {loading ? (
          <SkeletonTable />
        ) : (
          <div className="mt-6 bg-white shadow-md rounded-lg p-6 border border-gray-300 overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Admin Approval</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b text-sm sm:text-base">
                    <td className="p-3">
                      {appointment.last_name}, {appointment.first_name}
                    </td>
                    <td className="p-3">{formatDate(appointment.date)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-sm font-medium rounded-lg ${
                          appointment.admin_approval === "approved"
                            ? "bg-green-100 text-green-700"
                            : appointment.admin_approval === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {appointment.admin_approval}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-sm font-medium rounded-lg ${
                          appointment.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : appointment.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="p-3 space-x-2">
                      {appointment.status === "pending" && (
                        <>
                          <button
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                            onClick={() => updateAppointmentStatus(appointment.id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                            onClick={() => updateAppointmentStatus(appointment.id, "rejected")}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
