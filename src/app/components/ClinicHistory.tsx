"use client";

import React, { useEffect, useState } from "react";

interface FileAction {
  action: string;
  user: string;
  timestamp: string;
  fileName: string;
}

interface ClinicHistoryProps {
  studentId: string | undefined;
  onHistoryUpdated?: () => void;
}

const ITEMS_PER_PAGE = 5;

const ClinicHistory: React.FC<ClinicHistoryProps> = ({ studentId, onHistoryUpdated }) => {
  const [history, setHistory] = useState<FileAction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    if (!studentId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/history?student_id=${studentId}`);
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
          setCurrentPage(1); // reset to first page when data changes
        } else {
          setHistory([]);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An error occurred while fetching history.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentId, onHistoryUpdated]);

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const paginatedData = history.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  if (!studentId) {
    return (
      <div className="p-4 text-gray-700 text-center">
        Select a student to view history.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-gray-700 text-center">
        Loading history...
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white rounded-lg shadow-lg overflow-x-auto">
      {error && (
        <div className="p-4 bg-red-100 text-red-600 rounded-md mb-4 border border-red-300">
          ⚠️ {error}
        </div>
      )}

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">Date/Time</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">Action</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">File Name</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">User</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {paginatedData.length > 0 ? (
            paginatedData.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50 transition">
                <td className="p-4 text-gray-700">{new Date(record.timestamp).toLocaleString()}</td>
                <td className="p-4 text-gray-700">{record.action}</td>
                <td className="p-4 text-gray-700">{record.fileName}</td>
                <td className="p-4 text-gray-700">{record.user}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="p-4 text-gray-500 text-center">
                No history available.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="space-x-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md text-sm text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-md text-sm text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicHistory;
