"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { ImSpinner2 } from "react-icons/im";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useParams() as { token: string };

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("idle");
    setErrorMessage("");

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
      setStatus("loading");
      await axios.post("/api/auth/resetPassword", { token, newPassword });
      setStatus("success");
      setTimeout(() => router.push("/user/login"), 2000);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Check if the error is an Axios error
        setErrorMessage(error.response?.data?.error || "Reset failed.");
      } else {
        setErrorMessage("Reset failed.");
      }
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transition-all animate-fade-in">
        <div className="flex items-center justify-center mb-6">
          <FiLock className="text-blue-600 text-4xl mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
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

          {/* Confirm Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
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

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 ${
              status === "loading" ? "cursor-not-allowed opacity-70" : ""
            }`}
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <ImSpinner2 className="animate-spin mr-2" /> Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </button>

          {/* Feedback */}
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
