"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface SchoolTerm {
  id: number;
  school_year: string;
  semester: string;
  is_active: number;
}

const SchoolTermSettings: React.FC = () => {
  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState("1st");
  const [terms, setTerms] = useState<SchoolTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [show, setShow] = useState(true);

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/school-terms/all");
      const data = await response.json();
      setTerms(data);
    } catch {
      toast.error("Failed to load school terms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const trimmedYear = schoolYear.trim();
    const yearFormat = /^\d{4}-\d{4}$/;

    if (!yearFormat.test(trimmedYear)) {
      toast.error("School year must be in YYYY-YYYY format.");
      setFormLoading(false);
      return;
    }

    const isDuplicate = terms.some(
      (term) =>
        term.school_year.trim().toLowerCase() === trimmedYear.toLowerCase() &&
        term.semester.trim().toLowerCase() === semester.trim().toLowerCase()
    );

    if (isDuplicate) {
      toast.error("This school term already exists.");
      setFormLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/school-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school_year: trimmedYear, semester }),
      });

      if (res.ok) {
        toast.success("School term added successfully!");
        setSchoolYear("");
        setSemester("1st");
        fetchTerms();
      } else {
        toast.error("Failed to add school term.");
      }
    } catch {
      toast.error("Unexpected error occurred.");
    }

    setFormLoading(false);
  };

  const activateTerm = async (id: number) => {
    const res = await fetch(`/api/school-terms/${id}/activate`, { method: "PUT" });
    if (res.ok) {
      toast.success("Term activated.");
      fetchTerms();
    } else {
      toast.error("Failed to activate term.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border max-w-xl mb-8">
      <button
        onClick={() => setShow((prev) => !prev)}
        className="w-full text-left text-xl font-semibold text-gray-800 mb-2"
      >
        School Terms
      </button>

      {show && (
        <>
          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            <div>
              <label className="text-sm font-medium text-gray-700">School Year</label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                placeholder="e.g. 2024-2025"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="1st">1st</option>
                <option value="2nd">2nd</option>
                <option value="Midyear">Midyear</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
            >
              Save Term
            </button>
          </form>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Existing Terms</h3>
            {terms.length === 0 ? (
              <p className="text-gray-500 text-sm">No terms available.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {terms.map((term) => (
                  <li
                    key={term.id}
                    className={`p-3 border rounded flex justify-between ${
                      term.is_active ? "bg-green-50 border-green-500" : ""
                    }`}
                  >
                    <span>
                      A.Y. {term.school_year} | {term.semester} Semester
                      {term.is_active ? " (Active)" : ""}
                    </span>
                    {!term.is_active && (
                      <button
                        onClick={() => activateTerm(term.id)}
                        className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Set as Active
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SchoolTermSettings;
