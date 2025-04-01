import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg } from "@fullcalendar/core"; // ✅ Correct type for eventClick
import "@fortawesome/fontawesome-free/css/all.css";
import "../css/PatientVisitCalendar.css";

interface PatientVisitCalendarProps {
  visitDates: { title: string; start: string; end?: string }[];
  handleEventClick: (arg: EventClickArg) => void; // ✅ Fixed type
}

const PatientVisitCalendar: React.FC<PatientVisitCalendarProps> = ({
  visitDates,
  handleEventClick,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Patient Visit Calendar
      </h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={visitDates}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height="450px"
        eventClick={handleEventClick}
        dayCellContent={(dayCell) => {
          return <div className="text-xs">{dayCell.dayNumberText}</div>;
        }}
      />
    </div>
  );
};

export default PatientVisitCalendar;
