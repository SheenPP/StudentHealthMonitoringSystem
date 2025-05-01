"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios, { isAxiosError } from "axios";
import Navbar from "../../components/StudentNavbar";
import AppointmentForm from "../../components/AppointmentForm";
import { User, CalendarDays } from "lucide-react";
import { format } from "date-fns";

interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  role: "student" | "teacher";
}

interface Appointment {
  id: string;
  user_id: string;
  date: string;
  time: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "reschedule" | "done";
}

const formatDate = (dateStr: string): string =>
  format(new Date(dateStr), "MMMM d, yyyy");

const formatTime = (timeStr: string): string =>
  format(new Date(`1970-01-01T${timeStr}`), "h:mm a");

export default function AppointmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const userRes = await axios.get("/api/auth/getUsersUser", {
          withCredentials: true,
        });

        const userData = userRes.data.user || userRes.data;
        const userId = userData?.user_id;

        if (!userId) {
          router.push("/user/login");
          return;
        }

        setUser({
          user_id: userId,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
        });

        const appointmentRes = await axios.get(
          `/api/appointment/route?userId=${userId}`,
          { withCredentials: true }
        );

        setAppointments(appointmentRes.data.appointments || []);
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.status === 401) {
          router.push("/user/login");
        } else {
          console.error("Error fetching data:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const visibleAppointments = useMemo(
    () => appointments.slice(0, visibleCount),
    [appointments, visibleCount]
  );

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-500";
      case "rejected":
        return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-500";
      case "reschedule":
        return "bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 border-pink-500";
      case "done":
        return "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-indigo-500";
      default:
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-500";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen px-4 dark:bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-3 text-gray-600 dark:text-gray-300 text-center">
          Loading appointments...
        </p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-screen-xl dark:bg-black">
        <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-gray-800 dark:text-white flex items-center justify-center gap-2">
          <CalendarDays size={28} /> Manage Your Appointments
        </h1>

        {user ? (
          <>
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 shadow-md p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-8 text-center flex flex-col items-center">
              <User size={42} className="text-blue-500 mb-2" />
              <h2 className="text-xl font-semibold text-gray-700 dark:text-white">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {user.role === "teacher" ? "Teacher" : "Student"} ID: {user.user_id}
              </p>
            </div>

            {/* Layout */}
            <div className="flex flex-col md:flex-row md:space-x-6 gap-6">
              {/* Book Form */}
              <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 shadow-md rounded-xl p-5 border border-gray-300 dark:border-gray-700">
                <AppointmentForm
                  userId={user.user_id}
                  onBookSuccess={() => {
                    axios
                      .get(`/api/appointment/route?userId=${user.user_id}`, {
                        withCredentials: true,
                      })
                      .then((res) =>
                        setAppointments(res.data.appointments || [])
                      )
                      .catch((err) =>
                        console.error("Error refreshing appointments:", err)
                      );
                  }}
                />
              </div>

              {/* Appointment List */}
              <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 shadow-md rounded-xl p-5 border border-gray-300 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-center text-gray-700 dark:text-white mb-4">
                  Your Appointments
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[500px] text-sm sm:text-base">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700 font-medium">
                        <th className="p-3 text-left">Date</th>
                        <th className="p-3 text-left">Time</th>
                        <th className="p-3 text-left">Reason</th>
                        <th className="p-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleAppointments.map((appointment) => (
                        <tr
                          key={appointment.id}
                          className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          <td className="p-3">{formatDate(appointment.date)}</td>
                          <td className="p-3">{formatTime(appointment.time)}</td>
                          <td className="p-3">{appointment.reason}</td>
                          <td className="p-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusClass(
                                appointment.status
                              )}`}
                            >
                              {appointment.status.charAt(0).toUpperCase() +
                                appointment.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {visibleAppointments.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-4 text-center text-gray-500 dark:text-gray-400"
                          >
                            No appointments found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Load More Button */}
                  {appointments.length > visibleCount && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => setVisibleCount((prev) => prev + 5)}
                        className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow transition"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-red-500 dark:text-red-400 text-center text-lg mt-6">
            ⚠️ Error: User data is missing.
          </p>
        )}
      </div>
    </>
  );
}
