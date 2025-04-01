"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Login from "./components/LoginModal";
import Image from "next/image"; // ✅ Use Next.js optimized image

const Home = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/bisu.jpg')" }}
    >
      {/* Overlay */}
      <div className="bg-black bg-opacity-50 min-h-screen">
        {/* Navbar */}
        <nav className="flex justify-between items-center p-6 bg-white bg-opacity-90 shadow-md">
          <div className="text-xl font-bold text-blue-500">BISU Clinic</div>
          <ul className="flex space-x-8">
            <li>
              <Link href="/" className="text-blue-500 font-medium">
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/Page404"
                className="text-gray-600 hover:text-blue-500 transition"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/Page404"
                className="text-gray-600 hover:text-blue-500 transition"
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        {/* Hero Section */}
        <section className="flex flex-col md:flex-row items-center justify-between p-12 text-white">
          <div className="md:w-1/2">
            <h1 className="text-4xl font-bold text-blue-300">HEALTH CARE</h1>
            <p className="mt-4 text-gray-200 text-justify mr-2">
              Our Student&apos;s Profiling Health Management System makes health
              records easy to access and keep organized. Say goodbye to
              paperwork and hello to an efficient and secure solution.
            </p>
            {/* Login Section */}
            <Login />
          </div>

          <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center">
            <Image
              src="/building.gif"
              alt="Healthcare GIF"
              width={600}
              height={400}
              className="w-full h-auto"
              priority
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
