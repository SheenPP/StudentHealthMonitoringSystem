"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "../../components/AdminSidebar";
import Header from "../../components/Header";
import SupabaseImage from "../../components/SupabaseImage";
import useAdminAuth from "../../hooks/useAdminAuth";

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
  const { authChecked, loading: authLoading } = useAdminAuth();

  const [images, setImages] = useState<ImageData[]>([]);
  const [modalImage, setModalImage] = useState<ImageData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [sortState, setSortState] = useState<SortState>({
    key: "uploaded_at",
    order: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 5;

  const fetchLogs = useCallback(async () => {
    try {
      const res = await axios.get("/api/logs", {
        withCredentials: true,
      });
      setImages(res.data);
    } catch {
      setError("Failed to load images.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked) fetchLogs();
  }, [authChecked, fetchLogs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      await axios.post("/api/image-upload", formData, {
        withCredentials: true,
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
      await axios.delete(`/api/logs/${id}`, {
        withCredentials: true,
      });
      fetchLogs();
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

  const SkeletonRow = () => (
    <tr className="border-t animate-pulse">
      <td className="p-3">
        <div className="w-16 h-16 bg-gray-200 rounded-md" />
      </td>
      <td className="p-3">
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </td>
      <td className="p-3">
        <div className="h-4 w-40 bg-gray-200 rounded" />
      </td>
      <td className="p-3 text-center">
        <div className="h-4 w-24 bg-gray-300 rounded mx-auto" />
      </td>
    </tr>
  );

  const showSkeleton = authLoading || loadingData;

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
                {showSkeleton ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : currentImages.length > 0 ? (
                  currentImages.map((image, idx) => (
                    <tr key={image.id} className="border-t">
                      <td className="p-3">
                        <SupabaseImage
                          src={image.image_url}
                          alt={image.filename}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded-md cursor-pointer"
                          onClick={() => setModalImage(image)}
                          priority={idx === 0}
                        />
                      </td>
                      <td className="p-3">{image.filename}</td>
                      <td className="p-3">{new Date(image.uploaded_at).toLocaleString()}</td>
                      <td className="p-3 text-center space-x-2">
                        <button
                          onClick={() => setModalImage(image)}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </button>
                        {/* <button
                          onClick={() => handleDelete(image.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button> */}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">
                      No logs found.
                    </td>
                  </tr>
                )}
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
                <SupabaseImage
                  src={modalImage.image_url}
                  alt={modalImage.filename}
                  width={800}
                  height={600}
                  className="w-full h-auto object-contain rounded"
                  priority
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
