import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg } from "@fullcalendar/core"; // Type for click
import "@fortawesome/fontawesome-free/css/all.css";
import "../css/PatientVisitCalendar.css";

interface PatientVisitCalendarProps {
  visitDates: {
    title: string;
    start: string;
    end?: string;
    backgroundColor?: string;
    borderColor?: string;
  }[];
  handleEventClick: (arg: EventClickArg) => void;
}

const PatientVisitCalendar: React.FC<PatientVisitCalendarProps> = ({
  visitDates,
  handleEventClick,
}) => {
  // Optional: color code based on title prefix
  const coloredEvents = visitDates.map((event) => {
    if (event.title.startsWith("Patient Visit")) {
      return {
        ...event,
        backgroundColor: "#3b82f6", // blue
        borderColor: "#2563eb",
      };
    } else if (event.title.startsWith("Appointment")) {
      return {
        ...event,
        backgroundColor: "#22c55e", // green
        borderColor: "#16a34a",
      };
    }
    return event;
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Visit & Appointment Calendar
      </h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={coloredEvents}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height="450px"
        eventClick={handleEventClick}
        dayCellContent={(dayCell) => (
          <div className="text-xs">{dayCell.dayNumberText}</div>
        )}
      />
    </div>
  );
};

export default PatientVisitCalendar;
