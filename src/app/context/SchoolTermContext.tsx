"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface Term {
  id: number;
  school_year: string;
  semester: string;
  is_active: number;
}

interface SchoolTermContextType {
  selectedTerm: Term | null;
  selectedTermId: number | null;
  setSelectedTerm: (term: Term) => void;
}

const SchoolTermContext = createContext<SchoolTermContextType | undefined>(undefined);

export const SchoolTermProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

  useEffect(() => {
    const fetchTerms = async () => {
      const res = await fetch("/api/school-terms/all");
      const terms: Term[] = await res.json();
      const active = terms.find((t) => t.is_active === 1);
      if (active) setSelectedTerm(active);
    };
    fetchTerms();
  }, []);

  return (
    <SchoolTermContext.Provider
      value={{
        selectedTerm,
        selectedTermId: selectedTerm?.id ?? null,
        setSelectedTerm,
      }}
    >
      {children}
    </SchoolTermContext.Provider>
  );
};

export const useSchoolTerm = () => {
  const context = useContext(SchoolTermContext);
  if (!context) throw new Error("useSchoolTerm must be used within SchoolTermProvider");
  return context;
};
