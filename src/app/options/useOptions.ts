import { useState } from 'react';

export const useOptions = () => {
  const departments = [
    "Science",
    "Arts",
    "Commerce",
    "Engineering",
    "College of Teacher Education",
  ];

  const coursesByDepartment: Record<string, string[]> = {
    "Science": ["Physics", "Chemistry", "Mathematics"],
    "Arts": ["English", "History", "Philosophy"],
    "Commerce": ["Economics", "Accounting", "Business Studies"],
    "Engineering": ["Mechanical Engineering", "Civil Engineering", "Computer Science"],
    "College of Teacher Education": [
      "Bachelor in Elementary Education",
      "Bachelor in Secondary Education major in English",
      "Bachelor in Secondary Education major in Mathematics"
    ],
  };

  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  return { departments, coursesByDepartment, years };
};
