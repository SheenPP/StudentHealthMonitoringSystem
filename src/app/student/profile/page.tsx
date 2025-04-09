"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import Navbar from "../../components/StudentNavbar";
import Image from "next/image";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-toastify";

interface StudentProfile {
  student_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  photo_path?: string;
}

export default function EditProfile() {
  const router = useRouter();
  const [formData, setFormData] = useState<StudentProfile | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios
      .get<StudentProfile>("/api/auth/getStudentUser", { withCredentials: true })
      .then((res) => setFormData(res.data))
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const validatePassword = (pass: string): boolean => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pass);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error("All password fields are required.");
    }

    if (!validatePassword(newPassword)) {
      return toast.error(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
    }

    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match.");
    }

    setSubmitting(true);

    try {
      await axios.patch(
        "/api/students/changepassword",
        {
          studentId: formData?.student_id,
          currentPassword,
          newPassword,
          confirmPassword,
        },
        { withCredentials: true }
      );

      toast.success("Password changed successfully!");
      setTimeout(() => router.push("/student/dashboard"), 1500);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: string }>;
      const message = axiosErr.response?.data?.error || "Password update failed.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="max-w-3xl mx-auto mt-6 px-4 py-8 bg-white dark:bg-gray-900 rounded-xl shadow-xl border dark:border-gray-700">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          My Profile
        </h1>

        {loading || !formData ? (
          <div className="space-y-6 animate-pulse">
            <div className="flex justify-center">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-300 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
            <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-lg" />
            <div className="h-12 bg-blue-400 dark:bg-blue-600 rounded-lg" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo */}
            <div className="flex justify-center">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-blue-500 shadow">
                {formData.photo_path ? (
                  <Image
                    src={formData.photo_path}
                    alt="Profile"
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                    No Photo
                  </div>
                )}
              </div>
            </div>

            {/* Read-only Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <input
                readOnly
                value={formData.first_name}
                className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
              />
              <input
                readOnly
                value={formData.middle_name || ""}
                className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
              />
              <input
                readOnly
                value={formData.last_name}
                className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
              />
              <input
                readOnly
                type="email"
                value={formData.email}
                className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
              />
            </div>

            {/* Current Password */}
            <PasswordInput
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              show={showCurrent}
              setShow={setShowCurrent}
            />

            {/* New Password */}
            <PasswordInput
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              show={showNew}
              setShow={setShowNew}
            />

            {/* Confirm Password */}
            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              show={showConfirm}
              setShow={setShowConfirm}
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
            >
              {submitting ? "Saving..." : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  setShow: (value: boolean) => void;
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  setShow,
}: PasswordInputProps) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={label}
        value={value}
        onChange={onChange}
        className="w-full p-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 text-black dark:text-white bg-white dark:bg-gray-800"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
      >
        {show ? <FiEyeOff size={20} /> : <FiEye size={20} />}
      </button>
    </div>
  );
}
