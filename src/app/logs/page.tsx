"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

// Types
type Image = {
  id: string;
  image_url: string;
  filename: string;
  uploaded_at: string;
};

type SortState = {
  key: keyof Image;
  order: "asc" | "desc";
};

// Skeleton Loader for the Logs Table
const SkeletonTable = () => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-lg animate-pulse">
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-3 border text-left">Image</th>
            <th className="p-3 border">Filename</th>
            <th className="p-3 border">Uploaded Date</th>
            <th className="p-3 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index} className="hover:bg-gray-100">
              <td className="p-3 border">
                <div className="h-16 w-16 bg-gray-300 rounded-md"></div>
              </td>
              <td className="p-3 border">
                <div className="h-5 w-32 bg-gray-300 rounded"></div>
              </td>
              <td className="p-3 border">
                <div className="h-5 w-24 bg-gray-300 rounded"></div>
              </td>
              <td className="p-3 border text-center">
                <div className="h-8 w-20 bg-gray-300 rounded"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function Logs() {
  const [images, setImages] = useState<Image[]>([]);
  const [modalImage, setModalImage] = useState<Image | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState<boolean>(true); // Global loading state
  const [error, setError] = useState("");
  const [sortState, setSortState] = useState<SortState>({
    key: "uploaded_at",
    order: "desc",
  });

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/logs");
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data: Image[] = await res.json();
      setImages(data);
    } catch (err) {
      setError("Failed to load images. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      await fetchLogs();
    } catch (err) {
      setError("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleModalOpen = useCallback((image: Image) => {
    setModalImage(image);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalImage(null);
  }, []);

  const sortedImages = [...images].sort((a, b) => {
    return sortState.order === "asc"
      ? a[sortState.key].localeCompare(b[sortState.key])
      : b[sortState.key].localeCompare(a[sortState.key]);
  });

  return (
    <div className="flex flex-col flex-1 bg-gray-50 text-gray-800 min-h-screen">
      <Header />
      <div className="flex flex-1 h-screen overflow-hidden">
        <Sidebar />
        <div className="p-6 w-full max-w-6xl mx-auto">
          <h1 className="text-4xl text-center mb-8 text-black">Logs</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* Upload Section */}
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Upload Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-100 file:text-blue-700
                hover:file:bg-blue-200"
              disabled={uploading}
            />
            {uploading && (
              <p className="mt-3 text-blue-500 text-center animate-pulse">
                Uploading... Please wait.
              </p>
            )}
          </div>

          {/* Skeleton Loader for Table */}
          {loading ? (
            <SkeletonTable />
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-3 border text-left">Image</th>
                    <th className="p-3 border cursor-pointer" onClick={() => setSortState({ key: "filename", order: sortState.order === "asc" ? "desc" : "asc" })}>
                      Filename {sortState.key === "filename" && (sortState.order === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-3 border cursor-pointer" onClick={() => setSortState({ key: "uploaded_at", order: sortState.order === "asc" ? "desc" : "asc" })}>
                      Uploaded Date {sortState.key === "uploaded_at" && (sortState.order === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-3 border text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedImages.map((image) => (
                    <tr key={image.id} className="hover:bg-gray-100">
                      <td className="p-3 border">
                        <img src={image.image_url} alt={image.filename} className="h-16 w-16 object-cover rounded-md" />
                      </td>
                      <td className="p-3 border">{image.filename}</td>
                      <td className="p-3 border">{new Date(image.uploaded_at).toLocaleString()}</td>
                      <td className="p-3 border text-center">
                        <button className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={() => handleModalOpen(image)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Image Modal */}
          {modalImage && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={handleModalClose}>
              <div className="relative bg-white rounded-lg p-6 shadow-lg max-w-3xl w-full">
                <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl" onClick={handleModalClose}>
                  &times;
                </button>
                <img src={modalImage.image_url} alt={modalImage.filename} className="w-full h-auto object-contain rounded-md" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
