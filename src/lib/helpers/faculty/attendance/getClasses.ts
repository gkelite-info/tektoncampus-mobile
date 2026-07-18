import { supabase } from "@/lib/supabaseServer";

export interface UpcomingLesson {
  id: string;
  title: string;
  description: string;
  fromTime: string;
  toTime: string;
  section?: string;
  date?: string;
  roomNo?: string;
  semester: string[];
  department: { name: string }[];
  sessionStatus?: "Scheduled" | "Accepted" | "Cancel";
  degree: string;
  year: number | string;
}

function convertTo12HourFormat(time: string): string {
  if (!time) return "";
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hour, minute);
  const hours12 = date.getHours() % 12 || 12;
  const ampm = date.getHours() >= 12 ? "PM" : "AM";
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours12}:${minutes} ${ampm}`;
}

function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  const suffix = (d: number) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };
  return `${day}${suffix(day)} ${month} ${year}`;
}

function safeGet(data: any, key: string, fallback: string = ""): string {
  if (!data) return fallback;
  if (Array.isArray(data)) {
    return data[0]?.[key] || fallback;
  }
  return data?.[key] || fallback;
}

export async function getUpcomingClasses(
  userId: number,
): Promise<UpcomingLesson[]> {
  const { data: faculty, error: facultyError } = await supabase
    .from("faculty")
    .select("facultyId")
    .eq("userId", userId)
    .single();

  if (facultyError || !faculty) {
    console.error("Faculty lookup failed", facultyError);
    return [];
  }

  const today = new Date().toISOString().split("T")[0];
  const endDateStr = today;

  const { data: events, error: eventsError } = await supabase
    .from("calendar_event")
    .select(
      `
      calendarEventId,
      date,
      fromTime,
      toTime,
      collegeRoomId,
      college_rooms (roomNo),
      type,

      topicData:college_subject_unit_topics (topicTitle),
      subjectData:college_subjects (subjectName, subjectCode),

      calendar_event_section (
        isActive,
        deletedAt,
        section:college_sections (collegeSections),
        branch:college_branch (collegeBranchCode),
        yearData:college_academic_year (collegeAcademicYear),
        semester:college_semester (collegeSemester),
        education:college_education (collegeEducationType)
      )
    `,
    )
    .eq("facultyId", faculty.facultyId)
    .eq("type", "class")
    .gte("date", today)
    .lte("date", endDateStr)
    .is("deletedAt", null)
    .order("date", { ascending: true })
    .order("fromTime", { ascending: true });

  if (eventsError) {
    console.error("GET_UPCOMING_CLASSES_ERROR", eventsError);
    return [];
  }

  const { data: bulkEvents, error: bulkError } = await supabase
    .from("bulk_calendar_events")
    .select(
      `
      bulkCalendarEventId,
      fromDate,
      toDate,
      fromTime,
      toTime,
      collegeRoomId,
      college_rooms (roomNo),
      type,

      subjectData:college_subjects (subjectName, subjectCode),

      bulk_calendar_event_sections (
        isActive,
        deletedAt,
        collegeSectionId,
        collegeBranchId,
        collegeAcademicYearId,
        collegeSemesterId,
        collegeEducationId,
        section:college_sections (collegeSections),
        branch:college_branch (collegeBranchCode),
        yearData:college_academic_year (collegeAcademicYear),
        semester:college_semester (collegeSemester),
        education:college_education (collegeEducationType)
      )
    `
    )
    .eq("facultyId", faculty.facultyId)
    .eq("type", "class")
    .lte("fromDate", endDateStr)
    .gte("toDate", today)
    .is("deletedAt", null)
    .or("is_deleted.eq.false,is_deleted.is.null");

  if (bulkError) {
    console.error("GET_UPCOMING_BULK_CLASSES_ERROR", bulkError);
  }

  const validEvents = events || [];
  const isSunday = new Date(today).getDay() === 0;
  const validBulkEvents = isSunday ? [] : (bulkEvents || []);

  if (validEvents.length === 0 && validBulkEvents.length === 0) return [];

  const eventIds = validEvents.map((e: any) => e.calendarEventId);
  const bulkEventIds = validBulkEvents.map((e: any) => e.bulkCalendarEventId);

  const orConditions = [];
  if (eventIds.length > 0) orConditions.push(`calendarEventId.in.(${eventIds.join(",")})`);
  if (bulkEventIds.length > 0) orConditions.push(`bulkCalendarEventId.in.(${bulkEventIds.join(",")})`);

  let allSessionRecords: any[] = [];
  if (orConditions.length > 0) {
    const { data } = await supabase
      .from("faculty_class_sessions")
      .select("calendarEventId, bulkCalendarEventId, status, createdAt")
      .or(orConditions.join(","));
    if (data) allSessionRecords = data;
  }

  const singleSessionMap = new Map<number, any[]>();
  const bulkSessionMap = new Map<number, any[]>();

  allSessionRecords.forEach((record: any) => {
    if (record.calendarEventId) {
      const arr = singleSessionMap.get(record.calendarEventId) || [];
      arr.push(record);
      singleSessionMap.set(record.calendarEventId, arr);
    }
    if (record.bulkCalendarEventId) {
      const arr = bulkSessionMap.get(record.bulkCalendarEventId) || [];
      arr.push(record);
      bulkSessionMap.set(record.bulkCalendarEventId, arr);
    }
  });

  const singleMapped = validEvents.flatMap((event: any) => {
    const sectionsData = (event.calendar_event_section || []).filter(
      (s: any) => s.isActive === true && s.deletedAt === null,
    );

    const sessionRecords = singleSessionMap.get(event.calendarEventId) || [];
    sessionRecords.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const sessionStatusRaw =
      sessionRecords.length > 0 ? sessionRecords[0].status : "Scheduled";

    // Normalize status to capitalized format: Scheduled, Accepted, or Cancel
    let sessionStatus: "Scheduled" | "Accepted" | "Cancel" = "Scheduled";
    if (sessionStatusRaw) {
      const lower = sessionStatusRaw.toLowerCase();
      if (lower === "accepted") sessionStatus = "Accepted";
      else if (lower === "cancel" || lower === "cancelled") sessionStatus = "Cancel";
    }

    return sectionsData.map((sectionRow: any, sectionIndex: number) => {
      const department = safeGet(
        sectionRow.branch,
        "collegeBranchCode",
        "Unknown Branch",
      );
      const semester = `Sem ${safeGet(sectionRow.semester, "collegeSemester", "?")}`;
      const degree = safeGet(
        sectionRow.education,
        "collegeEducationType",
        "",
      );
      const yearString = safeGet(
        sectionRow.yearData,
        "collegeAcademicYear",
        "",
      );
      const year = yearString;
      const subjectName = safeGet(
        event.subjectData,
        "subjectName",
        "Unknown Subject",
      );
      const topicTitle = safeGet(event.topicData, "topicTitle");

      return {
        id: `${event.calendarEventId}-${safeGet(sectionRow.section, "collegeSections") || sectionIndex}-${sectionIndex}`,
        title: subjectName,
        description: topicTitle || "Class",
        fromTime: convertTo12HourFormat(event.fromTime),
        toTime: convertTo12HourFormat(event.toTime),
        date: formatDate(event.date),
        roomNo: safeGet(event.college_rooms, "roomNo"),
        section: safeGet(sectionRow.section, "collegeSections"),
        semester: [semester],
        department: [{ name: department }],
        degree,
        year,
        sessionStatus,
      };
    });
  });

  const bulkMapped = validBulkEvents.flatMap((event: any) => {
    const sectionsData = (event.bulk_calendar_event_sections || []).filter(
      (s: any) => s.isActive === true && s.deletedAt === null,
    );

    const sessionRecords = bulkSessionMap.get(event.bulkCalendarEventId) || [];
    sessionRecords.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return sectionsData.flatMap((sectionRow: any, sectionIndex: number) => {
      const department = safeGet(sectionRow.branch, "collegeBranchCode", "Unknown Branch");
      const semester = `Sem ${safeGet(sectionRow.semester, "collegeSemester", "?")}`;
      const degree = safeGet(sectionRow.education, "collegeEducationType", "");
      const yearString = safeGet(sectionRow.yearData, "collegeAcademicYear", "");
      const year = yearString;
      const sectionName = safeGet(sectionRow.section, "collegeSections", undefined);

      const subjectName = safeGet(
        event.subjectData,
        "subjectName",
        "Unknown Subject",
      );

      const occurrences = [];
      const eventStart = new Date(Math.max(new Date(event.fromDate).getTime(), new Date(today).getTime()));
      const eventEnd = new Date(Math.min(new Date(event.toDate).getTime(), new Date(endDateStr).getTime()));
      
      for (let d = new Date(eventStart); d <= eventEnd; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 0) continue; // Skip Sunday

        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        const daySession = sessionRecords.find((rec: any) => {
          const recDate = new Date(rec.createdAt);
          const recDateStr = `${recDate.getFullYear()}-${String(recDate.getMonth() + 1).padStart(2, "0")}-${String(recDate.getDate()).padStart(2, "0")}`;
          return recDateStr === dateStr;
        });

        const dayStatusRaw = daySession ? daySession.status : "scheduled";
        let dayStatus: "Scheduled" | "Accepted" | "Cancel" = "Scheduled";
        if (dayStatusRaw) {
          const lower = dayStatusRaw.toLowerCase();
          if (lower === "accepted") dayStatus = "Accepted";
          else if (lower === "cancel" || lower === "cancelled") dayStatus = "Cancel";
        }

        occurrences.push({
          id: `bulk-${event.bulkCalendarEventId}_${dateStr.replace(/-/g, "_")}_${sectionName ?? sectionIndex}_${sectionIndex}`,
          title: subjectName,
          description: "Class",
          fromTime: convertTo12HourFormat(event.fromTime),
          toTime: convertTo12HourFormat(event.toTime),
          date: formatDate(dateStr),
          roomNo: safeGet(event.college_rooms, "roomNo"),
          section: sectionName,
          semester: [semester],
          department: [{ name: department }],
          degree,
          year,
          sessionStatus: dayStatus,
        });
      }
      
      return occurrences;
    });
  });

  const merged = [...singleMapped, ...bulkMapped];
  merged.sort((a, b) => {
    const timeA = new Date(`2000-01-01 ${a.fromTime}`).getTime();
    const timeB = new Date(`2000-01-01 ${b.fromTime}`).getTime();
    return timeA - timeB;
  });

  return merged;
}

export async function getClassDetails(
  classId: string,
): Promise<UpcomingLesson | null> {
  const isBulk = classId.startsWith("bulk-");
  const eventId = isBulk
    ? parseInt(classId.split("-")[1].split("_")[0])
    : parseInt(classId.split("-")[0]);

  if (isBulk) {
    const { data: event, error } = await supabase
      .from("bulk_calendar_events")
      .select(
        `
        bulkCalendarEventId,
        fromDate,
        fromTime,
        toTime,
        collegeRoomId,
        college_rooms (roomNo),
        
        subjectData:college_subjects (subjectName),
        
        bulk_calendar_event_sections (
          collegeSectionId,
          collegeBranchId,
          collegeAcademicYearId,
          collegeSemesterId,
          collegeEducationId
        )
      `,
      )
      .eq("bulkCalendarEventId", eventId)
      .single();

    if (error || !event) {
      console.error("Error fetching details:", error);
      return null;
    }

    const sectionsData = event.bulk_calendar_event_sections || [];
    
    const enrichedSections = await Promise.all(
      sectionsData.map(async (sec: any) => {
        const [branchRes, semesterRes, educationRes, yearRes, sectionRes] = await Promise.all([
          supabase.from("college_branch").select("collegeBranchCode").eq("collegeBranchId", sec.collegeBranchId).single(),
          supabase.from("college_semester").select("collegeSemester").eq("collegeSemesterId", sec.collegeSemesterId).single(),
          supabase.from("college_education").select("collegeEducationType").eq("collegeEducationId", sec.collegeEducationId).single(),
          supabase.from("college_academic_year").select("collegeAcademicYear").eq("collegeAcademicYearId", sec.collegeAcademicYearId).single(),
          supabase.from("college_sections").select("collegeSections").eq("collegeSectionsId", sec.collegeSectionId).single()
        ]);
        return {
          branchCode: branchRes.data?.collegeBranchCode,
          semester: semesterRes.data?.collegeSemester,
          education: educationRes.data?.collegeEducationType,
          year: yearRes.data?.collegeAcademicYear,
          sectionName: sectionRes.data?.collegeSections,
        };
      })
    );

    const departments = Array.from(
      new Set(
        enrichedSections.map((s: any) => s.branchCode),
      ),
    ).filter(Boolean).map((name) => ({ name: name as string }));
    
    const semesters = Array.from(
      new Set(
        enrichedSections.map(
          (s: any) => `Sem ${s.semester}`,
        ),
      ),
    ).filter((s) => s !== "Sem undefined");
    
    const sectionNames = Array.from(
      new Set(
        enrichedSections.map((s: any) => s.sectionName),
      ),
    ).filter(Boolean).join(", ");

    const firstSection = enrichedSections[0];
    const degree = firstSection?.education || "";
    const yearString = firstSection?.year || "";
    const year = yearString;

    const subjectName = safeGet(
      event.subjectData,
      "subjectName",
      "Unknown Subject",
    );

    const description = `Class for ${sectionNames}`;

    let occurrenceDate = event.fromDate;
    const parts = classId.split("-");
    if (parts.length > 1) {
      const subparts = parts[1].split("_");
      if (subparts.length >= 4) {
        occurrenceDate = `${subparts[1]}-${subparts[2]}-${subparts[3]}`;
      }
    }

    return {
      id: classId,
      title: subjectName,
      description: description,
      fromTime: convertTo12HourFormat(event.fromTime),
      toTime: convertTo12HourFormat(event.toTime),
      date: formatDate(occurrenceDate),
      roomNo: safeGet(event.college_rooms, "roomNo"),
      section: sectionNames,
      semester: semesters as string[],
      department: departments,
      degree: degree,
      year: year,
    };
  }

  const { data: event, error } = await supabase
    .from("calendar_event")
    .select(
      `
      calendarEventId,
      date,
      fromTime,
      toTime,
      collegeRoomId,
      college_rooms (roomNo),
      
      topicData:college_subject_unit_topics (topicTitle),
      subjectData:college_subjects (subjectName),
      
      calendar_event_section (
        section:college_sections (collegeSections),
        branch:college_branch (collegeBranchCode),
        yearData:college_academic_year (collegeAcademicYear),
        semester:college_semester (collegeSemester),
        education:college_education (collegeEducationType)
      )
    `,
    )
    .eq("calendarEventId", eventId)
    .single();

  if (error || !event) {
    console.error("Error fetching details:", error);
    return null;
  }

  const sectionsData = event.calendar_event_section || [];

  const departments = Array.from(
    new Set(
      sectionsData.map((s: any) => safeGet(s.branch, "collegeBranchCode")),
    ),
  ).map((name) => ({ name: name as string }));
  const semesters = Array.from(
    new Set(
      sectionsData.map(
        (s: any) => `Sem ${safeGet(s.semester, "collegeSemester")}`,
      ),
    ),
  );
  const sectionNames = Array.from(
    new Set(
      sectionsData.map((s: any) => safeGet(s.section, "collegeSections")),
    ),
  ).join(", ");

  const firstSection = sectionsData[0];
  const degree = safeGet(
    firstSection?.education,
    "collegeEducationType",
    "",
  );
  const yearString = safeGet(firstSection?.yearData, "collegeAcademicYear", "");
  const year = yearString;

  const subjectName = safeGet(
    event.subjectData,
    "subjectName",
    "Unknown Subject",
  );

  const topicTitle = safeGet(event.topicData, "topicTitle");
  const description = topicTitle || `Class for ${sectionNames}`;

  return {
    id: event.calendarEventId.toString(),
    title: subjectName,
    description: description,
    fromTime: convertTo12HourFormat(event.fromTime),
    toTime: convertTo12HourFormat(event.toTime),
    date: formatDate(event.date),
    roomNo: safeGet(event.college_rooms, "roomNo"),
    section: sectionNames,
    semester: semesters as string[],
    department: departments,
    degree: degree,
    year: year,
  };
}
