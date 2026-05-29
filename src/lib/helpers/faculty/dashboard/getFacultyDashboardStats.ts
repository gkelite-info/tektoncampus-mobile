import { supabase } from "@/lib/supabaseServer";

export async function getFacultyDashboardStats(facultyId: number) {
  const today = new Date().toISOString().split("T")[0];

  let totalClasses = 0,
    acceptedClasses = 0;
  let totalHours = 0,
    acceptedHours = 0;
  let totalStudents = 0,
    presentStudents = 0;
  let totalLessons = 0,
    completedLessons = 0;

  const { data: events } = await supabase
    .from("calendar_event")
    .select(
      `
      calendarEventId, fromTime, toTime,
      faculty_class_sessions ( status ),
      calendar_event_section ( collegeSectionId )
    `,
    )
    .eq("facultyId", facultyId)
    .eq("type", "class")
    .gte("date", today)
    .eq("is_deleted", false)
    .is("deletedAt", null);

  const eventIds: number[] = [];
  const sectionIds = new Set<number>();

  if (events) {
    for (const ev of events) {
      totalClasses++;
      eventIds.push(ev.calendarEventId);

      const from = new Date(`1970-01-01T${ev.fromTime}Z`);
      const to = new Date(`1970-01-01T${ev.toTime}Z`);
      const duration = Math.max(
        0,
        (to.getTime() - from.getTime()) / (1000 * 60 * 60),
      );

      totalHours += duration;

      const sessions = Array.isArray(ev.faculty_class_sessions)
        ? ev.faculty_class_sessions
        : [ev.faculty_class_sessions];
      const isAccepted = sessions[0]?.status === "Accepted";

      if (isAccepted) {
        acceptedClasses++;
        acceptedHours += duration;
      }

      const evSections = Array.isArray(ev.calendar_event_section)
        ? ev.calendar_event_section
        : [];
      evSections.forEach((sec: any) => {
        if (sec?.collegeSectionId) sectionIds.add(sec.collegeSectionId);
      });
    }
  }

  if (sectionIds.size > 0) {
    const sectionStudentCounts: Record<number, number> = {};
    const { data: history } = await supabase
      .from("student_academic_history")
      .select("collegeSectionsId")
      .in("collegeSectionsId", Array.from(sectionIds))
      .eq("isCurrent", true);

    if (history) {
      history.forEach((h: any) => {
        sectionStudentCounts[h.collegeSectionsId] =
          (sectionStudentCounts[h.collegeSectionsId] || 0) + 1;
      });
    }

    if (events) {
      for (const ev of events) {
        const evSections = Array.isArray(ev.calendar_event_section)
          ? ev.calendar_event_section
          : [];
        let evStudentCount = 0;
        evSections.forEach((sec: any) => {
          if (sec?.collegeSectionId)
            evStudentCount += sectionStudentCounts[sec.collegeSectionId] || 0;
        });
        totalStudents += evStudentCount;
      }
    }
  }

  if (eventIds.length > 0) {
    const { data: attendance } = await supabase
      .from("attendance_record")
      .select("attendanceRecordId")
      .in("calendarEventId", eventIds)
      .in("status", ["PRESENT", "LATE"]);

    if (attendance) presentStudents = attendance.length;
  }

  const { data: facultySections } = await supabase
    .from("faculty_sections")
    .select("collegeSubjectId")
    .eq("facultyId", facultyId)
    .is("deletedAt", null);

  const subjectIds = [
    ...new Set(facultySections?.map((fs: any) => fs.collegeSubjectId) || []),
  ];

  if (subjectIds.length > 0) {
    const { data: topics } = await supabase
      .from("college_subject_unit_topics")
      .select("isCompleted")
      .in("collegeSubjectId", subjectIds)
      .eq("isActive", true);

    if (topics) {
      totalLessons = topics.length;
      completedLessons = topics.filter((t: any) => t.isCompleted === true).length;
    }
  }

  return {
    totalClasses,
    acceptedClasses,
    totalHours: Math.round(totalHours),
    acceptedHours: Math.round(acceptedHours),
    totalStudents,
    presentStudents,
    totalLessons,
    completedLessons,
  };
}
