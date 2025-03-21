"use client";

import { useEffect, useState } from "react";
import { Download, FileText, FolderOpen, Calendar } from "lucide-react"; // Import icons

interface File {
  id: number;
  file_name: string;
  file_path: string;
  upload_date: string;
}

// Skeleton loader component (Only the body should be a skeleton)
const SkeletonFileList = () => {
  return (
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
};

const FileList: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch("/api/all-files");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch files");
        }

        setFiles(data.files);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 shadow-md rounded-lg">
      {/* 📂 All Files Header with Icon */}
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6 flex items-center justify-center gap-2">
        <FolderOpen size={28} className="text-blue-600" />
        All Files
      </h2>

      {error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : files.length === 0 && !loading ? (
        <p className="text-center text-gray-600">No files found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white border border-gray-300 shadow-lg rounded-lg">
            {/* ✅ Fixed: Table header is always displayed correctly */}
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
            {/* ✅ Show either skeleton loader or actual data */}
            {loading ? (
              <SkeletonFileList />
            ) : (
              <tbody>
                {files.map((file, index) => (
                  <tr
                    key={file.id}
                    className={`border-b ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-gray-100 transition`}
                  >
                    <td className="p-4 font-medium">{index + 1}</td>
                    <td className="p-4 flex items-center gap-2 text-gray-700">
                      <FileText size={16} className="text-gray-600" />
                      {file.file_name}
                    </td>
                    <td className="p-4 text-gray-700">
                      {new Date(file.upload_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <a
                        href={`/${file.file_path}`}
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-700 transition duration-200"
                      >
                        <Download size={16} /> Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default FileList;
