export type EventType = "meeting" | "class" | "exam" | "quiz";

export interface CalendarEvent {
  id: string;
  title: string;
  calendarEventId: number;
  sectionId: number;
  type: EventType;
  startTime: string;
  endTime: string;
  // year?: string[];
  subjectName?: string;
  subjectCode?: string;
  subjectKey?: string;
  year?: string;
  branch?: string;
  section?: string;
  day: string;
  rawFormData?: any;
}

export interface WeekDay {
  day: string;
  date: number;
  fullDate: string;
}



export type CalendarEventUI = {
  calendarEventId: number;
  facultyId: number;

  eventTitle: string;
  eventTopic: string;
  type: string;
  date: string;

  roomNo: string;
  fromTime: string;
  toTime: string;

  degree: string;
  year: string;

  departments: string[];
  sections: string[];
  semester: string;

  createdAt: string;
  updatedAt: string;
};
