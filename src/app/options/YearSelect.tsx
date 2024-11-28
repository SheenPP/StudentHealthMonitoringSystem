import React from 'react';

interface YearSelectProps {
  year: string;
  setYear: (value: string) => void;
  years: string[];
}

const YearSelect: React.FC<YearSelectProps> = ({ year, setYear, years }) => {
  return (
    <div>
      <label className="block mb-1">Year</label>
      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="border border-gray-300 rounded-md p-2 w-full"
        required
      >
        <option value="">Select Year</option>
        {years.map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
  );
};

export default YearSelect;
