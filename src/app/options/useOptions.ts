export const useOptions = () => {
  const departments = [
    "College of Teacher Education",
    "College of Technology",
    "College of Midwifery",
    "College of Fisheries",
  ];

  const coursesByDepartment: Record<string, string[]> = {
    "College of Teacher Education": [
      "Bachelor of Elementary Education",
      "Bachelor of Secondary Education major in English",
      "Bachelor of Secondary Education major in Mathematics",
    ],
    "College of Technology": [
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Industrial Technology major in Food Preparation and Services Technology",
      "Bachelor of Science in Industrial Technology major in Electrical Technology",
    ],
    "College of Midwifery": [
      "Bachelor of Science in Midwifery",
    ],
    "College of Fisheries": [
      "Bachelor of Science in Fisheries",
    ],
  };

  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  return { departments, coursesByDepartment, years };
};
