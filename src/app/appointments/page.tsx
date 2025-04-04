"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import useAuth from "../hooks/useAuth"; // ✅ Use user hook

interface Appointment {
  id: number;
  first_name: string;
  last_name: string;
  date: string;
  admin_approval: "approved" | "rejected" | "pending";
  status: "approved" | "rejected" | "pending";
}

const formatDate = (dateStr: string): string => format(new Date(dateStr), "MMMM d, yyyy");

const SkeletonTable = () => (
  <div className="mt-6 bg-white shadow-md rounded-lg p-6 border border-gray-300">
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-200">
          <th className="p-3 text-left">Name</th>
          <th className="p-3 text-left">Date</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 5 }).map((_, index) => (
          <tr key={index} className="border-b">
            <td className="p-3"><div className="h-5 w-32 bg-gray-300 rounded" /></td>
            <td className="p-3"><div className="h-5 w-24 bg-gray-300 rounded" /></td>
            <td className="p-3"><div className="h-6 w-20 bg-gray-300 rounded" /></td>
            <td className="p-3 space-x-2">
              <div className="h-8 w-24 bg-gray-300 rounded inline-block" />
              <div className="h-8 w-24 bg-gray-300 rounded inline-block" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function UserAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState<boolean>(true);

  const { user, authChecked, loading: authLoading } = useAuth(); // ✅ For students
  const router = useRouter();

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await axios.get<Appointment[]>("/api/appointments", {
        withCredentials: true,
      });
      setAppointments(response.data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setAppointmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked && !user) {
      router.push("/"); // Redirect to login if not logged in
    } else if (authChecked && user) {
      fetchAppointments();
    }
  }, [authChecked, user, fetchAppointments, router]);

  if (authLoading || !authChecked || appointmentsLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-semibold text-gray-800">My Appointments</h1>
          <p className="mt-2 text-gray-600">Loading appointment data...</p>
          <SkeletonTable />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-semibold text-gray-800">My Appointments</h1>
        <p className="mt-2 text-gray-600">View your scheduled consultations.</p>

        <div className="mt-6 bg-white shadow-md rounded-lg p-6 border border-gray-300 overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="border-b text-sm sm:text-base">
                  <td className="p-3">{appointment.last_name}, {appointment.first_name}</td>
                  <td className="p-3">{formatDate(appointment.date)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-sm font-medium rounded-lg ${
                      appointment.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : appointment.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="p-3 space-x-2 text-gray-400 italic">
                    No action available
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
