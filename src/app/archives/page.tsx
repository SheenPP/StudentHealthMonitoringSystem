"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

type Archive = {
  id: string;
  file_id: string;
  file_name: string;
  deleted_by: string;
  deleted_at: string; // Date of deletion
};

type SortState = {
  key: keyof Archive;
  order: "asc" | "desc";
};

export default function Archives() {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Loading state for actions
  const [sortState, setSortState] = useState<SortState>({
    key: "deleted_at",
    order: "desc",
  });

  const fetchArchives = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/recycle-bin");
      if (!res.ok) throw new Error("Failed to fetch archives");
      const data: Archive[] = await res.json();
      setArchives(data);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching archives:", err.message);
        setError("Failed to load archives. Please try again later.");
      } else {
        console.error("Unknown error:", err);
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  const handleAction = async (file_id: string, action: "restore" | "delete") => {
    try {
      setLoading(true);
      const res = await fetch("/api/recycle-bin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }
      fetchArchives(); // Refresh the list after the action
    } catch (err) {
      if (err instanceof Error) {
        console.error(`Failed to ${action} file:`, err.message);
        setError(`Failed to ${action} file. Please try again.`);
      } else {
        console.error("Unknown error:", err);
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const sortedArchives = [...archives].sort((a, b) => {
    const aValue = a[sortState.key];
    const bValue = b[sortState.key];
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortState.order === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortState.order === "asc"
        ? new Date(aValue).getTime() - new Date(bValue).getTime()
        : new Date(bValue).getTime() - new Date(aValue).getTime();
    }
    return 0;
  });

  const toggleSortOrder = (key: keyof Archive) => {
    setSortState((prevState) => {
      if (prevState.key === key) {
        return {
          key,
          order: prevState.order === "asc" ? "desc" : "asc",
        };
      }
      return { key, order: "asc" };
    });
  };

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

          {loading && (
            <p className="mb-4 text-blue-600 text-center animate-pulse">
              Processing... Please wait.
            </p>
          )}

          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-4">
              <button
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                  sortState.key === "deleted_at"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-100 text-blue-800"
                }`}
                onClick={() => toggleSortOrder("deleted_at")}
              >
                Sort by Date {sortState.key === "deleted_at" && (sortState.order === "asc" ? "↑" : "↓")}
              </button>
              <button
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                  sortState.key === "file_name"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-100 text-blue-800"
                }`}
                onClick={() => toggleSortOrder("file_name")}
              >
                Sort by Name {sortState.key === "file_name" && (sortState.order === "asc" ? "↑" : "↓")}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-bold text-blue-800">
                    File Name
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-bold text-blue-800">
                    Deleted By
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-bold text-blue-800">
                    Deleted On
                  </th>
                  <th className="px-4 py-2 text-center text-sm font-bold text-blue-800">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedArchives.map((archive) => (
                  <tr key={archive.id} className="border-t hover:bg-blue-50">
                    <td className="px-4 py-2 text-sm text-gray-800 truncate">
                      {archive.file_name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {archive.deleted_by}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(archive.deleted_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        className="text-sm text-green-600 hover:underline mr-2"
                        onClick={() => handleAction(archive.file_id, "restore")}
                        disabled={loading}
                      >
                        Restore
                      </button>
                      <button
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => handleAction(archive.file_id, "delete")}
                        disabled={loading}
                      >
                        Delete
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
