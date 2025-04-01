// src/app/components/LoginModal.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRoleRedirect = (role: "admin" | "student") => {
    router.push(`/${role}-login`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/login", { username, password });
      const { token } = response.data;
      localStorage.setItem("authToken", token);
      window.location.href = "/dashboard";
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl text-gray-800 font-semibold mb-6 text-center">Login</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p
            className="text-sm text-gray-600 cursor-pointer hover:underline"
            onClick={() => handleRoleRedirect("admin")}
          >
            Admin
          </p>
          <p
            className="text-sm text-gray-600 cursor-pointer hover:underline mt-2"
            onClick={() => handleRoleRedirect("student")}
          >
            Student
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
