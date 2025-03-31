"use client";
import React, { useEffect, useState } from "react";
import { FiEdit, FiX } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ConsultationCards from "../components/ConsultationCards";
import ClinicHistory from "../components/ClinicHistory";
import EmergencyContacts from "../components/EmergencyContacts";
import Image from "next/image";
import AddRecord from "../components/addrecord";
import EditRecord from "../components/editRecord";
import { Trie } from "../components/utils/trie";

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  present_address: string;
  home_address: string;
  date_of_birth: string;
  email: string;
  phone_number: string;
  medical_history: string;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  course: string;
  year: string;
  photo_path: string;
}

const Record: React.FC = () => {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTabs, setActiveTabs] = useState<string[]>([]);
  const [studentDetails, setStudentDetails] = useState<Record<string, Student | null>>({});
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recordAdded, setRecordAdded] = useState(false);
  const [trie, setTrie] = useState<Trie | null>(null);

  const fetchStudentData = async () => {
    try {
      const response = await fetch("/api/students");
      const data = await response.json();
      setStudents(data);

      const newTrie = new Trie();
      data.forEach((student: Student) => {
        const fullName1 = `${student.first_name} ${student.last_name}`;
        const fullName2 = `${student.last_name} ${student.first_name}`;
        const id = student.student_id;

        newTrie.insert(fullName1, student);
        newTrie.insert(fullName2, student);
        newTrie.insert(id, student);
      });

      setTrie(newTrie);
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase().trim();
    setSearchTerm(term);

    if (trie && term) {
      const results = trie.search(term);
      setFilteredStudents(results);
    } else {
      setFilteredStudents([]);
    }
  };

  const handleSelectStudent = (student: Student) => {
    const key = student.last_name;
    setStudentDetails((prevDetails) => {
      if (!prevDetails[key]) {
        prevDetails[key] = student;
      }
      return { ...prevDetails };
    });

    if (!activeTabs.includes(key)) {
      setActiveTabs((prevTabs) => [...prevTabs, key]);
    }

    setActiveTab(key);
    setFilteredStudents([]);
    setSearchTerm("");
  };

  const handleCloseDetails = (key: string) => {
    setActiveTabs((prevTabs) => prevTabs.filter((tab) => tab !== key));
    setStudentDetails((prev) => {
      const newDetails = { ...prev };
      delete newDetails[key];
      return newDetails;
    });

    if (activeTab === key) {
      setActiveTab(activeTabs[0] || null);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
    setRecordAdded(false);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    if (recordAdded) toast.success("Record successfully added!");
  };

  const openEditModal = () => setIsEditModalOpen(true);

  const closeEditModal = (updatedStudent?: Student) => {
    setIsEditModalOpen(false);

    if (updatedStudent) {
      setStudents((prevStudents) =>
        prevStudents?.map((student) =>
          student.student_id === updatedStudent.student_id ? updatedStudent : student
        ) || []
      );

      setStudentDetails((prevDetails) => ({
        ...prevDetails,
        [updatedStudent.last_name]: updatedStudent,
      }));
    }

    setTimeout(fetchStudentData, 100);
  };

  const handleAddSuccess = () => {
    setRecordAdded(true);
    setIsAddModalOpen(false);
    toast.success("Record successfully added!");
    fetchStudentData();
  };

  const handleAddFailure = (errorType: string) => {
    if (errorType === "duplicate") {
      toast.error("Duplicate entry. This record already exists.");
    } else {
      toast.error("Failed to add record. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      <Header />
      <ToastContainer />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-4 flex items-center space-x-4">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by name or ID..."
              className="p-3 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring focus:ring-blue-500 transition duration-200 w-full sm:w-3/4"
            />
            <button
              onClick={openAddModal}
              className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition duration-200"
            >
              Add Record
            </button>
          </div>

          {isAddModalOpen && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
              <div className="p-6 rounded-lg shadow-lg max-w-5xl h-5/6 overflow-hidden overflow-y-scroll bg-white">
                <button
                  onClick={() => closeAddModal()}
                  className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
                <AddRecord
                  onAddSuccess={handleAddSuccess}
                  onAddFailure={handleAddFailure}
                />
              </div>
            </div>
          )}

          {isEditModalOpen && activeTab && studentDetails[activeTab] && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
              <div className="p-6 rounded-lg shadow-lg max-w-5xl w-full h-5/6 overflow-hidden overflow-y-scroll bg-white">
                <button
                  onClick={() => closeEditModal()} // ✅ Fixed
                  className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
                <EditRecord
                  studentId={studentDetails[activeTab]!.student_id}
                  onClose={(updatedStudent?: Student) => closeEditModal(updatedStudent)} // ✅ Fixed
                />
              </div>
            </div>
          )}

          {searchTerm && filteredStudents.length > 0 ? (
            <ul className="bg-white rounded-lg shadow-lg">
              {filteredStudents.map((student) => (
                <li
                  key={`${student.id}-${student.last_name}`}
                  onClick={() => handleSelectStudent(student)}
                  className="cursor-pointer p-4 hover:bg-blue-100 transition-colors"
                >
                  {student.last_name.toUpperCase()}, {student.first_name}
                </li>
              ))}
            </ul>
          ) : (
            searchTerm && <p className="text-gray-600">No students found...</p>
          )}

          <div className="mb-4 flex flex-wrap">
            {activeTabs.map((lastName) => {
              const student = students?.find((s) => s.last_name === lastName);
              return (
                <div key={lastName} className="flex items-center mr-2 mb-2">
                  <button
                    onClick={() => setActiveTab(lastName)}
                    className={`p-2 rounded-lg transition duration-200 ${
                      activeTab === lastName
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300"
                    }`}
                  >
                    {lastName.toUpperCase()}
                  </button>
                  <button
                    onClick={() => handleCloseDetails(lastName)}
                    className="ml-1 p-1 text-red-500 hover:bg-red-100 rounded-full transition duration-200"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              );
            })}
          </div>

          {activeTab && studentDetails[activeTab] && (
            <div className="mt-4 bg-white rounded-lg p-4 shadow-lg relative">
              <button
                onClick={openEditModal}
                className="absolute top-2 right-2 p-2 text-blue-500 hover:text-blue-700"
              >
                <FiEdit size={20} />
              </button>

              <section className="flex gap-4 mb-4">
                <div className="flex-shrink-0">
                  <Image
                    src={studentDetails[activeTab]!.photo_path || "/profile.png"}
                    alt="Student photo"
                    width={128}
                    height={128}
                    className="w-32 h-32 object-cover rounded-full border border-gray-300"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-xl font-semibold">
                    Name: {studentDetails[activeTab]!.last_name.toUpperCase()}, {studentDetails[activeTab]!.first_name}
                  </p>
                  <p>Student ID: {studentDetails[activeTab]!.student_id}</p>
                  <p>Present Address: {studentDetails[activeTab]!.present_address}</p>
                  <p>Home Address: {studentDetails[activeTab]!.home_address}</p>
                  <p>Course - Year: {studentDetails[activeTab]!.course} - {studentDetails[activeTab]!.year}</p>
                  <p>Date of Birth: {formatDate(studentDetails[activeTab]!.date_of_birth)}</p>
                  <p>Email: {studentDetails[activeTab]!.email}</p>
                  <p>Phone: {studentDetails[activeTab]!.phone_number}</p>
                </div>
              </section>

              <ConsultationCards selectedStudent={studentDetails[activeTab]!} />
              <ClinicHistory studentId={studentDetails[activeTab]!.student_id} />
            </div>
          )}
        </main>

        {activeTab && studentDetails[activeTab] && (
          <EmergencyContacts
            name={studentDetails[activeTab]!.emergency_contact_name}
            relation={studentDetails[activeTab]!.emergency_contact_relation}
            phone={studentDetails[activeTab]!.emergency_contact_phone}
          />
        )}
      </div>
    </div>
  );
};

export default Record;
