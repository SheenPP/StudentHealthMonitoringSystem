"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import useAuth from "../hooks/useAuth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Appointment {
  id: number;
  first_name: string;
  last_name: string;
  date: string;
  admin_approval: "approved" | "rejected" | "pending";
  status: "approved" | "rejected" | "pending" | "done";
}

const formatDate = (dateStr: string): string =>
  format(new Date(dateStr), "MMMM d, yyyy");

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
            <td className="p-3">
              <div className="h-5 w-32 bg-gray-300 rounded" />
            </td>
            <td className="p-3">
              <div className="h-5 w-24 bg-gray-300 rounded" />
            </td>
            <td className="p-3">
              <div className="h-6 w-20 bg-gray-300 rounded" />
            </td>
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

  const { user, authChecked, loading: authLoading } = useAuth();
  const router = useRouter();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

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
      router.push("/");
    } else if (authChecked && user) {
      fetchAppointments();
    }
  }, [authChecked, user, fetchAppointments, router]);

  const handleMarkAsDone = async () => {
    if (!selectedAppointmentId) return;

    try {
        await axios.put("/api/appointment/mark-done", { id: selectedAppointmentId });
        setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === selectedAppointmentId ? { ...appt, status: "done" } : appt
        )
      );
      toast.success("Appointment marked as done.");
    } catch (err) {
      console.error("Error marking appointment as done:", err);
      toast.error("Something went wrong. Try again.");
    } finally {
      setShowConfirmModal(false);
      setSelectedAppointmentId(null);
    }
  };

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
        <ToastContainer position="top-right" autoClose={3000} />
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
                  <td className="p-3">
                    {appointment.last_name}, {appointment.first_name}
                  </td>
                  <td className="p-3">{formatDate(appointment.date)}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-sm font-medium rounded-lg ${
                        appointment.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : appointment.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : appointment.status === "done"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    {appointment.status === "approved" ? (
                      <button
                        onClick={() => {
                          setSelectedAppointmentId(appointment.id);
                          setShowConfirmModal(true);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition"
                      >
                        Mark as Done
                      </button>
                    ) : (
                      <span className="text-gray-400 italic">No action available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ✅ Confirm Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm relative">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Mark Appointment as Done?
              </h3>
              <p className="text-gray-600 mb-4">This action cannot be undone.</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAsDone}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
