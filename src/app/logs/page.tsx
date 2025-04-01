"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Image from "next/image";

type ImageData = {
  id: string;
  image_url: string;
  filename: string;
  uploaded_at: string;
};

type SortState = {
  key: keyof ImageData;
  order: "asc" | "desc";
};

const Logs = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [modalImage, setModalImage] = useState<ImageData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [sortState, setSortState] = useState<SortState>({
    key: "uploaded_at",
    order: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 5;

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/logs");
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data: ImageData[] = await res.json();
      setImages(data);
    } catch {
      setError("Failed to load images.");
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });
      fetchLogs();
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/logs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchLogs();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const sortedImages = [...images].sort((a, b) =>
    sortState.order === "asc"
      ? a[sortState.key].localeCompare(b[sortState.key])
      : b[sortState.key].localeCompare(a[sortState.key])
  );

  const indexOfLast = currentPage * imagesPerPage;
  const indexOfFirst = indexOfLast - imagesPerPage;
  const currentImages = sortedImages.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedImages.length / imagesPerPage);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="p-6 w-full">
          <h1 className="text-3xl font-bold text-center mb-6">Logs</h1>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <div className="mb-6">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="file:bg-blue-100 file:text-blue-800 file:font-semibold file:rounded file:px-4 file:py-2"
            />
          </div>

          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-3">Image</th>
                  <th
                    className="p-3 cursor-pointer"
                    onClick={() =>
                      setSortState({
                        key: "filename",
                        order: sortState.order === "asc" ? "desc" : "asc",
                      })
                    }
                  >
                    Filename
                  </th>
                  <th className="p-3">Uploaded</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentImages.map((image) => (
                  <tr key={image.id} className="border-t">
                    <td className="p-3">
                      <Image
                        src={image.image_url}
                        alt={image.filename}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded-md cursor-pointer"
                        onClick={() => setModalImage(image)}
                      />
                    </td>
                    <td className="p-3">{image.filename}</td>
                    <td className="p-3">
                      {new Date(image.uploaded_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-center space-x-2">
                      <button
                        onClick={() => setModalImage(image)}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === idx + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {modalImage && (
            <div
              className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center"
              onClick={() => setModalImage(null)}
            >
              <div
                className="bg-white rounded-md p-6 max-w-2xl w-full relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="absolute top-2 right-4 text-2xl text-gray-600"
                  onClick={() => setModalImage(null)}
                >
                  &times;
                </button>
                <Image
                  src={modalImage.image_url}
                  alt={modalImage.filename}
                  width={800}
                  height={600}
                  className="w-full h-auto object-contain rounded"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Logs;
