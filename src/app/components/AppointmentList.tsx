import { format } from "date-fns";
import { Calendar, Clock, CheckCircle, XCircle, Hourglass } from "lucide-react"; // ✅ Icons

export default function AppointmentList({ appointments }) {
  return (
    <div className="bg-white shadow-lg p-6 rounded-lg mt-6">
      <h2 className="text-xl font-semibold mb-4 text-center text-gray-800 flex items-center justify-center gap-2">
        <Calendar size={24} /> Your Appointments
      </h2>

      {appointments.length === 0 ? (
        <p className="text-gray-500 text-center">No appointments booked yet.</p>
      ) : (
        <ul className="space-y-4">
          {appointments.map((appt) => (
            <li key={appt.id} className="border p-5 rounded-lg shadow-md bg-gray-50 hover:bg-gray-100 transition">
              <p className="text-gray-700 flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" />
                <strong>Date:</strong> {format(new Date(appt.date), "MMMM d, yyyy")}
              </p>
              <p className="text-gray-700 flex items-center gap-2">
                <Clock size={18} className="text-blue-500" />
                <strong>Time:</strong> {format(new Date(`1970-01-01T${appt.time}`), "h:mm a")}
              </p>
              <p className="text-gray-700"><strong>Reason:</strong> {appt.reason}</p>
              <p className="text-gray-700 font-semibold flex items-center gap-2">
                <strong>Status:</strong> 
                <span className={`ml-2 px-3 py-1 rounded-md text-white flex items-center gap-1 ${
                  appt.status === "Pending" ? "bg-yellow-500" :
                  appt.status === "Approved" ? "bg-green-500" :
                  "bg-red-500"
                }`}>
                  {appt.status === "Pending" && <Hourglass size={16} />}
                  {appt.status === "Approved" && <CheckCircle size={16} />}
                  {appt.status === "Rejected" && <XCircle size={16} />}
                  {appt.status}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
