import { useState } from 'react';

export const useOptions = () => {
  const departments = [
    "College of Technology and Allied Sciences",
    "College of Teacher Education",
  ];

  const coursesByDepartment: Record<string, string[]> = {
    "College of Technology and Allied Sciences": [
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Fisheries", 
      "Bachelor of Science in Industrial Technology major in Food Preparation and Service Management",
      "Bachelor of Science in Industrial Technology major in Electrical Technology", 
      "Midwifery", 
    ],
    "College of Teacher Education": [
      "Bachelor in Elementary Education",
      "Bachelor in Secondary Education major in English",
      "Bachelor in Secondary Education major in Mathematics"
    ],
  };

  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  return { departments, coursesByDepartment, years };
};
