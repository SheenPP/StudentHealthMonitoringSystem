"use client";

import { useEffect, useState } from "react";
import { Download, FileText, FolderOpen, Calendar } from "lucide-react";

interface File {
  id: number;
  file_name: string;
  file_path: string;
  upload_date: string;
  consultation_type?: string; // optional, if included
}

interface FileListProps {
  search: string;
  consultationType: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const SkeletonFileList = () => (
  <tbody>
    {Array.from({ length: 5 }).map((_, index) => (
      <tr key={index} className="border-b hover:bg-gray-100 transition">
        <td className="p-4 font-medium">{index + 1}</td>
        <td className="p-4 flex items-center gap-2">
          <FileText size={16} className="text-gray-400" />
          <div className="h-5 w-40 bg-gray-300 rounded animate-pulse"></div>
        </td>
        <td className="p-4">
          <div className="h-5 w-24 bg-gray-300 rounded animate-pulse"></div>
        </td>
        <td className="p-4 text-center">
          <div className="h-8 w-24 bg-gray-300 rounded animate-pulse"></div>
        </td>
      </tr>
    ))}
  </tbody>
);

const FileList: React.FC<FileListProps> = ({
  search,
  consultationType,
  currentPage,
  onPageChange,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
        });

        if (search) query.append("search", search);
        if (consultationType) query.append("consultationType", consultationType);

        const response = await fetch(`/api/all-files?${query.toString()}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Failed to fetch files");

        setFiles(data.files);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [search, consultationType, currentPage]);

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handleDownload = (fileName: string) => {
    console.log('Downloading file:', fileName); // Log the filename for debugging
    window.location.href = `/api/download?filename=${encodeURIComponent(fileName)}`;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6 flex items-center justify-center gap-2">
        <FolderOpen size={28} className="text-blue-600" />
        All Files
      </h2>

      {error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : files.length === 0 && !loading ? (
        <p className="text-center text-gray-600">No files found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-gray-300 shadow-lg rounded-lg">
              <thead className="bg-blue-600 text-white text-left">
                <tr>
                  <th className="p-4 w-16">No.</th>
                  <th className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText size={18} />
                      File Name
                    </div>
                  </th>
                  <th className="p-4 w-1/5">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} />
                      Upload Date
                    </div>
                  </th>
                  <th className="p-4 w-1/5 text-center">Download</th>
                </tr>
              </thead>
              {loading ? (
                <SkeletonFileList />
              ) : (
                <tbody>
                  {files.map((file, index) => (
                    <tr
                      key={file.id}
                      className={`border-b ${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-gray-100 transition`}
                    >
                      <td className="p-4 font-medium">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="p-4 flex items-center gap-2 text-gray-700">
                        <FileText size={16} className="text-gray-600" />
                        {file.file_name}
                      </td>
                      <td className="p-4 text-gray-700">
                        {new Date(file.upload_date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDownload(file.file_name)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-700 transition duration-200"
                        >
                          <Download size={16} /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-700 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FileList;
