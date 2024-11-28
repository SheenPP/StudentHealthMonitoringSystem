// pages/underconstruction.js

import Head from 'next/head';
import Link from 'next/link'; // Import Link from Next.js

export default function UnderConstruction() {
  return (
    <>
      <Head>
        <title>Under Construction</title>
        <meta name="description" content="Page is under construction. Please check back later." />
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400">
        <div className="text-center max-w-2xl p-10 bg-white shadow-2xl rounded-xl transform transition-transform hover:scale-105 ease-in-out duration-300">
          <h1 className="text-5xl font-bold text-gray-800 tracking-tight">
            🚧 Site Under Construction 🚧
          </h1>
          <p className="mt-4 text-xl text-gray-600 leading-relaxed">
            We're building something amazing. Stay tuned and check back soon for exciting updates!
          </p>

          <div className="mt-6">
            <div className="w-40 h-2 bg-gray-300 rounded-full mx-auto mb-4">
              <div className="w-28 h-2 bg-blue-600 rounded-full transition-all duration-500"></div>
            </div>
            <p className="text-sm text-gray-500">Progress: 70%</p>
          </div>

          <div className="mt-8">
            {/* GIF as background with better styling */}
            <div className="relative w-72 h-64 overflow-hidden rounded-lg shadow-md mb-8 mx-auto">
              <img
                src="/Animation.gif" // Adjusted to point to the local gif file
                alt="Under Construction Animation"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            {/* Using Link component directly without <a> tag */}
            <Link
              href="/"
              className="px-6 py-3 border-2 border-gray-800 text-gray-800 font-semibold text-lg rounded-md shadow-md hover:bg-gray-800 hover:text-white transform transition ease-in-out duration-300"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
