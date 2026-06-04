import { supabase } from "@/lib/supabaseClient";

export type CalendarEventRow = {
  facultyId: number;
  subject: string | null;
  college_subjects?: {
    collegeSubjectId: number;
    subjectName: string;
    subjectKey: string;
  } | null;
  eventTopic: number | null;
  college_subject_unit_topics?: {
    collegeSubjectUnitTopicId: number;
    topicTitle: string;
  } | null;
  type: string;
  date: string;
  roomNo: string;
  fromTime: string;
  toTime: string;
  meetingLink: string | null;
  meetingTitle: string | null;
  meetingId: string | null;
  meetingPassword: string | null;
  is_deleted: boolean | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export async function fetchCalendarEvents(
  filters: {
    facultyId?: number;
    date?: string;
    startDate?: string;
    endDate?: string;
  } = {},
) {
  let query = supabase
    .from("calendar_event")
    .select(
      `
  calendarEventId,
  facultyId,
  subject,
  eventTopic,
  type,
  date,
  roomNo,
  fromTime,
  toTime,
  meetingLink,
  meetingTitle,
  meetingId,
  meetingPassword,
  is_deleted,
  createdAt,
  updatedAt,
  deletedAt,

  college_subjects:subject (
    collegeSubjectId,
    subjectName,
    subjectKey
  ),

  college_subject_unit_topics (
    collegeSubjectUnitTopicId,
    topicTitle
  )
`,
    )
    .is("deletedAt", null);

  if (filters.facultyId) {
    query = query.eq("facultyId", filters.facultyId);
  }

  if (filters.date) {
    query = query.eq("date", filters.date);
  }

  if (filters.startDate) {
    query = query.gte("date", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("date", filters.endDate);
  }

  const { data, error } = await query.order("fromTime", { ascending: true });

  if (error) {
    console.error("fetchCalendarEvents error:", error);
    throw error;
  }

  return data ?? [];
}

export async function saveCalendarEvent(payload: {
  calendarEventId?: number;
  facultyId: number;
  subjectId: number | null;
  eventTopic: number | null;
  eventTitle?: string | null;
  type: "class" | "meeting" | "exam" | "quiz";
  date: string;
  roomNo: string;
  fromTime: string;
  toTime: string;
  meetingLink?: string | null;
  meetingId?: string | null;
  meetingPassword?: string | null;
}) {
  const now = new Date().toISOString();

  // 🔁 EDIT
  if (payload.calendarEventId) {
    const { error } = await supabase
      .from("calendar_event")
      .update({
        subject: payload.subjectId,
        eventTopic: payload.eventTopic,
        type: payload.type,
        date: payload.date,
        roomNo: payload.roomNo,
        fromTime: payload.fromTime,
        toTime: payload.toTime,
        meetingTitle: payload.type === "meeting" ? payload.eventTitle : null,
        meetingLink: payload.meetingLink ?? null,
        meetingId: payload.meetingId ?? null,
        meetingPassword: payload.meetingPassword ?? null,
        updatedAt: now,
      })
      .eq("calendarEventId", payload.calendarEventId);

    if (error) {
      console.error("updateCalendarEvent error:", error);
      return { success: false, error };
    }

    return {
      success: true,
      calendarEventId: payload.calendarEventId,
    };
  }

  // ➕ CREATE
  const { data, error } = await supabase
    .from("calendar_event")
    .insert({
      facultyId: payload.facultyId,
      subject: payload.subjectId,
      eventTopic: payload.eventTopic,
      type: payload.type,
      date: payload.date,
      roomNo: payload.roomNo,
      fromTime: payload.fromTime,
      toTime: payload.toTime,
      meetingTitle: payload.type === "meeting" ? payload.eventTitle : null,
      meetingLink: payload.meetingLink ?? null,
      meetingId: payload.meetingId ?? null,
      meetingPassword: payload.meetingPassword ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .select("calendarEventId")
    .single();

  if (error) {
    console.error("insertCalendarEvent error:", error);
    return { success: false, error };
  }

  if (payload.type === "class") {
    await supabase.from("faculty_class_sessions").insert({
      calendarEventId: data.calendarEventId,
      facultyId: payload.facultyId,
      status: "Scheduled",
      acceptedAt: "00:00:00",
      createdAt: now,
      updatedAt: now,
    });
  }

  return {
    success: true,
    calendarEventId: data.calendarEventId,
  };
}

export async function deleteCalendarEvent(calendarEventId: number) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("calendar_event")
    .update({
      is_deleted: true,
      deletedAt: now,
    })
    .eq("calendarEventId", calendarEventId);

  if (error) {
    console.error("deleteCalendarEvent error:", error);
    return { success: false };
  }

  await supabase
    .from("faculty_class_sessions")
    .update({
      is_deleted: true,
      deletedAt: now,
    })
    .eq("calendarEventId", calendarEventId);

  return { success: true };
}

import { sendUniversalNotifications } from "@/lib/helpers/notifications/notificationAPI";

export async function notifyStudentsOfEvent(
  calendarEventId: number,
  payload: any,
) {
  if (!payload.sectionIds || payload.sectionIds.length === 0) return;

  const { data: historyData, error: histError } = await supabase
    .from("student_academic_history")
    .select("studentId")
    .in("collegeSectionsId", payload.sectionIds)
    .eq("isCurrent", true);

  if (histError || !historyData) {
    console.error("Error fetching student history:", histError);
    return;
  }

  const studentIds = historyData.map((h: any) => h.studentId).filter(Boolean);
  if (studentIds.length === 0) return;

  const { data: studentsData, error: stuError } = await supabase
    .from("students")
    .select("userId")
    .in("studentId", studentIds);

  if (stuError || !studentsData) {
    console.error("Error fetching student user IDs:", stuError);
    return;
  }

  const userIds = studentsData.map((s: any) => s.userId).filter(Boolean);
  if (userIds.length === 0) return;

  const typeLabel =
    payload.type.charAt(0).toUpperCase() + payload.type.slice(1);
  const title = `New ${typeLabel} Scheduled`;

  let message = `A new ${typeLabel} `;

  if (payload.eventTitle && payload.type !== "meeting") {
    message += `(${payload.eventTitle}) `;
  }

  message += `has been scheduled for ${payload.date} from ${payload.fromTime.slice(0, 5)} to ${payload.toTime.slice(0, 5)} in Room ${payload.roomNo}.`;

  if (payload.meetingLink) {
    message += ` Link: ${payload.meetingLink}`;
  }

  await sendUniversalNotifications({
    userIds,
    title,
    message,
    type: "Announcement",
    referenceId: calendarEventId,
  });
}
