"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/AdminSidebar";
import axios from "axios";
import { format } from "date-fns";
import useAdminAuth from "../../hooks/useAdminAuth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Appointment {
  id: number;
  first_name: string;
  last_name: string;
  date: string;
  admin_approval: "approved" | "rejected" | "pending";
  status: "approved" | "rejected" | "pending" | "done" | "reschedule";
}

const formatDate = (dateStr: string): string => format(new Date(dateStr), "MMMM d, yyyy");

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState<boolean>(true);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const { authChecked, loading: authLoading } = useAdminAuth();

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await axios.get<Appointment[]>("/api/admin/appointments", {
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
    if (authChecked) {
      fetchAppointments();

      axios.post("/api/appointment/mark-all-seen").catch((err) => {
        console.error("Failed to mark appointments as seen:", err);
      });
    }
  }, [authChecked, fetchAppointments]);

  const updateAppointmentStatus = async (
    id: number,
    adminApproval: "approved" | "rejected"
  ) => {
    setLoadingId(id);
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

      toast.success(`Appointment ${adminApproval}.`);
    } catch (err) {
      console.error("Error updating appointment status:", err);
      toast.error("Failed to update appointment status.");
    } finally {
      setLoadingId(null);
    }
  };

  const markForReschedule = async (id: number) => {
    setLoadingId(id);
    try {
      await axios.post("/api/appointment/reschedule", { id });
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === id ? { ...appt, status: "reschedule" } : appt
        )
      );
      toast.success("Marked for reschedule. Email sent to student.");
    } catch (err) {
      console.error("Error marking for reschedule:", err);
      toast.error("Failed to mark for reschedule.");
    } finally {
      setLoadingId(null);
    }
  };

  const markAppointmentAsDone = async (id: number) => {
    setLoadingId(id);
    try {
      await axios.put("/api/appointment/mark-done", { id });
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === id ? { ...appt, status: "done" } : appt
        )
      );
      toast.success("Appointment marked as done.");
    } catch (err) {
      console.error("Error marking appointment as done:", err);
      toast.error("Failed to mark as done.");
    } finally {
      setLoadingId(null);
    }
  };

  if (authLoading || !authChecked || appointmentsLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-semibold text-gray-800">Manage Appointments</h1>
          <p className="mt-2 text-gray-600">Loading appointment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-8">
        <ToastContainer position="top-right" autoClose={3000} />
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Manage Appointments</h1>
        <p className="mt-2 text-gray-600 text-sm sm:text-base">
          Approve, reject, reschedule, or complete appointments.
        </p>

        <div className="mt-6 bg-white shadow-md rounded-lg border border-gray-300 overflow-x-auto">
          <div className="min-w-full overflow-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-200 text-xs sm:text-sm">
                  <th className="p-2 sm:p-3 text-left">Name</th>
                  <th className="p-2 sm:p-3 text-left">Date</th>
                  <th className="p-2 sm:p-3 text-left">Status</th>
                  <th className="p-2 sm:p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b text-xs sm:text-sm">
                    <td className="p-2 sm:p-3 whitespace-nowrap">
                      {appointment.last_name}, {appointment.first_name}
                    </td>
                    <td className="p-2 sm:p-3 whitespace-nowrap">{formatDate(appointment.date)}</td>
                    <td className="p-2 sm:p-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-1 text-xs sm:text-sm font-medium rounded-lg ${
                          appointment.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : appointment.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : appointment.status === "done"
                            ? "bg-blue-100 text-blue-700"
                            : appointment.status === "reschedule"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="p-2 sm:p-3 whitespace-nowrap">
                      <div className="flex flex-col sm:flex-row gap-2">
                        {appointment.status === "pending" && (
                          <>
                            <button
                              className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition disabled:opacity-50"
                              onClick={() => updateAppointmentStatus(appointment.id, "approved")}
                              disabled={loadingId === appointment.id}
                            >
                              Approve
                            </button>
                            <button
                              className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition disabled:opacity-50"
                              onClick={() => updateAppointmentStatus(appointment.id, "rejected")}
                              disabled={loadingId === appointment.id}
                            >
                              Reject
                            </button>
                            <button
                              className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-xs hover:bg-yellow-600 transition disabled:opacity-50"
                              onClick={() => markForReschedule(appointment.id)}
                              disabled={loadingId === appointment.id}
                            >
                              Reschedule
                            </button>
                          </>
                        )}
                        {appointment.status === "approved" && (
                          <button
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition disabled:opacity-50"
                            onClick={() => markAppointmentAsDone(appointment.id)}
                            disabled={loadingId === appointment.id}
                          >
                            Mark as Done
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
