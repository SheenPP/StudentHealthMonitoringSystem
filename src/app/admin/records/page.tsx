"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FileList from "../../components/FileList";
import Sidebar from "../../components/AdminSidebar";
import Navbar from "../../components/Header";
import useAdminAuth from "../../hooks/useAdminAuth";

// ✅ Skeleton loader layout
const SkeletonLayout = () => (
  <div className="flex flex-col min-h-screen bg-gray-100">
    <div className="h-16 bg-gray-200" />
    <div className="flex flex-1">
      <div className="w-64 bg-gray-200" />
      <div className="flex-1 p-6">
        <div className="h-6 w-1/3 bg-gray-300 rounded mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Records = () => {
  const { authChecked, loading: authLoading } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams?.get("search") || "");
  const [consultationType, setConsultationType] = useState(searchParams?.get("consultationType") || "");
  const [page, setPage] = useState(Number(searchParams?.get("page") || 1));

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (consultationType) params.set("consultationType", consultationType);
    params.set("page", page.toString());

    router.push(`/admin/records?${params.toString()}`);
  }, [searchQuery, consultationType, page, router]); // Added router here

  if (!authChecked || authLoading) {
    return <SkeletonLayout />;
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

          {/* ✅ FileList with props */}
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

const RecordsPage = () => (
  <Suspense fallback={<SkeletonLayout />}>
    <Records />
  </Suspense>
);

export default RecordsPage;
