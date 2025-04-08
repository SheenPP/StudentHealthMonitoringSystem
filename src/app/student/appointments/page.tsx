"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios, { isAxiosError } from "axios";
import Navbar from "../../components/StudentNavbar";
import AppointmentForm from "../../components/AppointmentForm";
import { User, CalendarDays } from "lucide-react";
import { format } from "date-fns";

interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
}

interface Appointment {
  id: string;
  student_id: string;
  date: string;
  time: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

const formatDate = (dateStr: string): string =>
  format(new Date(dateStr), "MMMM d, yyyy");

const formatTime = (timeStr: string): string =>
  format(new Date(`1970-01-01T${timeStr}`), "h:mm a");

export default function AppointmentsPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const studentRes = await axios.get("/api/auth/getStudentUser", {
          withCredentials: true,
        });

        const userData = studentRes.data.user || studentRes.data;
        const studentId = userData?.student_id;

        if (!studentId) {
          router.push("/student/login");
          return;
        }

        setStudent({
          student_id: studentId,
          first_name: userData.first_name,
          last_name: userData.last_name,
        });

        const appointmentRes = await axios.get(
          `/api/appointment/route?studentId=${studentId}`,
          { withCredentials: true }
        );

        setAppointments(appointmentRes.data.appointments || []);
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.status === 401) {
          router.push("/student/login");
        } else {
          console.error("Error fetching data:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

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
      <div className="container mx-auto px-4 py-6 max-w-screen-lg dark:bg-black">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white flex items-center justify-center gap-2">
          <CalendarDays size={28} /> Manage Your Appointments
        </h1>

        {student ? (
          <>
            <div className="bg-white dark:bg-gray-800 shadow-md p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-6 text-center flex flex-col items-center">
              <User size={40} className="text-blue-500 mb-2" />
              <h2 className="text-lg font-semibold text-gray-700 dark:text-white">
                {student.first_name} {student.last_name}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Student ID: {student.student_id}
              </p>
            </div>

            <div className="flex flex-col md:flex-row md:space-x-6 gap-6">
              {/* Book Form */}
              <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 sm:p-6 border border-gray-300 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4 text-center">
                  Book an Appointment
                </h2>
                <AppointmentForm
                  studentId={student.student_id}
                  onBookSuccess={() => {
                    // refresh appointments list after booking
                    axios
                      .get(`/api/appointment/route?studentId=${student.student_id}`, {
                        withCredentials: true,
                      })
                      .then((res) =>
                        setAppointments(res.data.appointments || [])
                      )
                      .catch((err) => console.error("Error refreshing appointments:", err));
                  }}
                />
              </div>

              {/* Appointment List */}
              <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 sm:p-6 border border-gray-300 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4 text-center">
                  Your Appointments
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[500px] text-gray-800 dark:text-gray-100">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700 text-sm sm:text-base">
                        <th className="p-3 text-left">Date</th>
                        <th className="p-3 text-left">Time</th>
                        <th className="p-3 text-left">Reason</th>
                        <th className="p-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appointment) => (
                        <tr
                          key={appointment.id}
                          className="border-b border-gray-200 dark:border-gray-600 text-sm sm:text-base"
                        >
                          <td className="p-3">
                            {formatDate(appointment.date)}
                          </td>
                          <td className="p-3">
                            {formatTime(appointment.time)}
                          </td>
                          <td className="p-3">{appointment.reason}</td>
                          <td className="p-3">
                            <span
                              className={`px-3 py-1 text-sm font-medium rounded-lg border ${
                                appointment.status === "pending"
                                  ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-500"
                                  : appointment.status === "approved"
                                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-500"
                                  : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-500"
                              }`}
                            >
                              {appointment.status.charAt(0).toUpperCase() +
                                appointment.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-red-500 dark:text-red-400 text-center text-lg">
            ⚠️ Error: Student data is missing.
          </p>
        )}
      </div>
    </>
  );
}
