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

interface SchoolTerm {
  id: number;
  school_year: string;
  semester: string;
  is_active: number;
}

const formatDate = (dateStr: string): string => format(new Date(dateStr), "MMMM d, yyyy");

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState<boolean>(true);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [termLabel, setTermLabel] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const { authChecked, loading: authLoading } = useAdminAuth();

  const [modalType, setModalType] = useState<"reject" | "reschedule" | null>(null);
  const [modalReason, setModalReason] = useState<string>("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const termRes = await axios.get<SchoolTerm[]>("/api/school-terms/all");
      const activeTerm = termRes.data.find((term) => term.is_active === 1);

      if (!activeTerm) {
        toast.error("No active school term found.");
        return;
      }

      setTermLabel(`A.Y. ${activeTerm.school_year} | ${activeTerm.semester}`);

      const response = await axios.get<Appointment[]>(
        `/api/admin/appointments?term_id=${activeTerm.id}&status=${statusFilter}`,
        { withCredentials: true }
      );

      setAppointments(response.data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      toast.error("Failed to load appointments.");
    } finally {
      setAppointmentsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (authChecked) {
      fetchAppointments();
      axios.post("/api/appointment/mark-all-seen").catch(console.error);
    }
  }, [authChecked, fetchAppointments]);

  const updateAppointmentStatus = async (
    id: number,
    adminApproval: "approved" | "rejected",
    reason?: string
  ) => {
    setLoadingId(id);
    try {
      await axios.put(
        `/api/admin/appointments?id=${id}`,
        { admin_approval: adminApproval, reason },
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
      closeModal();
    }
  };

  const markForReschedule = async (id: number, reason: string) => {
    setLoadingId(id);
    try {
      await axios.post("/api/appointment/reschedule", { id, reason });
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
      closeModal();
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

  const openModal = (id: number, type: "reject" | "reschedule") => {
    setSelectedId(id);
    setModalType(type);
    setModalReason("");
  };

  const closeModal = () => {
    setSelectedId(null);
    setModalType(null);
    setModalReason("");
  };

  const handleModalSubmit = () => {
    if (!selectedId || !modalReason.trim()) return;

    if (modalType === "reject") {
      updateAppointmentStatus(selectedId, "rejected", modalReason);
    } else if (modalType === "reschedule") {
      markForReschedule(selectedId, modalReason);
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
        <p className="mt-1 text-gray-600 text-sm sm:text-base">
          Approve, reject, reschedule, or complete appointments.
        </p>
        {termLabel && (
          <p className="mt-1 text-blue-700 font-medium text-sm">Active Term: {termLabel}</p>
        )}

        <div className="mt-4 mb-6">
          <label className="text-sm text-gray-700 mr-2">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="reschedule">Reschedule</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="bg-white shadow-md rounded-lg border border-gray-300 overflow-x-auto">
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
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500 text-sm">
                    No appointments found.
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b text-xs sm:text-sm">
                    <td className="p-2 sm:p-3 whitespace-nowrap">
                      {appointment.last_name}, {appointment.first_name}
                    </td>
                    <td className="p-2 sm:p-3 whitespace-nowrap">{formatDate(appointment.date)}</td>
                    <td className="p-2 sm:p-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-lg ${
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
                              onClick={() =>
                                updateAppointmentStatus(appointment.id, "approved")
                              }
                              disabled={loadingId === appointment.id}
                            >
                              Approve
                            </button>
                            <button
                              className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition disabled:opacity-50"
                              onClick={() => openModal(appointment.id, "reject")}
                              disabled={loadingId === appointment.id}
                            >
                              Reject
                            </button>
                            <button
                              className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-xs hover:bg-yellow-600 transition disabled:opacity-50"
                              onClick={() => openModal(appointment.id, "reschedule")}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal for Reject / Reschedule */}
        {modalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4 capitalize">
                Reason for {modalType}
              </h2>
              <textarea
                className="w-full p-2 border rounded mb-4 text-sm"
                rows={4}
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="Enter reason here..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalSubmit}
                  disabled={!modalReason.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
