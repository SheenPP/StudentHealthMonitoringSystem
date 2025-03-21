"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

const MAX_ATTEMPTS = 5;
const COOLDOWN_TIME = 3 * 60 * 1000;

const StudentLogin = () => {
  const [identifier, setIdentifier] = useState(""); 
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const lastAttempt = localStorage.getItem("lastLoginAttempt");
    if (lastAttempt && Date.now() - parseInt(lastAttempt) < COOLDOWN_TIME) {
      setIsLocked(true);
      setTimeout(() => {
        setIsLocked(false);
        setAttempts(0);
        localStorage.removeItem("lastLoginAttempt");
      }, COOLDOWN_TIME - (Date.now() - parseInt(lastAttempt)));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isLocked) {
      setError("Too many failed attempts. Please wait 3 minutes before trying again.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "/api/auth/studentlogin",
        { identifier, password },
        { withCredentials: true }
      );

      setAttempts(0);
      localStorage.removeItem("lastLoginAttempt");
      router.push("/student/dashboard");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Invalid credentials or account not approved.";
      setError(errorMessage);

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        localStorage.setItem("lastLoginAttempt", Date.now().toString());
        setError("Too many failed attempts. Please try again in 3 minutes.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-xl sm:text-2xl text-black font-semibold mb-6 text-center">
          Student Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
              Student ID or Email
            </label>
            <input
              type="text"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={isLocked}
              className="mt-1 p-2 w-full border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password Field with Show/Hide Feature */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLocked}
              className="mt-1 p-2 w-full border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 pr-10"
            />
            <button
              type="button"
              className="absolute top-9 right-3 text-gray-600 hover:text-gray-900"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>

          {/* Warning for login attempts */}
          {attempts > 0 && !isLocked && (
            <p className="text-yellow-500 text-sm text-center">
              Warning: {MAX_ATTEMPTS - attempts} attempts left before lockout.
            </p>
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || isLocked}
            className={`w-full py-2 mt-4 ${
              isLocked
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white rounded-md focus:ring-2 focus:ring-blue-500`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Forgot Password & Register Link */}
        <div className="mt-4 text-center">
          <p className="text-sm text-black">
            <Link href="/student/forgot-password" className="text-blue-500 hover:underline">
              Forgot Password?
            </Link>
          </p>
          <p className="text-sm text-black mt-2">
            Don't have an account?{" "}
            <Link href="/student/register" className="text-blue-500 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
