"use client";
import React, { useEffect, useState } from "react";
import { useSchoolTerm } from "../context/SchoolTermContext";

interface SchoolTerm {
  id: number;
  school_year: string;
  semester: string;
  is_active: number;
}

const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [terms, setTerms] = useState<SchoolTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedTerm, setSelectedTerm } = useSchoolTerm(); // ✅ using context

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/school-terms/all")
      .then((res) => res.json())
      .then((data: SchoolTerm[]) => {
        setTerms(data);
        const active = data.find((term) => term.is_active === 1);
        if (active) setSelectedTerm(active); // ✅ default to active term
      })
      .catch((err) => {
        console.error("Failed to load terms:", err);
        setTerms([]);
      })
      .finally(() => setIsLoading(false));
  }, [setSelectedTerm]);

  return (
    <header className="w-full flex flex-col md:flex-row justify-between items-center gap-4 p-6 bg-white shadow-md border-b border-gray-200">
      <h1 className="text-xl font-semibold text-gray-800">BISU Clinic</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="term-select" className="text-sm text-gray-600">
            Term:
          </label>
          {isLoading ? (
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
          ) : (
            <select
              id="term-select"
              value={selectedTerm?.id ?? ""}
              onChange={(e) => {
                const newId = parseInt(e.target.value);
                const newTerm = terms.find((term) => term.id === newId);
                if (newTerm) {
                  setSelectedTerm(newTerm);
                }
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="" disabled>
                Select Term
              </option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  A.Y. {term.school_year} | {term.semester}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-gray-600 text-sm min-w-[150px]">
          {currentTime ? (
            <>
              {currentTime.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </>
          ) : (
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
