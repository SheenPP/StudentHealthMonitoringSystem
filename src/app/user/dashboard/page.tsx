'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/StudentNavbar";
import Image from "next/image";
import useUserAuth from "../../hooks/useUserAuth";

export default function Dashboard() {
  const { user, authChecked, loading } = useUserAuth();
  const router = useRouter();

  useEffect(() => {
    if (authChecked && !user) {
      router.push("/user/login");
    }
  }, [authChecked, user, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen dark:bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <p>You are not authenticated. Please log in.</p>
      </div>
    );
  }

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();

  const avatarSrc =
    user?.photo_path && user.photo_path.trim() !== ""
      ? user.photo_path
      : "";

  const formatName = (name?: string) =>
    name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : "";

  const userRole = formatName(user?.role || "Not Available");

  return (
    <>
      <Navbar />

      <div className="max-w-2xl mx-auto mt-10 p-6 dark:bg-black">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
          Welcome to Your Dashboard
        </h1>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 flex flex-col items-center text-center border dark:border-gray-700">
          <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center text-3xl font-semibold mb-4 overflow-hidden">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt="User Avatar"
                width={96}
                height={96}
                className="rounded-full object-cover w-full h-full"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {formatName(user?.first_name)} {formatName(user?.last_name)}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>ID:</strong> {user?.user_id}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Email:</strong> {user?.email}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>{userRole}</strong>
            </p>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <Link href="/user/appointments">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition duration-200">
              Manage Appointments
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
