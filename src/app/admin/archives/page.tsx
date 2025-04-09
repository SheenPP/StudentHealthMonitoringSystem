"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "../../components/AdminSidebar";
import Header from "../../components/Header";
import useAdminAuth from "../../hooks/useAdminAuth";

type Archive = {
  id: string;
  file_name: string;
  deleted_by: string;
  deleted_at: string;
};

export default function Archives() {
  const { authChecked, loading: authLoading } = useAdminAuth(); // ✅ Removed unused admin
  const [archives, setArchives] = useState<Archive[]>([]);
  const [error, setError] = useState("");
  const [loadingArchives, setLoadingArchives] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchArchives = useCallback(async () => {
    try {
      const res = await axios.get("/api/recycle-bin", {
        withCredentials: true,
      });
      setArchives(res.data);
    } catch (err) {
      console.error("Error fetching archives:", err);
      setError("Failed to load archive files.");
    } finally {
      setLoadingArchives(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked) {
      fetchArchives();
    }
  }, [authChecked, fetchArchives]);

  const handleRestore = async (id: string, file_name: string) => {
    const confirmed = window.confirm(`Are you sure you want to restore "${file_name}"?`);
    if (!confirmed) return;

    setProcessingId(id);
    try {
      await axios.post(
        "/api/recycle-bin",
        {
          action: "restore",
          file_id: id,
          username: "admin_user", // ✅ Hardcoded fallback username
        },
        { withCredentials: true }
      );
      alert(`"${file_name}" has been restored successfully!`);
      fetchArchives();
    } catch (err) {
      console.error("Restore error:", err);
      alert("Failed to restore the file.");
    } finally {
      setProcessingId(null);
    }
  };

  // const handleDelete = async (id: string, file_name: string) => {
  //   const confirmed = window.confirm(`Are you sure you want to permanently delete "${file_name}"?`);
  //   if (!confirmed) return;

  //   setProcessingId(id);
  //   try {
  //     await axios.post(
  //       "/api/recycle-bin",
  //       {
  //         action: "delete",
  //         file_id: id,
  //         username: "admin_user", // ✅ Hardcoded fallback username
  //       },
  //       { withCredentials: true }
  //     );
  //     alert(`"${file_name}" has been permanently deleted.`);
  //     fetchArchives();
  //   } catch (err) {
  //     console.error("Delete error:", err);
  //     alert("Failed to delete the file.");
  //   } finally {
  //     setProcessingId(null);
  //   }
  // };

  const SkeletonTableRow = () => (
    <tr>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </td>
      <td className="px-6 py-4 text-center">
        <div className="h-4 bg-gray-300 rounded w-24 mx-auto" />
      </td>
    </tr>
  );

  const showSkeleton = authLoading || loadingArchives;

  return (
    <div className="flex flex-col flex-1 bg-white min-h-screen text-gray-800">
      <Header />
      <div className="flex flex-1 h-screen overflow-hidden">
        <Sidebar />
        <main className="p-8 w-full max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-blue-800 mb-8">
            Clinic Recycle Bin
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-center shadow">
              {error}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-blue-100 text-blue-800 text-left">
                <tr>
                  <th className="px-6 py-3 font-semibold">File Name</th>
                  <th className="px-6 py-3 font-semibold">Deleted On</th>
                  <th className="px-6 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {showSkeleton ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} />)
                ) : archives.length > 0 ? (
                  archives.map((archive) => (
                    <tr key={archive.id} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800 max-w-xs truncate">
                        {archive.file_name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(archive.deleted_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center space-x-4">
                        <button
                          className={`text-green-600 hover:underline font-medium ${
                            processingId === archive.id ? "opacity-50 pointer-events-none" : ""
                          }`}
                          onClick={() => handleRestore(archive.id, archive.file_name)}
                          disabled={processingId === archive.id}
                        >
                          {processingId === archive.id ? "Processing..." : "Restore"}
                        </button>
                        {/* <button
                          className={`text-red-600 hover:underline font-medium ${
                            processingId === archive.id ? "opacity-50 pointer-events-none" : ""
                          }`}
                          onClick={() => handleDelete(archive.id, archive.file_name)}
                          disabled={processingId === archive.id}
                        >
                          {processingId === archive.id ? "Processing..." : "Delete"}
                        </button> */}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-gray-500">
                      No archived files found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
