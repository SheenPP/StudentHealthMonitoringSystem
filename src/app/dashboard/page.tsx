"use client";

import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import HealthRecordForm from "../components/HealthRecordForm";
import PatientVisitCalendar from "../components/PatientVisitCalendar";
import { FiX, FiUsers } from "react-icons/fi";
import { CalendarDays } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface PatientData {
  name: string;
  age: number;
  gender: string;
  department: string;
  course: string;
  year: string;
  date_of_visit: string;
  diagnosis: string;
  treatment: string;
  medications: string;
  patients_treated: number;
  notes: string;
}

interface AppointmentStats {
  pending: number;
  approved: number;
  rejected: number;
}

interface AppointmentRecord {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  date: string;
  time: string;
  reason: string;
  status: string;
}

interface DashboardData {
  totalPatients: number;
  patientData: PatientData[];
}

const Dashboard = () => {
  const { user, authChecked } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalPatients: 0,
    patientData: [],
  });
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [visitDates, setVisitDates] = useState<{ title: string; start: string; backgroundColor?: string; borderColor?: string; reason?: string }[]>([]);
  const [modalType, setModalType] = useState<"event" | "add-patient" | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<{ title: string; start: string; reason?: string } | null>(null);

  useEffect(() => {
    if (authChecked && !user) {
      router.push("/");
    }
  }, [authChecked, user, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await fetch("/api/admin/stats");
        const statsData = await statsRes.json();
        setAppointmentStats(statsData.appointmentStats);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    const fetchHealthRecords = async () => {
      try {
        const res = await fetch("/api/healthRecords");
        const data: DashboardData = await res.json();
        setDashboardData(data);

        const patientVisits = data.patientData.map((item) => ({
          title: "Patient Visit",
          start: item.date_of_visit,
          backgroundColor: "#3b82f6",
          borderColor: "#2563eb",
        }));

        setVisitDates((prev) => [...prev, ...patientVisits]);
      } catch (error) {
        console.error("Error fetching health records:", error);
      }
    };

    const fetchAppointments = async () => {
      try {
        const res = await fetch("/api/appointments");
        const data: AppointmentRecord[] = await res.json();

        const approvedAppointments = data.filter((appt) => appt.status?.toLowerCase() === "approved");

        const appointmentEvents = approvedAppointments.map((appt) => {
          const formattedDate = new Date(appt.date).toISOString().split("T")[0];
          return {
            title: `Appointment - ${appt.first_name} ${appt.last_name}`,
            start: formattedDate,
            reason: appt.reason,
            backgroundColor: "#22c55e",
            borderColor: "#16a34a",
          };
        });

        setVisitDates((prev) => [...prev, ...appointmentEvents]);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    const fetchAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchStats(), fetchHealthRecords(), fetchAppointments()]);
      setIsLoading(false);
    };

    fetchAll();
  }, []);

  const chartData = {
    labels: dashboardData.patientData.map((item) => `${item.department} - ${item.course} - ${item.year}`),
    datasets: [
      {
        label: "Patients Treated",
        data: dashboardData.patientData.map((item) => item.patients_treated),
        backgroundColor: "rgba(99, 179, 237, 0.6)",
        borderColor: "rgba(26, 140, 216, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <Header />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900">Clinic Dashboard</h1>
            <button
              className="bg-gradient-to-r from-blue-500 to-teal-400 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition hover:scale-105"
              onClick={() => {
                setModalType("add-patient");
                setSelectedEvent(null);
              }}
            >
              Add Patient
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <>
                <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
                  <div className="h-5 w-1/2 bg-gray-300 rounded mb-4" />
                  <div className="h-10 w-3/4 bg-gray-200 rounded" />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
                  <div className="h-5 w-1/2 bg-gray-300 rounded mb-4" />
                  <div className="h-10 w-3/4 bg-gray-200 rounded" />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
                  <div className="h-5 w-1/2 bg-gray-300 rounded mb-4" />
                  <div className="h-10 w-3/4 bg-gray-200 rounded" />
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                  <FiUsers size={40} className="text-blue-600 mr-4" />
                  <div>
                    <h2 className="text-xl font-medium text-gray-800">Total Patients</h2>
                    <p className="text-4xl font-semibold text-blue-600">{dashboardData.totalPatients}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-full mr-4">
                    <CalendarDays className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-gray-800">Pending Appointments</h2>
                    <p className="text-4xl font-semibold text-yellow-500">{appointmentStats.pending}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <CalendarDays className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium text-gray-800">Approved Appointments</h2>
                    <p className="text-4xl font-semibold text-green-600">{appointmentStats.approved}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Calendar & Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PatientVisitCalendar
              visitDates={visitDates}
              handleEventClick={(arg) => {
                setSelectedEvent({
                  title: arg.event.title,
                  start: arg.event.startStr,
                  reason: arg.event.extendedProps.reason,
                });
                setModalType("event");
              }}
            />
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Patients Treated by Department, Course, and Year
              </h2>
              <div className="h-96">
                <Bar data={chartData} options={{ responsive: true }} />
              </div>
            </div>
          </div>

          {/* Event Modal */}
          {modalType === "event" && selectedEvent && (
            <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fadeIn">
                <button
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setModalType(null);
                    setSelectedEvent(null);
                  }}
                >
                  <FiX size={20} />
                </button>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Event Details</h3>
                <p className="text-gray-600">
                  <span className="font-medium">Title:</span> {selectedEvent.title}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(selectedEvent.start).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {selectedEvent.reason && (
                  <p className="text-gray-600">
                    <span className="font-medium">Reason:</span> {selectedEvent.reason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Add Patient Modal */}
          {modalType === "add-patient" && (
            <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative animate-fadeIn">
                <button
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                  onClick={() => setModalType(null)}
                >
                  <FiX size={20} />
                </button>
                <HealthRecordForm
                  onClose={() => setModalType(null)}
                  onSuccess={() => {
                    toast.success("Patient added successfully!");
                    setModalType(null);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
