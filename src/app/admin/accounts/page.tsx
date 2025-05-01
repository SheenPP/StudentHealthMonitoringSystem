'use client';

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Sidebar from "../../components/AdminSidebar";
import useAdminAuth from "../../hooks/useAdminAuth";
import { Dialog } from "@headlessui/react";

interface Account {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export default function AdminApprovals() {
  const { authChecked } = useAdminAuth();
  const [pendingStudents, setPendingStudents] = useState<Account[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<Account[]>([]);
  const [pendingStaffs, setPendingStaffs] = useState<Account[]>([]);
  const [pendingAdmins, setPendingAdmins] = useState<Account[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    id: number | null;
    type: string;
    action: string;
  }>({ open: false, id: null, type: "", action: "" });

  const fetchPendingAccounts = useCallback(async () => {
    try {
      const response = await axios.get("/api/admin/getPendingAccounts", {
        withCredentials: true,
      });

      const { accounts, users, admins } = response.data;

      const students = (accounts ?? []).filter((acc: Account) => acc.role === "student");
      const teachers = (accounts ?? []).filter((acc: Account) => acc.role === "teacher");

      setPendingStudents(students);
      setPendingTeachers(teachers);
      setPendingStaffs(users); // renamed "users" to "staffs"
      setPendingAdmins(admins);
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

  const handleConfirm = (id: number, type: string, action: string) => {
    setConfirmModal({ open: true, id, type, action });
  };

  const confirmAction = async () => {
    const { id, type, action } = confirmModal;
    if (!id || !type) return;

    try {
      await axios.put(
        "/api/admin/updateAccountStatus",
        { id, type, status: action },
        { withCredentials: true }
      );
      fetchPendingAccounts();
    } catch (error) {
      console.error(`Error updating ${type} status:`, error);
    } finally {
      setConfirmModal({ open: false, id: null, type: "", action: "" });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold mb-2">Pending Approvals</h1>
        <p className="text-gray-600 mb-6">Manage student, teacher, staff, and admin approvals.</p>

        {loadingData ? (
          <>
            <SkeletonTable title="Pending Students" />
            <SkeletonTable title="Pending Teachers" />
            <SkeletonTable title="Pending Staffs" />
            <SkeletonTable title="Pending Admins" />
          </>
        ) : (
          <>
            <ApprovalTable title="Pending Students" data={pendingStudents} type="student" onAction={handleConfirm} />
            <ApprovalTable title="Pending Teachers" data={pendingTeachers} type="teacher" onAction={handleConfirm} />
            <ApprovalTable title="Pending Staffs" data={pendingStaffs} type="user" onAction={handleConfirm} />
            <ApprovalTable title="Pending Admins" data={pendingAdmins} type="admin" onAction={handleConfirm} />
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <Dialog open={confirmModal.open} onClose={() => setConfirmModal({ ...confirmModal, open: false })}>
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <Dialog.Title className="text-lg font-medium mb-3">Confirm Action</Dialog.Title>
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to{" "}
              <strong className="capitalize">{confirmModal.action}</strong> this {confirmModal.type}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                className="bg-gray-200 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 rounded-md text-white ${
                  confirmModal.action === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirmModal.action === "approved" ? "Approve" : "Reject"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

interface ApprovalTableProps {
  title: string;
  data: Account[];
  type: string;
  onAction: (id: number, type: string, action: string) => void;
}

const ApprovalTable = ({ title, data, type, onAction }: ApprovalTableProps) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="overflow-x-auto rounded border border-gray-300 shadow">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase">
            <tr>
              <th className="p-3 w-1/3 border text-left">Name</th>
              <th className="p-3 w-1/3 border text-left">Email</th>
              <th className="p-3 w-[150px] border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-3 border truncate">{item.name}</td>
                <td className="p-3 border truncate">{item.email}</td>
                <td className="p-3 border">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAction(item.id, type, "approved")}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onAction(item.id, type, "rejected")}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SkeletonTable = ({ title }: { title: string }) => (
  <div className="mb-8">
    <h2 className="text-lg font-medium text-gray-400">{title}</h2>
    <div className="overflow-x-auto rounded border border-gray-300 shadow mt-2">
      <table className="w-full table-fixed text-sm">
        <thead className="bg-gray-100 text-gray-400 uppercase">
          <tr>
            <th className="p-3 w-1/3 border text-left">Name</th>
            <th className="p-3 w-1/3 border text-left">Email</th>
            <th className="p-3 w-[150px] border text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(4)].map((_, index) => (
            <tr key={index} className="animate-pulse">
              <td className="p-3 border">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </td>
              <td className="p-3 border">
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              </td>
              <td className="p-3 border">
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-300 rounded" />
                  <div className="h-6 w-16 bg-gray-300 rounded" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
