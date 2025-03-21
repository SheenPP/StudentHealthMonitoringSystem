"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/AdminSidebar";
import { useRouter } from "next/navigation";

export default function AdminApprovals() {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPendingAccounts();
  }, []);

  const fetchPendingAccounts = async () => {
    try {
      const response = await axios.get("/api/admin/getPendingAccounts", {
        withCredentials: true, // Ensures cookies are sent automatically
      });

      setPendingStudents(response.data.students);
      setPendingUsers(response.data.users);
      setPendingAdmins(response.data.admins);
    } catch (error) {
      console.error("Error fetching pending accounts:", error);
      router.push("/admin-login"); // Redirect if unauthorized
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, type: string, status: string) => {
    try {
      await axios.put(
        "/api/admin/updateAccountStatus",
        { id, type, status },
        { withCredentials: true } // Ensures cookies are sent with request
      );

      fetchPendingAccounts(); // Refresh data after update
    } catch (error) {
      console.error(`Error updating ${type} status:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          <p className="mt-2 text-gray-700 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="bg-gray-200 transition-all duration-300">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">Pending Approvals</h1>
        <p className="text-gray-600 mt-2">Manage student, user, and admin approvals.</p>

        <ApprovalTable title="Pending Students" data={pendingStudents} type="student" updateStatus={updateStatus} />
        <ApprovalTable title="Pending Users" data={pendingUsers} type="user" updateStatus={updateStatus} />
        <ApprovalTable title="Pending Admins" data={pendingAdmins} type="admin" updateStatus={updateStatus} />
      </div>
    </div>
  );
}

const ApprovalTable = ({ title, data, type, updateStatus }: any) => {
  if (data.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-medium">{title}</h2>
      <table className="w-full mt-2 border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item: any) => (
            <tr key={item.id}>
              <td className="border p-2">{item.id}</td>
              <td className="border p-2">{item.name}</td>
              <td className="border p-2">{item.email}</td>
              <td className="border p-2">
                <button
                  onClick={() => updateStatus(item.id, type, "approved")}
                  className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(item.id, type, "rejected")}
                  className="bg-red-500 text-white px-2 py-1 rounded ml-2 hover:bg-red-600"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
