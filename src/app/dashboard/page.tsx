"use client";

import { useState, useEffect, useMemo } from "react";
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
import { FiX, FiUsers } from "react-icons/fi";
import PatientVisitCalendar from "../components/PatientVisitCalendar";

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

interface DashboardData {
  totalPatients: number;
  ongoingConsultations: number;
  pendingAppointments: number;
  totalDiagnoses: number;
  patientData: PatientData[];
}

const SkeletonStats = () => (
  <div className="bg-gray-200 p-6 rounded-lg shadow-md flex items-center animate-pulse">
    <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
    <div className="flex-1">
      <div className="h-6 w-3/4 bg-gray-300 rounded mb-2"></div>
      <div className="h-8 w-1/2 bg-gray-300 rounded"></div>
    </div>
  </div>
);

const SkeletonChart = () => (
  <div className="bg-gray-200 p-6 rounded-lg shadow-md animate-pulse h-96">
    <div className="h-full w-full bg-gray-300 rounded"></div>
  </div>
);

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalPatients: 0,
    ongoingConsultations: 0,
    pendingAppointments: 0,
    totalDiagnoses: 0,
    patientData: [],
  });
  const [visitDates, setVisitDates] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay
        const res = await fetch("/api/healthRecords");
        const data: DashboardData = await res.json();
        setDashboardData(data);

        const extractedDates = data.patientData.map((item) => ({
          title: "Patient Visit",
          date: item.date_of_visit,
          allDay: true,
        }));
        setVisitDates(extractedDates);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const filteredPatientData = useMemo(() => dashboardData.patientData, [dashboardData]);

  const chartData = useMemo(
    () => ({
      labels: filteredPatientData.map((item) => `${item.department} - ${item.course} - ${item.year}`),
      datasets: [
        {
          label: "Patients Treated",
          data: filteredPatientData.map((item) => item.patients_treated),
          backgroundColor: "rgba(99, 179, 237, 0.6)",
          borderColor: "rgba(26, 140, 216, 1)",
          borderWidth: 1,
        },
      ],
    }),
    [filteredPatientData]
  );

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900">Clinic Dashboard</h1>
            
            <button
              className="bg-gradient-to-r from-blue-500 to-teal-400 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition hover:scale-105"
              onClick={() => setShowModal(true)}
            >
              Add Patient
            </button>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <>
                <SkeletonStats />
                <SkeletonStats />
                <SkeletonStats />
                <SkeletonStats />
              </>
            ) : (
              <>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center hover:shadow-lg transition-transform transform hover:scale-105">
                  <FiUsers size={40} className="text-blue-600 mr-4" />
                  <div>
                    <h2 className="text-xl font-medium text-gray-800">Total Patients</h2>
                    <p className="text-4xl font-semibold text-blue-600">{dashboardData.totalPatients}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Charts & Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {isLoading ? <SkeletonChart /> : <PatientVisitCalendar visitDates={visitDates} />}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Patients Treated by Department, Course, and Year
              </h2>
              <div className="h-96">
                {isLoading ? <SkeletonChart /> : <Bar data={chartData} options={{ responsive: true }} />}
              </div>
            </div>
          </div>

          {/* Add Patient Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center transition-opacity z-50">
              <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl relative animate-fadeIn">
                <button
                  className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-full p-2 focus:outline-none"
                  onClick={() => setShowModal(false)}
                >
                  <FiX size={24} />
                </button>
                <HealthRecordForm onClose={() => setShowModal(false)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
