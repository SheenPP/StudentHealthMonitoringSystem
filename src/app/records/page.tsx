"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useAuth from "../hooks/useAuth";
import FileList from "../components/FileList";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Header";

const Records = () => {
  const { user, authChecked, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams?.get("search") || "");
  const [consultationType, setConsultationType] = useState(searchParams?.get("consultationType") || "");
  const [page, setPage] = useState(Number(searchParams?.get("page") || 1));

  useEffect(() => {
    if (authChecked && !user) {
      router.replace("/");
    }
  }, [authChecked, user, router]);

  const updateQueryParams = useCallback(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.set("search", searchQuery);
    if (consultationType) params.set("consultationType", consultationType);
    params.set("page", page.toString());

    router.push(`/records?${params.toString()}`);
  }, [searchQuery, consultationType, page, router]); // Include dependencies

  useEffect(() => {
    // Reflect changes in the URL on page/filter change
    updateQueryParams();
  }, [updateQueryParams]); // Added updateQueryParams here

  if (!authChecked || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          <p className="mt-2 text-gray-700 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1">
        <div className="bg-gray-200 w-64 min-h-full">
          <Sidebar />
        </div>
        <div className="flex-1 p-6 bg-white">
          {/* Search + Filter Bar */}
          <div className="mb-4 flex flex-col sm:flex-row gap-4 sm:items-center">
            <input
              type="text"
              placeholder="Search by ID or filename"
              value={searchQuery}
              onChange={(e) => {
                setPage(1);
                setSearchQuery(e.target.value);
              }}
              className="border border-gray-300 rounded px-4 py-2 w-full sm:w-1/3"
            />
            <select
              value={consultationType}
              onChange={(e) => {
                setPage(1);
                setConsultationType(e.target.value);
              }}
              className="border border-gray-300 rounded px-4 py-2 w-full sm:w-1/4"
            >
              <option value="">All Types</option>
              <option value="Medical Consultation">Medical Consultation</option>
              <option value="Medical Referral">Medical Referral</option>
              <option value="Pre-Enrollment">Pre-Enrollment</option>
              <option value="Dental Consultation">Dental Consultation</option>
              <option value="Waivers">Waivers</option>
              <option value="Guidance Referral">Guidance Referral</option>
              <option value="Pre-Employment">Pre-Employment</option>
              <option value="Laboratory Req">Laboratory Req</option>
            </select>
          </div>

          <FileList
            search={searchQuery}
            consultationType={consultationType}
            currentPage={page}
            onPageChange={(newPage: number) => setPage(newPage)}
          />
        </div>
      </div>
    </div>
  );
};

export default Records;
