"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

// ✅ Strong password pattern
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? null; // Ensure null if not present

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setStatus("error");
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      setErrorMessage(
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
      );
      setStatus("error");
      return;
    }

    try {
      if (!token) {
        setErrorMessage("Token is missing.");
        setStatus("error");
        return;
      }

      await axios.post("/api/auth/resetPassword", { token, newPassword });
      setStatus("success");
      setTimeout(() => router.push("/student/login"), 2000);
    } catch (error) {
      console.error(error);
      const axiosError = error as unknown as {
        response?: { data?: { error?: string } };
      };
      setErrorMessage(axiosError?.response?.data?.error || "Reset failed.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center mb-4">
          <FiLock className="text-blue-600 text-3xl mr-2" />
          <h2 className="text-2xl font-semibold text-gray-800">Reset Password</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type={showNewPassword ? "text" : "password"}
              className="w-full border border-gray-300 px-4 py-2 pr-10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute right-3 top-[35px] text-gray-500"
              tabIndex={-1}
            >
              {showNewPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="w-full border border-gray-300 px-4 py-2 pr-10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-[35px] text-gray-500"
              tabIndex={-1}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition"
          >
            Reset Password
          </button>

          {status === "success" && (
            <p className="mt-4 text-green-600 text-sm text-center animate-fade-in">
              ✅ Password reset successful! Redirecting...
            </p>
          )}

          {status === "error" && (
            <p className="mt-4 text-red-600 text-sm text-center animate-fade-in">
              ❌ {errorMessage}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
