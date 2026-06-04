import { CalendarEvent, CalendarEventUI, WeekDay } from "./types";

export const getEventStyle = (event: CalendarEvent) => {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  const startOfDay = new Date(start);
  startOfDay.setHours(8, 0, 0, 0);

  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  const minutesFromStart =
    (start.getTime() - startOfDay.getTime()) / (1000 * 60);
  const PIXELS_PER_MIN = 2;

  return {
    top: minutesFromStart * PIXELS_PER_MIN,
    height: durationMinutes * PIXELS_PER_MIN,
  };
};

export const getWeekDays = (currentDate: Date): WeekDay[] => {
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();

  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  const week: WeekDay[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    week.push({
      day: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getDay()],
      date: d.getDate(),
      fullDate: d.toISOString().split("T")[0],
    });
  }
  return week;
};

export const combineDateAndTime = (
  dateStr: string,
  timeStr: string
): string => {
  if (!dateStr || !timeStr) return new Date().toISOString();
  const d = new Date(dateStr + "T" + timeStr);
  return d.toISOString();
};

export const getOverlappingEvents = (
  events: CalendarEvent[]
) => {
  return events.map((event, index) => {
    let overlapCount = 1;
    let position = 0;

    for (let i = 0; i < events.length; i++) {
      if (i === index) continue;

      const aStart = new Date(event.startTime).getTime();
      const aEnd = new Date(event.endTime).getTime();
      const bStart = new Date(events[i].startTime).getTime();
      const bEnd = new Date(events[i].endTime).getTime();

      if (aStart < bEnd && aEnd > bStart) {
        overlapCount++;
        if (i < index) position++;
      }
    }

    return {
      ...event,
      overlapIndex: position,
      overlapTotal: overlapCount,
    };
  });
};

export const hasTimeConflict = (
  events: CalendarEvent[],
  newStart: string,
  newEnd: string
) => {
  const newStartTime = new Date(newStart).getTime();
  const newEndTime = new Date(newEnd).getTime();

  return events.some((event) => {
    const existingStart = new Date(event.startTime).getTime();
    const existingEnd = new Date(event.endTime).getTime();

    return newStartTime < existingEnd && newEndTime > existingStart;
  });
};


const extractNames = (value: any): string[] =>
  Array.isArray(value) ? value.map((v) => v?.name).filter(Boolean) : [];

export const mapDbToUiEvent = (row: any): CalendarEventUI => ({
  calendarEventId: row.calendarEventId,
  facultyId: row.facultyId,
  eventTitle: row.eventTitle,
  eventTopic: row.eventTopic,
  type: row.type,
  date: row.date,
  roomNo: row.roomNo,
  fromTime: row.fromTime,
  toTime: row.toTime,
  degree: row.degree,
  year: row.year,
  departments: extractNames(row.department),
  sections: extractNames(row.section),
  semester: extractNames(row.semester)[0] ?? "",
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

