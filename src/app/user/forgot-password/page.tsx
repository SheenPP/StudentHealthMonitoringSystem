// pages/user/forgot-password.tsx
"use client";
import { useState } from "react";
import axios from "axios";
import { FiMail } from "react-icons/fi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error" | "loading">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      await axios.post("/api/auth/forgotPassword", { email });
      setStatus("success");
    } catch (err) {
      console.error("Password reset error:", err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center mb-4">
          <FiMail className="text-blue-600 text-3xl mr-2" />
          <h2 className="text-2xl font-semibold text-gray-800">Forgot Password</h2>
        </div>

        <p className="text-sm text-gray-600 mb-6 text-center">
          Enter your registered email below and we’ll send you a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="w-full border border-gray-300 px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className={`w-full py-2 px-4 rounded-md text-white font-medium transition ${
              status === "loading"
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {status === "loading" ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {status === "success" && (
          <p className="mt-4 text-green-600 text-sm text-center animate-fade-in">
            ✅ If your email is valid, a reset link has been sent.
          </p>
        )}

        {status === "error" && (
          <p className="mt-4 text-red-600 text-sm text-center animate-fade-in">
            ❌ Something went wrong. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
