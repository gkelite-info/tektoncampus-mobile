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
  stats?: { present: number; total: number };
}

export async function getFacultyClasses(
  facultyId: number,
  dateStr?: string,
): Promise<ClassOption[]> {
  const targetDate = dateStr || new Date().toISOString().split("T")[0];

  const { data: events, error } = await supabase
    .from("calendar_event")
    .select(
      `
      calendarEventId, date, fromTime, toTime,
      subject:college_subjects (subjectName),
      topic:college_subject_unit_topics (topicTitle)
    `,
    )
    .eq("facultyId", facultyId)
    .eq("is_deleted", false)
    .eq("date", targetDate)
    .order("fromTime", { ascending: true });

  const { data: bulkEvents } = await supabase
    .from("bulk_calendar_event")
    .select(
      `
      bulkCalendarEventId, fromDate, toDate, fromTime, toTime,
      subject:college_subjects (subjectName)
    `,
    )
    .eq("facultyId", facultyId)
    .lte("fromDate", targetDate)
    .gte("toDate", targetDate)
    .is("deletedAt", null)
    .or("is_deleted.eq.false,is_deleted.is.null")
    .order("fromTime", { ascending: true });

  const isSunday = new Date(targetDate).getDay() === 0;
  const validBulkEvents = isSunday ? [] : (bulkEvents || []);

  const singleEventIds = (events || []).map((e: any) => e.calendarEventId);
  const bulkEventIds = validBulkEvents.map((e: any) => e.bulkCalendarEventId);

  const orConditions = [];
  if (singleEventIds.length > 0) orConditions.push(`calendarEventId.in.(${singleEventIds.join(",")})`);
  if (bulkEventIds.length > 0) orConditions.push(`bulkCalendarEventId.in.(${bulkEventIds.join(",")})`);

  let acceptedSessions: any[] = [];
  if (orConditions.length > 0) {
    const { data } = await supabase
      .from("faculty_class_sessions")
      .select("calendarEventId, bulkCalendarEventId, status, createdAt")
      .in("status", ["Accepted", "accepted"])
      .is("deletedAt", null)
      .or(orConditions.join(","));
    if (data) acceptedSessions = data;
  }

  const acceptedSingleEventIds = new Set(
    acceptedSessions
      .filter((s: any) => s.calendarEventId !== null)
      .map((s: any) => s.calendarEventId)
  );

  const filteredSingleEvents = (events || []).filter((e: any) =>
    acceptedSingleEventIds.has(e.calendarEventId)
  );

  const filteredBulkEvents = validBulkEvents.filter((e: any) => {
    return acceptedSessions.some((s: any) => {
      if (s.bulkCalendarEventId !== e.bulkCalendarEventId) return false;
      const recDate = new Date(s.createdAt);
      const recDateStr = `${recDate.getFullYear()}-${String(recDate.getMonth() + 1).padStart(2, "0")}-${String(recDate.getDate()).padStart(2, "0")}`;
      return recDateStr === targetDate;
    });
  });

  const allClasses: any[] = [];

  filteredSingleEvents.forEach((e: any) => {
    allClasses.push({ ...e, isBulk: false });
  });

  filteredBulkEvents.forEach((e: any) => {
    allClasses.push({ ...e, isBulk: true });
  });

  allClasses.sort((a, b) => (a.fromTime || "").localeCompare(b.fromTime || ""));

  return allClasses.map((e: any) => {
    const subj = Array.isArray(e.subject)
      ? e.subject[0]?.subjectName
      : e.subject?.subjectName || "No Subject";
    const topicObj = Array.isArray(e.topic) ? e.topic[0] : e.topic;
    const topic = topicObj?.topicTitle || "General Session";
    const time = e.fromTime ? e.fromTime.slice(0, 5) : "";

    const idStr = e.isBulk ? `bulk-${e.bulkCalendarEventId}_${targetDate.replace(/-/g, "_")}` : String(e.calendarEventId);
    const labelStr = e.isBulk ? `${time} • ${subj}` : `${time} • ${subj} • ${topic}`;

    return {
      id: idStr,
      label: labelStr,
    };
  });
}

export async function getClassSections(
  classId: string,
): Promise<SectionOption[]> {
  const isBulk = classId.startsWith("bulk-");
  const eventId = isBulk ? parseInt(classId.split("-")[1]) : parseInt(classId);

  const table = isBulk ? "bulk_calendar_event_sections" : "calendar_event_section";
  const column = isBulk ? "bulkCalendarEventId" : "calendarEventId";

  const { data: sections, error } = await supabase
    .from(table)
    .select(`collegeSectionId, section:college_sections (collegeSections)`)
    .eq(column, eventId);
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
  const isBulk = classId.startsWith("bulk-");
  let eventId: number;
  let sectionNameFilter: string | undefined;

  if (isBulk) {
    const parts = classId.split("-");
    // parts[0] is "bulk"
    // parts[1] is the rest. But wait, if section name has hyphens, parts will be larger.
    // The safest way is to replace the first "bulk-" and then split by "_"
    const restStr = classId.substring("bulk-".length);
    const subparts = restStr.split("_");
    eventId = parseInt(subparts[0]);
    
    // id format: bulk-{eventId}_{YYYY_MM_DD}_{sectionName}_{sectionIndex}
    // subparts: [eventId, YYYY, MM, DD, sectionName(s)..., sectionIndex]
    if (subparts.length > 5) {
      const sectionNameStr = subparts.slice(4, -1).join("_");
      sectionNameFilter = sectionNameStr !== "undefined" ? sectionNameStr : undefined;
    } else {
      sectionNameFilter = subparts[4] !== "undefined" ? subparts[4] : undefined;
    }
  } else {
    const parts = classId.split("-");
    eventId = parseInt(parts[0]);
    if (parts.length > 2) {
      const sectionNameStr = parts.slice(1, -1).join("-");
      sectionNameFilter = sectionNameStr !== "undefined" ? sectionNameStr : undefined;
    } else {
      sectionNameFilter = parts[1] !== "undefined" ? parts[1] : undefined;
    }
  }

  let targetSectionIds: number[] = [];
  let targetAcademicYearIds: number[] = [];

  if (sectionFilterId) {
    targetSectionIds = [parseInt(sectionFilterId)];
    if (isBulk) {
      const { data } = await supabase
        .from("bulk_calendar_event_sections")
        .select("collegeAcademicYearId")
        .eq("bulkCalendarEventId", eventId)
        .eq("collegeSectionId", parseInt(sectionFilterId));
      targetAcademicYearIds = data?.map(d => d.collegeAcademicYearId) || [];
    } else {
      const { data } = await supabase
        .from("calendar_event_section")
        .select("collegeAcademicYearId")
        .eq("calendarEventId", eventId)
        .eq("collegeSectionId", parseInt(sectionFilterId));
      targetAcademicYearIds = data?.map(d => d.collegeAcademicYearId) || [];
    }
  } else if (sectionNameFilter) {
    if (isBulk) {
       const { data: eventSections } = await supabase
        .from("bulk_calendar_event_sections")
        .select("collegeSectionId, collegeAcademicYearId")
        .eq("bulkCalendarEventId", eventId);
       if (eventSections && eventSections.length > 0) {
         const { data: sections } = await supabase.from("college_sections").select("collegeSectionsId").in("collegeSectionsId", eventSections.map(s => s.collegeSectionId)).eq("collegeSections", sectionNameFilter);
         targetSectionIds = sections?.map((s) => s.collegeSectionsId) || [];
         targetAcademicYearIds = eventSections.filter(s => targetSectionIds.includes(s.collegeSectionId)).map(s => s.collegeAcademicYearId);
       }    } else {
        const { data: eventSections } = await supabase
         .from("calendar_event_section")
         .select("collegeSectionId, collegeAcademicYearId")
         .eq("calendarEventId", eventId);
        if (eventSections && eventSections.length > 0) {
          const { data: sections } = await supabase.from("college_sections").select("collegeSectionsId").in("collegeSectionsId", eventSections.map(s => s.collegeSectionId)).eq("collegeSections", sectionNameFilter);
          targetSectionIds = sections?.map((s) => s.collegeSectionsId) || [];
          targetAcademicYearIds = eventSections.filter(s => targetSectionIds.includes(s.collegeSectionId)).map(s => s.collegeAcademicYearId);
        }
    }
  } else {
    if (isBulk) {
       const { data: eventSections } = await supabase
        .from("bulk_calendar_event_sections")
        .select("collegeSectionId, collegeAcademicYearId")
        .eq("bulkCalendarEventId", eventId);
       targetSectionIds = eventSections?.map((s) => s.collegeSectionId) || [];
       targetAcademicYearIds = eventSections?.map((s) => s.collegeAcademicYearId) || [];
    } else {
      const { data: eventSections } = await supabase
        .from("calendar_event_section")
        .select("collegeSectionId, collegeAcademicYearId")
        .eq("calendarEventId", eventId);
      targetSectionIds = eventSections?.map((s) => s.collegeSectionId) || [];
      targetAcademicYearIds = eventSections?.map((s) => s.collegeAcademicYearId) || [];
    }
  }

  if (targetSectionIds.length === 0) return [];

  let historyQuery = supabase
    .from("student_academic_history")
    .select("studentId")
    .in("collegeSectionsId", targetSectionIds)
    .eq("isCurrent", true);

  if (targetAcademicYearIds.length > 0) {
    historyQuery = historyQuery.in("collegeAcademicYearId", targetAcademicYearIds);
  }

  const { data: history } = await historyQuery;

  const ids = history?.map((h) => h.studentId) || [];
  if (ids.length === 0) return [];

  const { data: eventData } = await supabase
    .from(isBulk ? "bulk_calendar_event" : "calendar_event")
    .select(isBulk ? "subject, fromDate" : "subject, date")
    .eq(isBulk ? "bulkCalendarEventId" : "calendarEventId", eventId)
    .single();

  const eventDate = isBulk 
    ? new Date().toLocaleDateString("en-CA")
    : (eventData as any)?.date;

  const subjectId = eventData?.subject;
  const statsMap = new Map<number, { present: number; total: number }>();

  if (subjectId) {
    const { data: allRecords } = await supabase
      .from("attendance_record")
      .select(`studentId, status, event:calendar_event(subject), bulk_event:bulk_calendar_event(subject)`)
      .in("studentId", ids);
      
    allRecords?.forEach((r: any) => {
      const recSubjectId = r.event?.subject || r.bulk_event?.subject;
      if (recSubjectId === subjectId && ["PRESENT", "ABSENT", "LEAVE", "LATE"].includes(r.status)) {
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
      `studentId, user:users (fullName, gender, user_profile(profileUrl)), student_pins(pinNumber)`
    )
    .in("studentId", ids)
    .order("studentId");

  if (error) return [];

  const { data: attendanceRecords } = await supabase
    .from("attendance_record")
    .select("studentId, status, reason")
    .eq(isBulk ? "bulkCalendarEventId" : "calendarEventId", eventId)
    .eq("markedAt", eventDate)
    .in("studentId", ids);

  const attendanceMap = new Map();
  attendanceRecords?.forEach((r) => {
    attendanceMap.set(r.studentId, r);
  });

  return students!.map((s: any) => {
    const record = attendanceMap.get(s.studentId);
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
      stats: { present: stats.present, total: stats.total },
    };
  });
}

export async function saveAttendance(classId: string, payload: any[]) {
  const isBulk = classId.startsWith("bulk-");
  const eventId = parseInt(isBulk ? classId.split("-")[1].split("_")[0] : classId.split("-")[0]);

  const { data } = await supabase
    .from(isBulk ? "bulk_calendar_event" : "calendar_event")
    .select(isBulk ? "fromDate" : "date")
    .eq(isBulk ? "bulkCalendarEventId" : "calendarEventId", eventId)
    .single();

  let eventDate = isBulk 
    ? new Date().toLocaleDateString("en-CA")
    : (data as any)?.date;

  if (isBulk) {
    const parts = classId.split("-");
    const subparts = parts[1].split("_");
    if (subparts.length >= 4) {
      eventDate = `${subparts[1]}-${subparts[2]}-${subparts[3]}`;
    }
  }

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
        calendarEventId: isBulk ? null : eventId,
        bulkCalendarEventId: isBulk ? eventId : null,
        status: dbStatus,
        reason: p.reason || null,
        markedAt: eventDate,
        facultyMark: p.facultyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attendanceRecordId: undefined as number | undefined,
      };
    });

  if (dbRecords.length === 0) {
    return { success: true };
  }

  const studentIds = dbRecords.map((r) => r.studentId);
  const { data: existingRecords, error: fetchError } = await supabase
    .from("attendance_record")
    .select("attendanceRecordId, studentId")
    .in("studentId", studentIds)
    .eq(isBulk ? "bulkCalendarEventId" : "calendarEventId", eventId)
    .is("deletedAt", null);

  if (fetchError) {
    console.error("fetch existing records error:", fetchError);
    return { success: false, error: fetchError.message };
  }

  const recordMap = new Map(existingRecords?.map((r) => [r.studentId, r.attendanceRecordId]));
  const updates: any[] = [];
  const inserts: any[] = [];

  dbRecords.forEach((record) => {
    const existingId = recordMap.get(record.studentId);
    if (existingId) {
      record.attendanceRecordId = existingId;
      updates.push(record);
    } else {
      delete record.attendanceRecordId;
      inserts.push(record);
    }
  });

  if (updates.length > 0) {
    const { error: updateError } = await supabase
      .from("attendance_record")
      .upsert(updates);
    if (updateError) return { success: false, error: updateError.message };
  }

  if (inserts.length > 0) {
    const { error: insertError } = await supabase
      .from("attendance_record")
      .insert(inserts);
    if (insertError) return { success: false, error: insertError.message };
  }

  return { success: true };
}

export async function handleMissionClassStatus(
  classIdStr: string,
  facultyId: number,
  status: "Accepted" | "Cancel" | "Scheduled",
  reason?: string,
  collegeId?: number,
) {
  const isBulk = classIdStr.startsWith("bulk-");
  const eventId = parseInt(isBulk ? classIdStr.split("-")[1].split("_")[0] : classIdStr.split("-")[0]);
  const timeNow = new Date().toTimeString().split(" ")[0];

  let query = supabase
    .from("faculty_class_sessions")
    .select("facultyClassSessionsId")
    .eq("facultyId", facultyId)
    .is("deletedAt", null);

  let targetDateStr = new Date().toISOString().split("T")[0];
  if (isBulk) {
    const parts = classIdStr.split("-")[1].split("_");
    if (parts.length >= 4) {
      targetDateStr = `${parts[1]}-${parts[2]}-${parts[3]}`;
    }
  }

  if (isBulk) {
    query = query
      .eq("bulkCalendarEventId", eventId)
      .gte("createdAt", `${targetDateStr}T00:00:00.000Z`)
      .lte("createdAt", `${targetDateStr}T23:59:59.999Z`);
  } else {
    query = query.eq("calendarEventId", eventId);
  }

  const { data: existingSessions } = await query;

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
        status: status.toLowerCase(),
        acceptedAt: status === "Accepted" ? timeNow : undefined,
        updatedAt: new Date().toISOString(),
      })
      .eq("facultyClassSessionsId", primary.facultyClassSessionsId);
  } else {
    await supabase.from("faculty_class_sessions").insert({
      calendarEventId: isBulk ? null : eventId,
      bulkCalendarEventId: isBulk ? eventId : null,
      facultyId: facultyId,
      status: status.toLowerCase(),
      acceptedAt: status === "Accepted" ? timeNow : "00:00:00",
      createdAt: isBulk ? `${targetDateStr}T${new Date().toISOString().split("T")[1]}` : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  if (status === "Cancel") {
    const { data: eventData } = await supabase
      .from(isBulk ? "bulk_calendar_event" : "calendar_event")
      .select(isBulk ? "fromDate" : "date")
      .eq(isBulk ? "bulkCalendarEventId" : "calendarEventId", eventId)
      .single();
      
    const eventDate = isBulk ? (eventData as any)?.fromDate : (eventData as any)?.date;

    const { data: sections } = await supabase
      .from(isBulk ? "bulk_calendar_event_sections" : "calendar_event_section")
      .select("collegeSectionId")
      .eq(isBulk ? "bulkCalendarEventId" : "calendarEventId", eventId);

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
          calendarEventId: isBulk ? null : eventId,
          bulkCalendarEventId: isBulk ? eventId : null,
          status: "CLASS_CANCEL",
          reason: reason || "Cancelled by faculty",
          markedAt: eventDate,
          facultyMark: facultyId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        await supabase.from("attendance_record").upsert(attendanceRecords, {
          onConflict: isBulk ? "studentId,bulkCalendarEventId" : "studentId,calendarEventId",
        });
      }
    }
  }

  return { success: true };
}
