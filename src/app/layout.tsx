import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SchoolTermProvider } from "./context/SchoolTermContext";
import ToastProvider from "./components/ToastProvider"; // ✅ import the wrapper

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "BISU Calape Clinic",
  description: "thesis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SchoolTermProvider>
          {children}
          <ToastProvider /> {/* ✅ now it's safe */}
        </SchoolTermProvider>
      </body>
    </html>
  );
}
