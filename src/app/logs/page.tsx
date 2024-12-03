"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

type Image = {
  id: string;
  image_url: string;
  filename: string;
  uploaded_at: string; // Use uploaded_at field
};

type SortState = {
  key: keyof Image;
  order: "asc" | "desc";
};

export default function Logs() {
  const [images, setImages] = useState<Image[]>([]);
  const [modalImage, setModalImage] = useState<Image | null>(null);
  const [uploading, setUploading] = useState(false);
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
      if (err instanceof Error) {
        console.error("Error fetching logs:", err.message);
        setError("Failed to load images. Please try again later.");
      } else {
        console.error("Unknown error:", err);
        setError("An unknown error occurred.");
      }
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
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      await fetchLogs();
    } catch (err) {
      if (err instanceof Error) {
        console.error("Upload failed:", err.message);
        setError(err.message || "An unexpected error occurred during upload.");
      } else {
        console.error("Unknown upload error:", err);
        setError("An unknown error occurred during upload.");
      }
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

  // Sorting Logic
  const sortedImages = [...images].sort((a, b) => {
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

  const toggleSortOrder = (key: keyof Image) => {
    setSortState((prevState) => {
      if (prevState.key === key) {
        // Toggle order for the current key
        return {
          key,
          order: prevState.order === "asc" ? "desc" : "asc",
        };
      }
      // Set to ascending for a new key
      return { key, order: "asc" };
    });
  };

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

          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-4">
              <button
                className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                  sortState.key === "uploaded_at" ? "bg-blue-200" : "bg-gray-100"
                }`}
                onClick={() => toggleSortOrder("uploaded_at")}
              >
                Sort by Date {sortState.key === "uploaded_at" && (sortState.order === "asc" ? "↑" : "↓")}
              </button>
              <button
                className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                  sortState.key === "filename" ? "bg-blue-200" : "bg-gray-100"
                }`}
                onClick={() => toggleSortOrder("filename")}
              >
                Sort by Name {sortState.key === "filename" && (sortState.order === "asc" ? "↑" : "↓")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {sortedImages.map((image) => (
              <div
                key={image.id}
                className="relative border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-transform transform hover:scale-105"
                onClick={() => handleModalOpen(image)}
              >
                <img
                  src={image.image_url}
                  alt={image.filename}
                  className="w-full h-40 object-cover"
                />
              </div>
            ))}
          </div>

          {modalImage && (
            <div
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
              onClick={handleModalClose}
            >
              <div className="relative bg-white rounded-lg p-6 shadow-lg max-w-3xl w-full">
                <button
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl"
                  onClick={handleModalClose}
                >
                  &times;
                </button>
                <img
                  src={modalImage.image_url}
                  alt={modalImage.filename}
                  className="w-full h-auto object-contain rounded-md"
                />
                <p className="mt-4 text-center text-sm text-gray-500">
                  {modalImage.filename}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
