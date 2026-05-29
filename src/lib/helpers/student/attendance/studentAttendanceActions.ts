import { supabase } from "@/lib/supabaseClient";
import { buildStudentAttendancePolicyInsight, StudentAttendancePolicyInsight } from "./studentAttendancePolicyInsight";
import { fetchStudentContext } from "@/utils/context/student/studentContextAPI";
import { calculateAttendancePercentage } from "../../attendance/attendancePolicyMessage";

const ATTENDED_STATUSES = ["PRESENT", "LATE"] as const;
const CONDUCTED_STATUSES = ["PRESENT", "ABSENT", "LATE", "LEAVE"] as const;
const ELIGIBILITY_STATUSES = ["PRESENT", "ABSENT", "LATE"] as const;
const CANCELLED_STATUSES = ["CLASS_CANCEL", "CANCEL_CLASS"] as const;

function isAttendedStatus(status: string) {
    return (ATTENDED_STATUSES as readonly string[]).includes(status);
}

function isConductedStatus(status: string) {
    return (CONDUCTED_STATUSES as readonly string[]).includes(status);
}

function isEligibilityStatus(status: string) {
    return (ELIGIBILITY_STATUSES as readonly string[]).includes(status);
}

function isCancelledStatus(status: string) {
    return (CANCELLED_STATUSES as readonly string[]).includes(status);
}

function toDateKey(value: string) {
    return value.slice(0, 10);
}

function formatDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getWeekDateKeys(dateStr: string) {
    const date = new Date(`${dateStr}T00:00:00`);
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);

    return Array.from({ length: 6 }, (_, index) => {
        const dateKey = new Date(monday);
        dateKey.setDate(monday.getDate() + index);
        return formatDateKey(dateKey);
    });
}

export interface SubjectWiseStats {
    subjectId: number;
    subjectName: string;
    total: number;
    attended: number;
    missed: number;
    leave: number;
    percentage: number;
}

export interface StudentAttendanceTableRow {
    subject: string;
    faculty: string;
    status: string;
    classAttendance: string;
    percentage: string;
}

export interface StudentDashboardResponse {
    todayStats: {
        attended: number;
        total: number;
    };
    cards: {
        attended: number;
        totalClasses: number;
        percentage: number;
    };
    semesterStats: {
        present: number;
        absent: number;
        leave: number;
    };
    tableData: StudentAttendanceTableRow[];
    totalCount: number;
    subjectWiseStats: SubjectWiseStats[];
    weeklyData: number[];
    attendancePolicyInsight: StudentAttendancePolicyInsight;
}

export async function getStudentDashboardData(
    userId: number,
    dateStr: string,
    page: number,
    limit: number,
    isInter: boolean = false,
): Promise<StudentDashboardResponse> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const ctx = await fetchStudentContext(userId);
    const {
        studentId,
        collegeId,
        collegeEducationId,
        collegeBranchId,
        collegeAcademicYearId,
        collegeSemesterId,
        collegeSectionsId,
    } = ctx;

    let sahQuery = supabase
        .from("student_academic_history")
        .select("studentId")
        .eq("collegeAcademicYearId", collegeAcademicYearId)
        .eq("collegeSectionsId", collegeSectionsId)
        .eq("isCurrent", true)
        .is("deletedAt", null);

    if (!isInter && collegeSemesterId) {
        sahQuery = sahQuery.eq("collegeSemesterId", collegeSemesterId);
    }

    const { data: sahRows, error: sahErr } = await sahQuery;
    if (sahErr) throw sahErr;

    const sahStudentIds = (sahRows ?? []).map((r) => r.studentId);
    if (!sahStudentIds.length) return emptyDashboard();

    const { data: classStudents, error: classErr } = await supabase
        .from("students")
        .select("studentId")
        .in("studentId", sahStudentIds)
        .eq("collegeId", collegeId)
        .eq("collegeEducationId", collegeEducationId)
        .eq("collegeBranchId", collegeBranchId)
        .is("deletedAt", null);

    if (classErr) throw classErr;

    const classStudentIds = (classStudents ?? []).map((s) => s.studentId);
    if (!classStudentIds.length) return emptyDashboard();

    const weekDateKeys = getWeekDateKeys(dateStr);
    const weekStartDate = weekDateKeys[0] ?? dateStr;

    const { data: todayAll, error: todayErr } = await supabase
        .from("attendance_record")
        .select("studentId, calendarEventId, status")
        .in("studentId", classStudentIds)
        .eq("markedAt", dateStr);

    if (todayErr) throw todayErr;

    const { data: semAll, error: semErr } = await supabase
        .from("attendance_record")
        .select("studentId, calendarEventId, status, markedAt")
        .in("studentId", classStudentIds)
        .lte("markedAt", dateStr);

    if (semErr) throw semErr;

    const { data: weekAll, error: weekErr } = await supabase
        .from("attendance_record")
        .select("studentId, calendarEventId, status, markedAt")
        .in("studentId", classStudentIds)
        .gte("markedAt", weekStartDate)
        .lte("markedAt", dateStr);

    if (weekErr) throw weekErr;

    const eventIds = [
        ...new Set(
            [...(semAll ?? []), ...(weekAll ?? [])].map((r) => r.calendarEventId),
        ),
    ];

    const { data: events, error: eventErr } = await supabase
        .from("calendar_event")
        .select("calendarEventId, subject, facultyId")
        .in("calendarEventId", eventIds)
        .eq("is_deleted", false);

    if (eventErr) throw eventErr;

    const eventMap = new Map((events ?? []).map((e) => [e.calendarEventId, e]));

    const subjectIds = [
        ...new Set((events ?? []).map((e) => e.subject).filter(Boolean)),
    ];

    const { data: subjects } = await supabase
        .from("college_subjects")
        .select("collegeSubjectId, subjectName")
        .eq("collegeId", collegeId)
        .in("collegeSubjectId", subjectIds);

    const subjectMap = new Map(
        (subjects ?? []).map((s) => [s.collegeSubjectId, s.subjectName]),
    );

    const facultyIds = [...new Set((events ?? []).map((e) => e.facultyId))];
    const { data: faculty } = await supabase
        .from("faculty")
        .select("facultyId, fullName")
        .eq("collegeId", collegeId)
        .in("facultyId", facultyIds);

    const facultyMap = new Map(
        (faculty ?? []).map((f) => [f.facultyId, f.fullName]),
    );

    const semesterConductedSet = new Set<number>();
    const eligibilityConductedSet = new Set<number>();
    const eligibilityAttendedSet = new Set<number>();

    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;

    for (const r of semAll ?? []) {
        const ev = eventMap.get(r.calendarEventId);
        if (!ev || isCancelledStatus(r.status)) continue;

        if (isConductedStatus(r.status)) {
            semesterConductedSet.add(r.calendarEventId);
        }

        if (r.studentId === studentId) {
            if (isEligibilityStatus(r.status)) {
                eligibilityConductedSet.add(r.calendarEventId);
            }

            if (isAttendedStatus(r.status)) {
                eligibilityAttendedSet.add(r.calendarEventId);
            }

            if (r.status === "PRESENT" || r.status === "LATE") presentCount++;
            else if (r.status === "ABSENT") absentCount++;
            else if (r.status === "LEAVE") leaveCount++;
        }
    }

    const semesterConducted = semesterConductedSet.size;
    const eligibilityConducted = eligibilityConductedSet.size;
    const eligibilityAttended = eligibilityAttendedSet.size;

    let presentPercent = 0;
    let absentPercent = 0;
    let leavePercent = 0;

    if (semesterConducted > 0) {
        presentPercent = Math.round((presentCount / semesterConducted) * 100);
        absentPercent = Math.round((absentCount / semesterConducted) * 100);
        leavePercent = Math.round((leaveCount / semesterConducted) * 100);
    }

    const subjectWiseMap: Record<
        number,
        {
            total: Set<number>;
            attended: Set<number>;
            missed: Set<number>;
            leave: Set<number>;
        }
    > = {};

    for (const r of semAll ?? []) {
        const ev = eventMap.get(r.calendarEventId);
        if (!ev || !ev.subject || isCancelledStatus(r.status)) continue;

        if (!subjectWiseMap[ev.subject]) {
            subjectWiseMap[ev.subject] = {
                total: new Set(),
                attended: new Set(),
                missed: new Set(),
                leave: new Set(),
            };
        }

        if (isConductedStatus(r.status)) {
            subjectWiseMap[ev.subject].total.add(r.calendarEventId);
        }

        if (r.studentId === studentId) {
            if (isAttendedStatus(r.status)) {
                subjectWiseMap[ev.subject].attended.add(r.calendarEventId);
            } else if (r.status === "ABSENT") {
                subjectWiseMap[ev.subject].missed.add(r.calendarEventId);
            } else if (r.status === "LEAVE") {
                subjectWiseMap[ev.subject].leave.add(r.calendarEventId);
            }
        }
    }

    const subjectWiseStats = Object.entries(subjectWiseMap).map(
        ([subjectId, s]) => {
            const total = s.total.size;
            const attended = s.attended.size;
            const missed = s.missed.size;
            const leave = s.leave.size;
            return {
                subjectId: Number(subjectId),
                subjectName: subjectMap.get(Number(subjectId)) ?? "Unknown",
                total,
                attended,
                missed,
                leave,
                percentage: calculateAttendancePercentage(attended, total),
            };
        },
    );

    const todayStudentRows = (todayAll ?? []).filter(
        (r) => r.studentId === studentId,
    );
    const todayConductedSet = new Set<number>();
    const todayAttendedSet = new Set<number>();

    for (const r of todayAll ?? []) {
        const ev = eventMap.get(r.calendarEventId);
        if (!ev || isCancelledStatus(r.status)) continue;

        if (isConductedStatus(r.status)) {
            todayConductedSet.add(r.calendarEventId);
        }

        if (r.studentId === studentId && isAttendedStatus(r.status)) {
            todayAttendedSet.add(r.calendarEventId);
        }
    }

    const tableData = todayStudentRows.map((row) => {
        const ev = eventMap.get(row.calendarEventId);

        if (
            !ev?.subject ||
            row.status === "CLASS_CANCEL" ||
            row.status === "CANCEL_CLASS"
        ) {
            return {
                subject: ev?.subject
                    ? (subjectMap.get(ev.subject) ?? "Unknown")
                    : "Meeting / Other",
                faculty: ev?.facultyId
                    ? (facultyMap.get(ev.facultyId) ?? "Unknown")
                    : "Unknown",
                status: row.status,
                classAttendance: "0/0",
                percentage: "0%",
            };
        }

        const semStats = subjectWiseMap[ev.subject];
        const total = semStats?.total.size ?? 0;
        const attended = semStats?.attended.size ?? 0;

        return {
            subject: subjectMap.get(ev.subject) ?? "Unknown",
            faculty: facultyMap.get(ev.facultyId) ?? "Unknown",
            status: row.status,
            classAttendance: `${attended}/${total}`,
            percentage: `${calculateAttendancePercentage(attended, total)}%`,
        };
    });

    const paginatedRows = tableData.slice(from, to + 1);
    const weeklyStats = weekDateKeys.map((dayKey) => {
        const conductedSet = new Set<number>();
        const attendedSet = new Set<number>();

        for (const r of weekAll ?? []) {
            if (toDateKey(r.markedAt) !== dayKey) continue;

            const ev = eventMap.get(r.calendarEventId);
            if (!ev || isCancelledStatus(r.status)) continue;

            if (isConductedStatus(r.status)) {
                conductedSet.add(r.calendarEventId);
            }

            if (r.studentId === studentId && isAttendedStatus(r.status)) {
                attendedSet.add(r.calendarEventId);
            }
        }

        return calculateAttendancePercentage(attendedSet.size, conductedSet.size);
    });
    const attendancePolicyInsight = await buildStudentAttendancePolicyInsight({
        userId,
        context: ctx,
        attendedClasses: eligibilityAttended,
        totalClasses: eligibilityConducted,
    });

    return {
        todayStats: {
            attended: todayAttendedSet.size,
            total: todayConductedSet.size,
        },
        cards: {
            attended: eligibilityAttended,
            totalClasses: eligibilityConducted,
            percentage: calculateAttendancePercentage(
                eligibilityAttended,
                eligibilityConducted,
            ),
        },
        semesterStats: {
            present: presentPercent,
            absent: absentPercent,
            leave: leavePercent,
        },
        tableData: paginatedRows,
        totalCount: tableData.length,
        subjectWiseStats,
        weeklyData: weeklyStats,
        attendancePolicyInsight,
    };
}

function emptyDashboard() {
    return {
        todayStats: { attended: 0, total: 0 },
        cards: { attended: 0, totalClasses: 0, percentage: 0 },
        semesterStats: { present: 0, absent: 0, leave: 0 },
        tableData: [],
        totalCount: 0,
        subjectWiseStats: [],
        weeklyData: [0, 0, 0, 0, 0, 0, 0],
        attendancePolicyInsight: {
            minAttendance: 75,
            percentage: 0,
            classesNeeded: 0,
            message:
                "Student's minimum attendance is 75%. No attendance records yet. Start tracking from the next class.",
        },
    };
}
