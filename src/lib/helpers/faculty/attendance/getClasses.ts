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
  year: number;
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

  const { data: events, error: eventsError } = await supabase
    .from("calendar_event")
    .select(
      `
      calendarEventId,
      date,
      fromTime,
      toTime,
      roomNo,
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
),
      
      faculty_class_sessions (status) 
    `,
    )
    .eq("facultyId", faculty.facultyId)
    .eq("type", "class")
    .eq("date", today)
    .eq("is_deleted", false)
    .is("deletedAt", null)
    .order("date", { ascending: true })
    .order("fromTime", { ascending: true });

  if (eventsError) return [];
  if (!events || events.length === 0) return [];

  return events.flatMap((event: any) => {
    const sectionsData = (event.calendar_event_section || []).filter(
      (s: any) => s.isActive === true && s.deletedAt === null,
    );

    const sessionRecords = event.faculty_class_sessions || [];
    sessionRecords.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const sessionStatus =
      sessionRecords.length > 0 ? sessionRecords[0].status : "Scheduled";

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
        "B.Tech",
      );
      const yearString = safeGet(
        sectionRow.yearData,
        "collegeAcademicYear",
        "1",
      );
      const year = parseInt(yearString) || 1;
      const subjectName = safeGet(
        event.subjectData,
        "subjectName",
        "Unknown Subject",
      );
      const topicTitle = safeGet(event.topicData, "topicTitle");

      return {
        id: `${event.calendarEventId}-${sectionRow.section?.collegeSections ?? sectionIndex}-${sectionIndex}`,
        title: subjectName,
        description: topicTitle || "Class",
        fromTime: convertTo12HourFormat(event.fromTime),
        toTime: convertTo12HourFormat(event.toTime),
        date: formatDate(event.date),
        roomNo: event.roomNo,
        section: sectionRow.section?.collegeSections,
        semester: [semester],
        department: [{ name: department }],
        degree,
        year,
        sessionStatus, 
      };
    });
  });
}
