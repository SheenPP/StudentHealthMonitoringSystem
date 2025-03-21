import { useState } from "react";
import { format } from "date-fns"; // ✅ Import for date formatting
import { Calendar, Clock, FileText, Loader } from "lucide-react"; // ✅ Icons

export default function AppointmentForm({ onBookSuccess, studentId }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Format date & time into readable format
  const formatDate = (inputDate) => {
    if (!inputDate) return "";
    return format(new Date(inputDate), "MMMM d, yyyy"); // Example: March 14, 2025
  };

  const formatTime = (inputTime) => {
    if (!inputTime) return "";
    const [hours, minutes] = inputTime.split(":").map(Number);
    const dateObj = new Date();
    dateObj.setHours(hours, minutes);
    return format(dateObj, "h:mm a"); // Example: 2:30 PM
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/appointment/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, date, time, reason }),
      });

      if (res.ok) {
        onBookSuccess();
        setDate("");
        setTime("");
        setReason("");
        alert("✅ Appointment booked successfully!");
      } else {
        const data = await res.json();
        setError(data.error || "⚠️ Failed to book appointment. Try again.");
      }
    } catch (error) {
      setError("⚠️ Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-lg p-6 rounded-lg w-full max-w-lg mx-auto border border-gray-200"
    >
      <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800 flex items-center justify-center gap-2">
        <Calendar size={28} /> Book an Appointment
      </h2>

      {error && (
        <p className="text-red-500 text-sm mb-3 text-center bg-red-100 p-2 rounded-md border border-red-300">
          {error}
        </p>
      )}

      {/* Date Field */}
      <div className="mb-4">
        <label htmlFor="appointment-date" className="block font-medium text-gray-700 mb-1 flex items-center gap-2">
          <Calendar size={20} className="text-blue-500" />
          Select a Date
        </label>
        <input
          type="date"
          id="appointment-date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {date && <p className="text-sm text-gray-500 mt-1">📅 {formatDate(date)}</p>}
      </div>

      {/* Time Field */}
      <div className="mb-4">
        <label htmlFor="appointment-time" className="block font-medium text-gray-700 mb-1 flex items-center gap-2">
          <Clock size={20} className="text-blue-500" />
          Select a Time
        </label>
        <input
          type="time"
          id="appointment-time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {time && <p className="text-sm text-gray-500 mt-1">⏰ {formatTime(time)}</p>}
      </div>

      {/* Reason Field */}
      <div className="mb-4">
        <label htmlFor="appointment-reason" className="block font-medium text-gray-700 mb-1 flex items-center gap-2">
          <FileText size={20} className="text-blue-500" />
          Reason for Appointment
        </label>
        <textarea
          id="appointment-reason"
          placeholder="Enter reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          rows={3}
          className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full text-white font-semibold py-2 px-4 rounded-md transition flex items-center justify-center gap-2 ${
          loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {loading ? <Loader size={18} className="animate-spin" /> : null}
        {loading ? "Booking..." : "Book Appointment"}
      </button>
    </form>
  );
}
