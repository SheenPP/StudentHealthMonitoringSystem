import React, { useEffect, useState } from 'react';

interface FileAction {
  action: string;
  user: string;
  timestamp: string;
  fileName: string;
}

interface ClinicHistoryProps {
  studentId: string | undefined;
  onHistoryUpdated?: () => void; // Optional callback to trigger update when a task is completed
}

const ClinicHistory: React.FC<ClinicHistoryProps> = ({ studentId, onHistoryUpdated }) => {
  const [history, setHistory] = useState<FileAction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      console.warn('No student ID provided, skipping fetch');
      setHistory([]);
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      console.log(`Fetching history for student ID: ${studentId}`);
      try {
        const response = await fetch(`/api/history?student_id=${studentId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched data:', data);
          setHistory(data);
        } else {
          console.warn('No history found.');
          setHistory([]); // Clear history if no data is returned
        }
      } catch (error) {
        setError('An error occurred while fetching history.');
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentId, onHistoryUpdated]); // Trigger fetch when studentId or history is updated

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
    <div className="mt-8 bg-white rounded-lg shadow-lg">
      <table className="min-w-full">
        <thead className="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">Date/Time</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">Action</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">File Name</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">User</th>
          </tr>
        </thead>
        <tbody className="overflow-y-auto max-h-64">
          {history.length > 0 ? (
            history.map((record, index) => (
              <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-4 text-gray-700">{new Date(record.timestamp).toLocaleString()}</td>
                <td className="p-4 text-gray-700">{record.action}</td>
                <td className="p-4 text-gray-700">{record.fileName}</td>
                <td className="p-4 text-gray-700">{record.user}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="p-4 text-gray-700 text-center">
                No history available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ClinicHistory;
