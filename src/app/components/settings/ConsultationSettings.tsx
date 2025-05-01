"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface Consultation {
  id?: number;
  name: string;
  for_role: "student" | "teacher" | "both";
}

const ConsultationSettings: React.FC = () => {
  const [consultationTypes, setConsultationTypes] = useState<Consultation[]>([]);
  const [consultationName, setConsultationName] = useState("");
  const [forRole, setForRole] = useState<"student" | "teacher" | "both">("student");
  const [show, setShow] = useState(false);

  const fetchConsultationTypes = async () => {
    try {
      const res = await fetch("/api/consultation-types");
      const data = await res.json();
      setConsultationTypes(data);
    } catch {
      toast.error("Failed to load consultation types.");
    }
  };

  const handleAddConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/consultation-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: consultationName.trim(), for_role: forRole }),
      });

      if (res.ok) {
        toast.success("Consultation type added!");
        setConsultationName("");
        setForRole("student");
        fetchConsultationTypes();
      } else {
        toast.error("Failed to add consultation type.");
      }
    } catch {
      toast.error("Unexpected error occurred.");
    }
  };

  useEffect(() => {
    fetchConsultationTypes();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow border max-w-xl mb-8">
      <button
        onClick={() => setShow((prev) => !prev)}
        className="w-full text-left text-xl font-semibold text-gray-800 mb-2"
      >
        Consultation Settings
      </button>

      {show && (
        <>
          <form onSubmit={handleAddConsultation} className="space-y-4 border-t pt-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Consultation Name</label>
              <input
                type="text"
                value={consultationName}
                onChange={(e) => setConsultationName(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                placeholder="e.g. Dental Checkup"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">For Role</label>
              <select
                value={forRole}
                onChange={(e) => setForRole(e.target.value as Consultation["for_role"])}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="both">Both</option>
              </select>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
            >
              Add Consultation
            </button>
          </form>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Existing Types</h3>
            {consultationTypes.length === 0 ? (
              <p className="text-gray-500 text-sm">No consultation types yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {consultationTypes.map((type) => (
                  <li key={type.id} className="flex justify-between border rounded px-3 py-2">
                    <span>{type.name}</span>
                    <span className="text-gray-500 capitalize text-xs">For: {type.for_role}</span>
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

export default ConsultationSettings;
