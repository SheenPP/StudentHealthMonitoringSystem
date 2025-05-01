"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

const MAX_ATTEMPTS = 5;
const COOLDOWN_TIME = 3 * 60 * 1000; // 3 minutes in ms

const StudentLogin = () => {
  const [email, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const lastAttempt = localStorage.getItem("lastLoginAttempt");
    if (lastAttempt) {
      const diff = Date.now() - parseInt(lastAttempt);
      if (diff < COOLDOWN_TIME) {
        setIsLocked(true);
        const timeLeft = COOLDOWN_TIME - diff;
        const timeout = setTimeout(() => {
          setIsLocked(false);
          setAttempts(0);
          localStorage.removeItem("lastLoginAttempt");
        }, timeLeft);
        return () => clearTimeout(timeout);
      } else {
        localStorage.removeItem("lastLoginAttempt");
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isLocked) {
      setError("Too many failed attempts. Please wait before trying again.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        "/api/auth/userlogin",
        { email, password },
        { withCredentials: true }
      );

      setAttempts(0);
      localStorage.removeItem("lastLoginAttempt");
      router.push("/user/dashboard");
    } catch (err: unknown) {
      let errorMessage = "Login failed. Please try again.";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.error || errorMessage;
      }

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        localStorage.setItem("lastLoginAttempt", Date.now().toString());
        errorMessage = "Too many failed attempts. Please try again in 3 minutes.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-xl sm:text-2xl text-black font-semibold mb-6 text-center">
          User Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="identifier"
              value={email}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={isLocked || loading}
              className="mt-1 p-2 w-full border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
              disabled={isLocked || loading}
              className="mt-1 p-2 w-full border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 pr-10"
              aria-disabled={isLocked}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-9 right-3 text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>

          {attempts > 0 && !isLocked && (
            <p className="text-yellow-500 text-sm text-center">
              {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 && "s"} left before lockout.
            </p>
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || isLocked}
            className={`w-full py-2 mt-4 text-white rounded-md focus:ring-2 focus:ring-blue-500 ${
              isLocked ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-black">
          <p>
            <Link href="/user/forgot-password" className="text-blue-500 hover:underline">
              Forgot Password?
            </Link>
          </p>
          <p className="mt-2">
            Don&rsquo;t have an account?{" "}
            <Link href="/user/register" className="text-blue-500 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
