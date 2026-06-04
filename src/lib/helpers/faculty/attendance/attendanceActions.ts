import { supabase } from "@/lib/supabaseServer";
import { calculateAttendancePercentage } from "@/lib/helpers/attendance/attendancePolicyMessage";

export interface ClassOption {
  id: string;
  label: string;
}

export interface SectionOption {
  id: string;
  name: string;
}

export interface UIStudent {
  id: string;
  name: string;
  roll: string;
  photo?: string;
  percentage: string;
  attendance:
  | "Not Marked"
  | "Present"
  | "Absent"
  | "Leave"
  | "Late"
  | "Class Cancel";
  reason: string;
}

export async function getFacultyClasses(
  facultyId: number,
): Promise<ClassOption[]> {
  const today = new Date().toISOString().split("T")[0];

  const { data: events, error } = await supabase
    .from("calendar_event")
    .select(
      `
      calendarEventId,
      date,
      fromTime,
      toTime,
      subject:college_subjects (subjectName),
      topic:college_subject_unit_topics (topicTitle),
      faculty_class_sessions!inner(status) 
    `,
    )
    .eq("facultyId", facultyId)
    .eq("is_deleted", false)
    .eq("date", today)
    .eq("faculty_class_sessions.status", "Accepted") // <-- STRICT FILTER ADDED
    .order("fromTime", { ascending: true });

  if (error) return [];

  return events.map((e: any) => {
    const subj = Array.isArray(e.subject)
      ? e.subject[0]?.subjectName
      : e.subject?.subjectName || "No Subject";
    const topicObj = Array.isArray(e.topic) ? e.topic[0] : e.topic;
    const topic = topicObj?.topicTitle || "General Session";
    const time = e.fromTime ? e.fromTime.slice(0, 5) : "";

    return {
      id: String(e.calendarEventId),
      label: `${time} • ${subj} • ${topic}`,
    };
  });
}

export async function getClassSections(
  classId: string,
): Promise<SectionOption[]> {
  const { data: sections, error } = await supabase
    .from("calendar_event_section")
    .select(`collegeSectionId, section:college_sections (collegeSections)`)
    .eq("calendarEventId", classId);
  if (error) return [];
  const unique = new Map();
  sections.forEach((s: any) => {
    const name = Array.isArray(s.section)
      ? s.section[0]?.collegeSections
      : s.section?.collegeSections;
    if (!unique.has(s.collegeSectionId))
      unique.set(s.collegeSectionId, {
        id: String(s.collegeSectionId),
        name: name || "Unknown",
      });
  });
  return Array.from(unique.values());
}

export async function getStudentsForClass(
  classId: string,
  sectionFilterId?: string,
): Promise<UIStudent[]> {
  const [eventIdStr, sectionNameFilter] = classId.split("-");
  const eventId = parseInt(eventIdStr);

  let targetSectionIds: number[] = [];

  if (sectionFilterId) {
    targetSectionIds = [parseInt(sectionFilterId)];
  } else if (sectionNameFilter) {
    const { data: eventSections } = await supabase
      .from("calendar_event_section")
      .select("collegeSectionId, college_sections!inner(collegeSections)")
      .eq("calendarEventId", eventId)
      .eq("college_sections.collegeSections", sectionNameFilter);

    targetSectionIds = eventSections?.map((s) => s.collegeSectionId) || [];
  } else {
    const { data: eventSections } = await supabase
      .from("calendar_event_section")
      .select("collegeSectionId")
      .eq("calendarEventId", eventId);
    targetSectionIds = eventSections?.map((s) => s.collegeSectionId) || [];
  }

  if (targetSectionIds.length === 0) return [];

  const { data: history } = await supabase
    .from("student_academic_history")
    .select("studentId")
    .in("collegeSectionsId", targetSectionIds)
    .eq("isCurrent", true);

  const ids = history?.map((h) => h.studentId) || [];
  if (ids.length === 0) return [];

  const { data: eventData } = await supabase
    .from("calendar_event")
    .select("subject")
    .eq("calendarEventId", eventId)
    .single();

  const subjectId = eventData?.subject;
  const statsMap = new Map<number, { present: number; total: number }>();

  if (subjectId) {
    const { data: allRecords } = await supabase
      .from("attendance_record")
      .select(`studentId, status, event:calendar_event!inner(subject)`)
      .in("studentId", ids)
      .eq("event.subject", subjectId);

    allRecords?.forEach((r: any) => {
      if (["PRESENT", "ABSENT", "LEAVE", "LATE"].includes(r.status)) {
        const s = statsMap.get(r.studentId) || { present: 0, total: 0 };
        s.total++;
        if (r.status === "PRESENT" || r.status === "LATE") s.present++;
        statsMap.set(r.studentId, s);
      }
    });
  }

  const { data: students, error } = await supabase
    .from("students")
    .select(
      `studentId, user:users (fullName, gender, user_profile(profileUrl)), student_pins(pinNumber), attendance_record (status, reason, calendarEventId)`,
    )
    .in("studentId", ids)
    .eq("attendance_record.calendarEventId", eventId)
    .order("studentId");

  if (error) return [];

  return students!.map((s: any) => {
    const record = s.attendance_record?.[0];
    let status = "Not Marked";
    let reason = "";
    if (record) {
      switch (record.status) {
        case "PRESENT":
          status = "Present";
          break;
        case "ABSENT":
          status = "Absent";
          break;
        case "LEAVE":
          status = "Leave";
          break;
        case "LATE":
          status = "Late";
          break;
        case "CLASS_CANCEL":
        case "CANCELLED":
        case "CANCEL_CLASS":
          status = "Class Cancel";
          break;
        default:
          status = "Present";
      }
      reason = record.reason || "";
    }
    const stats = statsMap.get(s.studentId) || { present: 0, total: 0 };
    const pct = calculateAttendancePercentage(stats.present, stats.total);
    const userGender = s.user?.gender || "Male";

    const profileUrl = Array.isArray(s.user?.user_profile)
      ? s.user.user_profile[0]?.profileUrl
      : s.user?.user_profile?.profileUrl;

    const pin = Array.isArray(s.student_pins)
      ? s.student_pins[0]?.pinNumber
      : s.student_pins?.pinNumber;


    return {
      id: String(s.studentId),
      name: s.user?.fullName || `Student ${s.studentId}`,
      roll: pin || String(s.studentId),
      photo: profileUrl,
      percentage: `${pct}%`,
      attendance: status as any,
      reason: reason,
    };
  });
}

export async function saveAttendance(classId: string, payload: any[]) {
  const eventId = parseInt(classId.split("-")[0]);

  const { data } = await supabase
    .from("calendar_event")
    .select("date")
    .eq("calendarEventId", eventId)
    .single();

  const dbRecords = payload
    .filter((p) => p.status !== "Not Marked")
    .map((p) => {
      let dbStatus = "PRESENT";
      if (p.status === "Absent") dbStatus = "ABSENT";
      else if (p.status === "Leave") dbStatus = "LEAVE";
      else if (p.status === "Late") dbStatus = "LATE";
      else if (p.status === "Class Cancel") dbStatus = "CLASS_CANCEL";

      return {
        studentId: parseInt(p.studentId),
        calendarEventId: eventId,
        status: dbStatus,
        reason: p.reason || null,
        markedAt: data?.date,
        facultyMark: p.facultyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

  const { error } = await supabase
    .from("attendance_record")
    .upsert(dbRecords, { onConflict: "studentId,calendarEventId" });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function handleMissionClassStatus(
  classIdStr: string,
  facultyId: number,
  status: "Accepted" | "Cancel" | "Scheduled",
  reason?: string,
) {
  const eventId = parseInt(classIdStr.split("-")[0]);
  const timeNow = new Date().toTimeString().split(" ")[0];

  const { data: existingSessions } = await supabase
    .from("faculty_class_sessions")
    .select("facultyClassSessionsId")
    .eq("calendarEventId", eventId)
    .eq("facultyId", facultyId)
    .is("deletedAt", null);

  if (existingSessions && existingSessions.length > 0) {
    const [primary, ...duplicates] = existingSessions;
    if (duplicates.length > 0) {
      await supabase
        .from("faculty_class_sessions")
        .delete()
        .in(
          "facultyClassSessionsId",
          duplicates.map((d) => d.facultyClassSessionsId),
        );
    }
    await supabase
      .from("faculty_class_sessions")
      .update({
        status: status,
        acceptedAt: status === "Accepted" ? timeNow : undefined,
        updatedAt: new Date().toISOString(),
      })
      .eq("facultyClassSessionsId", primary.facultyClassSessionsId);
  } else {
    await supabase.from("faculty_class_sessions").insert({
      calendarEventId: eventId,
      facultyId: facultyId,
      status: status,
      acceptedAt: status === "Accepted" ? timeNow : "00:00:00",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  if (status === "Cancel") {
    const { data: eventData } = await supabase
      .from("calendar_event")
      .select("date")
      .eq("calendarEventId", eventId)
      .single();
    const { data: sections } = await supabase
      .from("calendar_event_section")
      .select("collegeSectionId")
      .eq("calendarEventId", eventId);

    const sectionIds = sections?.map((s) => s.collegeSectionId) || [];

    if (sectionIds.length > 0) {
      const { data: history } = await supabase
        .from("student_academic_history")
        .select("studentId")
        .in("collegeSectionsId", sectionIds)
        .eq("isCurrent", true);

      const studentIds = history?.map((h) => h.studentId) || [];

      if (studentIds.length > 0) {
        const attendanceRecords = studentIds.map((sId) => ({
          studentId: sId,
          calendarEventId: eventId,
          status: "CLASS_CANCEL",
          reason: reason || "Cancelled by faculty",
          markedAt: eventData?.date,
          facultyMark: facultyId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        await supabase.from("attendance_record").upsert(attendanceRecords, {
          onConflict: "studentId,calendarEventId",
        });
      }
    }
  }

  return { success: true };
}
