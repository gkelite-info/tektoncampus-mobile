import { supabase } from "@/lib/supabaseClient";

export async function fetchUpcomingClassesForStudent(filters: {
    collegeEducationId: number | null;
    collegeBranchId: number | null;
    collegeAcademicYearId: number | null;
    collegeSemesterId: number | null;
    collegeSectionId: number | null;
}) {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
        .from("calendar_event")
        .select(
            `
      calendarEventId,
      type,
      date,
      fromTime,
      toTime,
      roomNo,
      meetingLink,
      faculty:facultyId ( fullName ),
      subject:subject ( subjectName ),
      topic:eventTopic ( topicTitle ),
      attendance_record (
        status
      ),
      sections:calendar_event_section (
        collegeEducationId,
        collegeBranchId,
        collegeAcademicYearId,
        collegeSemesterId,
        collegeSectionId
      )
    `,
        )
        .eq("is_deleted", false)
        .in("type", ["class", "meeting", "exam"])
        .eq("date", today)
        .order("date", { ascending: true })
        .order("fromTime", { ascending: true });

    if (error) {
        return [];
    }

    const filtered = (data ?? []).filter((event: any) =>
        event.sections?.some(
            (s: any) =>
                s.collegeEducationId === filters.collegeEducationId &&
                s.collegeBranchId === filters.collegeBranchId &&
                s.collegeAcademicYearId === filters.collegeAcademicYearId &&
                s.collegeSemesterId === filters.collegeSemesterId &&
                s.collegeSectionId === filters.collegeSectionId,
        ),
    );

    const mapped = filtered.map((item: any) => {
        const isMeeting = item.type === "meeting";
        const isExam = item.type === "exam";

        let title = "Class";
        if (isMeeting) title = "Meeting";
        if (isExam)
            title = item.subject?.subjectName
                ? `${item.subject.subjectName} (Exam)`
                : "Exam";
        if (!isMeeting && !isExam && item.subject?.subjectName)
            title = item.subject.subjectName;

        let topicDescription = "";
        if (isMeeting) {
            topicDescription = item.meetingLink
                ? "Online Meeting"
                : item.roomNo
                    ? `Room: ${item.roomNo}`
                    : "General Meeting";
        } else if (isExam) {
            topicDescription = item.roomNo
                ? `Room: ${item.roomNo}`
                : "Exam Location TBA";
        } else {
            topicDescription = item.topic?.topicTitle ?? "";
        }

        return {
            calendarEventId: item.calendarEventId,
            date: item.date,
            fromTime: item.fromTime.slice(0, 5),
            toTime: item.toTime.slice(0, 5),
            eventTitle: title,
            eventTopic: topicDescription,
            facultyName: item.faculty?.fullName ?? "Faculty",
            isCancelled: item.attendance_record?.some(
                (a: any) => a.status === "CLASS_CANCEL",
            ),
            type: item.type,
            meetingLink: item.meetingLink,
        };
    });

    return mapped;
}
