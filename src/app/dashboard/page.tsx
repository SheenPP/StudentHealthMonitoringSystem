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
import DepartmentSelect from "../options/DepartmentSelect";
import CourseSelect from "../options/CourseSelect";
import YearSelect from "../options/YearSelect";
import { useOptions } from "../options/useOptions";
import { FiX, FiUsers } from "react-icons/fi";
import PatientVisitCalendar from "../components/PatientVisitCalendar";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Define types for patient data
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

// Define types for dashboard data
interface DashboardData {
  totalPatients: number;
  ongoingConsultations: number;
  pendingAppointments: number;
  totalDiagnoses: number;
  patientData: PatientData[];
}

const Dashboard = () => {
  const [userLoaded, setUserLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalPatients: 0,
    ongoingConsultations: 0,
    pendingAppointments: 0,
    totalDiagnoses: 0,
    patientData: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [visitDates, setVisitDates] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PatientData | null>(null);

  const { departments, coursesByDepartment, years } = useOptions();

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/healthRecords");
      const data: DashboardData = await res.json();
      setDashboardData(data);

      const extractedDates = data.patientData.map((item) => ({
        title: "Patient Visit",
        date: item.date_of_visit,
        allDay: true,
        extendedProps: { patientInfo: item },
      }));
      setVisitDates(extractedDates);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setUserLoaded(true);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (!userLoaded) {
      setIsLoading(true);
      fetchUserData();
      fetchDashboardData();
    }
  }, [userLoaded]);

  useEffect(() => {
    if (showModal || showEventModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [showModal, showEventModal]);

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event.extendedProps.patientInfo);
    setShowEventModal(true);
  };

  const filteredPatientData = useMemo(() => {
    return dashboardData.patientData.filter((item) => {
      return (
        (selectedDepartment === "All" || item.department === selectedDepartment) &&
        (selectedCourse === "All" || item.course === selectedCourse) &&
        (selectedYear === "All" || item.year === selectedYear)
      );
    });
  }, [dashboardData, selectedDepartment, selectedCourse, selectedYear]);

  const uniqueLabels = useMemo(() => {
    const seen = new Set();
    return filteredPatientData
      .map((item) => {
        const label = `${item.department} - ${item.course} - ${item.year}`;
        if (seen.has(label)) {
          return null;
        } else {
          seen.add(label);
          return label;
        }
      })
      .filter(Boolean);
  }, [filteredPatientData]);

  const chartData = useMemo(
    () => ({
      labels: uniqueLabels,
      datasets: [
        {
          label: "Patients Treated",
          data: uniqueLabels.map((label) => {
            const items = filteredPatientData.filter(
              (item) => `${item.department} - ${item.course} - ${item.year}` === label
            );
            return items.reduce((sum, item) => sum + item.patients_treated, 0);
          }),
          backgroundColor: "rgba(153, 204, 255, 0.6)",
          borderColor: "rgba(51, 102, 153, 1)",
          borderWidth: 1,
        },
      ],
    }),
    [filteredPatientData, uniqueLabels]
  );

  if (isLoading || !userLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      <Header />
      <div className="flex h-auto">
        <Sidebar />
        <div className="flex-1 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-gray-900">Clinic Dashboard</h1>
              <button
                className="mt-4 bg-gradient-to-r from-blue-600 to-teal-400 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                onClick={() => setShowModal(true)}
              >
                Add Patient
              </button>
            </div>
            <div className="ml-auto">
              <div className="bg-white p-6 rounded-lg shadow-md flex items-center transition-transform hover:scale-105 transform">
                <FiUsers size={40} className="text-blue-600 mr-4" />
                <div className="text-center">
                  <h2 className="text-xl font-medium text-gray-800">Total Patients</h2>
                  <p className="text-4xl font-semibold text-blue-600">
                    {dashboardData.totalPatients}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl z-60 w-auto h-5/6 overflow-y-scroll relative">
                <button
                  className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  onClick={() => setShowModal(false)}
                >
                  <FiX size={24} />
                </button>
                <HealthRecordForm onClose={() => setShowModal(false)} />
              </div>
            </div>
          )}

          {showEventModal && selectedEvent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl z-60 w-auto max-w-lg h-auto">
                <button
                  className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  onClick={() => setShowEventModal(false)}
                >
                  <FiX size={24} />
                </button>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Patient Visit Details</h2>
                <p><strong>Patient Name:</strong> {selectedEvent.name}</p>
                <p><strong>Age:</strong> {selectedEvent.age}</p>
                <p><strong>Gender:</strong> {selectedEvent.gender}</p>
                <p><strong>Department:</strong> {selectedEvent.department}</p>
                <p><strong>Course:</strong> {selectedEvent.course}</p>
                <p><strong>Year:</strong> {selectedEvent.year}</p>
                <p><strong>Date of Visit:</strong> {selectedEvent.date_of_visit}</p>
                <p><strong>Diagnosis:</strong> {selectedEvent.diagnosis}</p>
                <p><strong>Treatment:</strong> {selectedEvent.treatment}</p>
                <p><strong>Medications:</strong> {selectedEvent.medications}</p>
                <p><strong>Patients Treated:</strong> {selectedEvent.patients_treated}</p>
                <p><strong>Notes:</strong> {selectedEvent.notes}</p>
              </div>
            </div>
          )}

          <div className="flex space-x-4 mt-6">
            <div className="w-72">
              <DepartmentSelect
                department={selectedDepartment}
                setDepartment={setSelectedDepartment}
                departments={["All", ...departments]}
              />
            </div>

            <div className="w-72">
              <CourseSelect
                department={selectedDepartment}
                course={selectedCourse}
                setCourse={setSelectedCourse}
                coursesByDepartment={{ "All": [], ...coursesByDepartment }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <PatientVisitCalendar visitDates={visitDates} handleEventClick={handleEventClick} />

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Patients Treated by Department, Course, and Year
              </h2>
              <div className="h-96">
                {filteredPatientData.length > 0 && (
                  <Bar
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0,
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          position: "top",
                          display: false,
                        },
                        title: {
                          display: false,
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
