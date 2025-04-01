"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Sidebar from "../../components/AdminSidebar";
import { useRouter } from "next/navigation";
import useAdminAuth from "../../hooks/useAdminAuth";
import { Loader } from "lucide-react";

interface Account {
  id: number;
  name: string;
  email: string;
}

export default function AdminApprovals() {
  const { authChecked, loading: authLoading } = useAdminAuth();
  const [pendingStudents, setPendingStudents] = useState<Account[]>([]);
  const [pendingUsers, setPendingUsers] = useState<Account[]>([]);
  const [pendingAdmins, setPendingAdmins] = useState<Account[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();

  const fetchPendingAccounts = useCallback(async () => {
    try {
      const response = await axios.get("/api/admin/getPendingAccounts", {
        withCredentials: true,
      });

      setPendingStudents(response.data.students);
      setPendingUsers(response.data.users);
      setPendingAdmins(response.data.admins);
    } catch (error) {
      console.error("Error fetching pending accounts:", error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked) {
      fetchPendingAccounts();
    }
  }, [authChecked, fetchPendingAccounts]);

  const updateStatus = async (id: number, type: string, status: string) => {
    try {
      await axios.put(
        "/api/admin/updateAccountStatus",
        { id, type, status },
        { withCredentials: true }
      );
      fetchPendingAccounts(); // Refresh list
    } catch (error) {
      console.error(`Error updating ${type} status:`, error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-700 text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="bg-gray-200 transition-all duration-300">
        <Sidebar />
      </div>

      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">Pending Approvals</h1>
        <p className="text-gray-600 mt-2">Manage student, user, and admin approvals.</p>

        {loadingData ? (
          <>
            <SkeletonTable title="Pending Students" />
            <SkeletonTable title="Pending Users" />
            <SkeletonTable title="Pending Admins" />
          </>
        ) : (
          <>
            <ApprovalTable
              title="Pending Students"
              data={pendingStudents}
              type="student"
              updateStatus={updateStatus}
            />
            <ApprovalTable
              title="Pending Users"
              data={pendingUsers}
              type="user"
              updateStatus={updateStatus}
            />
            <ApprovalTable
              title="Pending Admins"
              data={pendingAdmins}
              type="admin"
              updateStatus={updateStatus}
            />
          </>
        )}
      </div>
    </div>
  );
}

interface ApprovalTableProps {
  title: string;
  data: Account[];
  type: string;
  updateStatus: (id: number, type: string, status: string) => void;
}

const ApprovalTable = ({ title, data, type, updateStatus }: ApprovalTableProps) => {
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
          {data.map((item) => (
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

const SkeletonTable = ({ title }: { title: string }) => (
  <div className="mt-6 animate-pulse">
    <h2 className="text-lg font-medium text-gray-400">{title}</h2>
    <div className="mt-2 space-y-2 border border-gray-200 rounded">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="grid grid-cols-4 gap-4 px-4 py-2">
          <div className="h-4 bg-gray-300 rounded" />
          <div className="h-4 bg-gray-300 rounded" />
          <div className="h-4 bg-gray-300 rounded" />
          <div className="h-4 bg-gray-300 rounded" />
        </div>
      ))}
    </div>
  </div>
);
