"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation"; // ✅ Redirect support
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Loader } from "lucide-react";

type Archive = {
  id: string;
  file_name: string;
  deleted_by: string;
  deleted_at: string;
};

export default function Archives() {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [loadingUI, setLoadingUI] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null); // ✅ Track processing file
  const router = useRouter();

  // 🔹 Check if the user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/");
    }
  }, [router]);

  // Fetch archives data
  const fetchArchives = useCallback(async () => {
    try {
      setLoadingData(true);
      const res = await fetch("/api/recycle-bin", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`, // ✅ Secure API requests
        },
      });
      if (!res.ok) throw new Error("Failed to fetch archives");
      const data: Archive[] = await res.json();
      setArchives(data);
    } catch (err) {
      console.error("Error fetching archives:", err);
      setError("Failed to load archives. Please try again later.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchArchives();
    setTimeout(() => setLoadingUI(false), 1000);
  }, [fetchArchives]);

  const isLoading = loadingData || loadingUI;

  // Handle Restore File Action
  const handleRestore = async (id: string, file_name: string) => {
    const confirmed = window.confirm(`Are you sure you want to restore "${file_name}"?`);
    if (!confirmed) return;

    setProcessingId(id); // ✅ Show loading indicator

    try {
      const res = await fetch("/api/recycle-bin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", file_id: id }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to restore file");

      alert(`"${file_name}" has been restored successfully!`);
      fetchArchives();
    } catch (error) {
      console.error("Restore error:", error);
      alert("Failed to restore the file. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Permanent Delete Action
  const handleDelete = async (id: string, file_name: string) => {
    const confirmed = window.confirm(`Are you sure you want to permanently delete "${file_name}"?`);
    if (!confirmed) return;

    setProcessingId(id); // ✅ Show loading indicator

    try {
      const res = await fetch("/api/recycle-bin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", file_id: id }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete file");

      alert(`"${file_name}" has been deleted permanently!`);
      fetchArchives();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete the file. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <Loader className="animate-spin h-12 w-12 text-blue-500" />
          <p className="mt-3 text-blue-600 text-lg">Loading Archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-blue-50 text-gray-800 min-h-screen">
      <Header />
      <div className="flex flex-1 h-screen overflow-hidden">
        <Sidebar />
        <div className="p-6 w-full max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">
            Clinic Recycle Bin
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-bold text-blue-800">File Name</th>
                  <th className="px-4 py-2 text-left text-sm font-bold text-blue-800">Deleted By</th>
                  <th className="px-4 py-2 text-left text-sm font-bold text-blue-800">Deleted On</th>
                  <th className="px-4 py-2 text-center text-sm font-bold text-blue-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {archives.map((archive) => (
                  <tr key={archive.id} className="border-t hover:bg-blue-50">
                    <td className="px-4 py-2 text-sm text-gray-800 truncate">{archive.file_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{archive.deleted_by}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(archive.deleted_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        className={`text-sm text-green-600 hover:underline mr-2 ${
                          processingId === archive.id ? "opacity-50 pointer-events-none" : ""
                        }`}
                        onClick={() => handleRestore(archive.id, archive.file_name)}
                        disabled={processingId === archive.id}
                      >
                        {processingId === archive.id ? "Processing..." : "Restore"}
                      </button>
                      <button
                        className={`text-sm text-red-600 hover:underline ${
                          processingId === archive.id ? "opacity-50 pointer-events-none" : ""
                        }`}
                        onClick={() => handleDelete(archive.id, archive.file_name)}
                        disabled={processingId === archive.id}
                      >
                        {processingId === archive.id ? "Processing..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
