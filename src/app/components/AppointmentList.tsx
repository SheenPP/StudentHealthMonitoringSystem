import { format } from "date-fns";
import { Calendar, Clock, CheckCircle, XCircle, Hourglass } from "lucide-react";

type Appointment = {
  id: string;
  date: string;
  time: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
};

type AppointmentListProps = {
  appointments: Appointment[];
};

const formatDate = (dateStr: string): string =>
  format(new Date(dateStr + "T00:00:00"), "MMMM d, yyyy");

const formatTime = (timeStr: string): string =>
  format(new Date(`1970-01-01T${timeStr}`), "h:mm a");

export default function AppointmentList({ appointments }: AppointmentListProps) {
  return (
    <div className="bg-white shadow-md p-6 rounded-xl mt-6 w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800 flex items-center justify-center gap-2">
        <Calendar size={24} /> Your Appointments
      </h2>

      {appointments.length === 0 ? (
        <p className="text-gray-500 text-center">No appointments booked yet.</p>
      ) : (
        <ul className="space-y-4">
          {appointments.map((appt) => (
            <li
              key={appt.id}
              className="border p-4 md:p-5 rounded-lg shadow-sm bg-gray-50 hover:bg-gray-100 transition flex flex-col gap-3 sm:gap-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <p className="text-gray-700 flex items-center gap-2 text-sm sm:text-base">
                  <Calendar size={18} className="text-blue-500" />
                  <strong>Date:</strong> {formatDate(appt.date)}
                </p>

                <p className="text-gray-700 flex items-center gap-2 text-sm sm:text-base mt-1 sm:mt-0">
                  <Clock size={18} className="text-blue-500" />
                  <strong>Time:</strong> {formatTime(appt.time)}
                </p>
              </div>

              <p className="text-gray-700 text-sm sm:text-base">
                <strong>Reason:</strong> {appt.reason}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-gray-700 font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <strong>Status:</strong>
                  <span
                    className={`ml-2 px-3 py-1 rounded-md text-white flex items-center gap-1 text-sm ${
                      appt.status === "Pending"
                        ? "bg-yellow-500"
                        : appt.status === "Approved"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {appt.status === "Pending" && <Hourglass size={16} />}
                    {appt.status === "Approved" && <CheckCircle size={16} />}
                    {appt.status === "Rejected" && <XCircle size={16} />}
                    {appt.status}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
