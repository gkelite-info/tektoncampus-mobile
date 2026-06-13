import { supabase } from "@/lib/supabaseClient";
import { fetchStudentContext } from "@/utils/context/student/studentContextAPI";
import { getAdminStudentProgressDetails } from "../../admin/studentProgress/getAdminStudentProgressDetails";

const ATTENDED_STATUSES = ["PRESENT", "LATE"] as const;
const CONDUCTED_STATUSES = ["PRESENT", "ABSENT", "LATE", "LEAVE"] as const;
const CANCELLED_STATUSES = ["CLASS_CANCEL", "CANCEL_CLASS"] as const;

type AttendanceRecordRow = {
    calendarEventId: number;
    status: string;
    calendar_event: {
        calendarEventId: number;
        subject: number | null;
        facultyId: number | null;
        type: string;
        date: string;
        is_deleted: boolean | null;
    } | null;
};

type SubjectRow = {
    collegeSubjectId: number;
    subjectName: string;
    subjectKey: string | null;
};

type AssignmentRow = {
    assignmentId: number;
    subjectId: number;
    topicName: string;
    submissionDeadlineInt: number;
    marks: number;
    dateAssignedInt: number;
    status: string | null;
};

type SubmissionRow = {
    assignmentId: number;
    feedback: string | null;
    marksScored: number | null;
    status: string | null;
};

type QuizRow = {
    quizId: number;
    collegeSubjectId: number;
    totalMarks: number;
};

type QuizSubmissionRow = {
    quizId: number;
    totalMarksObtained: number | null;
};

type FacultySectionRow = {
    facultyId: number;
    collegeSubjectId: number;
};

type DiscussionForumRow = {
    discussionId: number;
    createdBy: number | null;
};

type DiscussionSectionRow = {
    discussionId: number;
    collegeSectionsId: number;
    marks: number | null;
};

type DiscussionUploadRow = {
    discussionId: number;
    marksObtained: number | null;
};

type WeightageConfigRow = {
    collegeSubjectId: number;
    collegeSectionsId?: number | null;
    collegeSemesterId?: number | null;
    faculty_weightage_items:
    | {
        label: string;
        percentage: number;
    }[]
    | {
        label: string;
        percentage: number;
    }
    | null;
};

type ProgressWeights = {
    attendance: number;
    assignments: number;
    quiz: number;
    discussion: number;
};

function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatIntDate(dateInt: number) {
    if (!dateInt) return "-";

    const raw = String(dateInt);
    if (raw.length !== 8) return "-";

    const year = Number(raw.slice(0, 4));
    const month = Number(raw.slice(4, 6));
    const day = Number(raw.slice(6, 8));

    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function getAttendanceStatus(percentage: number) {
    if (percentage >= 75) return "Excellent";
    if (percentage >= 60) return "Good";
    if (percentage >= 40) return "Average";
    return "Low";
}

function isAttendedStatus(status: string) {
    return (ATTENDED_STATUSES as readonly string[]).includes(status);
}

function isConductedStatus(status: string) {
    return (CONDUCTED_STATUSES as readonly string[]).includes(status);
}

function isCancelledStatus(status: string) {
    return (CANCELLED_STATUSES as readonly string[]).includes(status);
}

const normalizeWeightageLabel = (label: string) => label.trim().toLowerCase();

const buildProgressWeightsFromConfigs = (
    configs: WeightageConfigRow[],
): ProgressWeights => {
    const emptyWeights: ProgressWeights = {
        attendance: 0,
        assignments: 0,
        quiz: 0,
        discussion: 0,
    };

    if (!configs.length) return emptyWeights;

    const totals = { ...emptyWeights };
    let matchedConfigs = 0;

    for (const config of configs) {
        const items = Array.isArray(config.faculty_weightage_items)
            ? config.faculty_weightage_items
            : config.faculty_weightage_items
                ? [config.faculty_weightage_items]
                : [];

        const bucket = { ...emptyWeights };
        let hasRecognized = false;

        for (const item of items) {
            const normalized = normalizeWeightageLabel(item.label);

            if (normalized.includes("attendance")) {
                bucket.attendance += item.percentage;
                hasRecognized = true;
            } else if (normalized.includes("assignment")) {
                bucket.assignments += item.percentage;
                hasRecognized = true;
            } else if (normalized.includes("quiz")) {
                bucket.quiz += item.percentage;
                hasRecognized = true;
            } else if (normalized.includes("discussion")) {
                bucket.discussion += item.percentage;
                hasRecognized = true;
            }
        }

        if (!hasRecognized) continue;

        totals.attendance += bucket.attendance;
        totals.assignments += bucket.assignments;
        totals.quiz += bucket.quiz;
        totals.discussion += bucket.discussion;
        matchedConfigs += 1;
    }

    if (!matchedConfigs) return emptyWeights;

    return {
        attendance: totals.attendance / matchedConfigs,
        assignments: totals.assignments / matchedConfigs,
        quiz: totals.quiz / matchedConfigs,
        discussion: totals.discussion / matchedConfigs,
    };
};

export async function getStudentProgressData(userId: number) {
    const today = formatDate(new Date());
    const studentContext = await fetchStudentContext(userId);

    let subjectsQuery = supabase
        .from("college_subjects")
        .select("collegeSubjectId, subjectName, subjectKey")
        .eq("collegeId", studentContext.collegeId)
        .eq("collegeBranchId", studentContext.collegeBranchId)
        .eq("collegeAcademicYearId", studentContext.collegeAcademicYearId)
        .eq("isActive", true)
        .is("deletedAt", null);

    let semesterSubjects: SubjectRow[] | null = null;
    let semesterSubjectsError = null;

    if (studentContext.collegeSemesterId !== null) {
        const res = await supabase
            .from("college_subjects")
            .select("collegeSubjectId, subjectName, subjectKey")
            .eq("collegeId", studentContext.collegeId)
            .eq("collegeBranchId", studentContext.collegeBranchId)
            .eq("collegeAcademicYearId", studentContext.collegeAcademicYearId)
            .eq("collegeSemesterId", studentContext.collegeSemesterId)
            .eq("isActive", true)
            .is("deletedAt", null)
            .returns<SubjectRow[]>();
        semesterSubjects = res.data;
        semesterSubjectsError = res.error;
    } else {
        const res = await supabase
            .from("college_subjects")
            .select("collegeSubjectId, subjectName, subjectKey")
            .eq("collegeId", studentContext.collegeId)
            .eq("collegeBranchId", studentContext.collegeBranchId)
            .eq("collegeAcademicYearId", studentContext.collegeAcademicYearId)
            .is("collegeSemesterId", null)
            .eq("isActive", true)
            .is("deletedAt", null)
            .returns<SubjectRow[]>();
        semesterSubjects = res.data;
        semesterSubjectsError = res.error;
    }

    if (semesterSubjectsError) throw semesterSubjectsError;

    if (!semesterSubjects || semesterSubjects.length === 0) {
        const { data: fallbackSubjects, error: fallbackError } =
            await subjectsQuery.returns<SubjectRow[]>();
        if (fallbackError) throw fallbackError;
        semesterSubjects = fallbackSubjects;
    }

    const subjectMap = new Map(
        (semesterSubjects ?? []).map((subject) => [
            subject.collegeSubjectId,
            subject.subjectName,
        ]),
    );
    const subjectLabelById = new Map(
        (semesterSubjects ?? []).map((subject) => [
            subject.collegeSubjectId,
            subject.subjectKey?.trim() || subject.subjectName,
        ]),
    );
    const semesterSubjectIds = (semesterSubjects ?? []).map(
        (subject) => subject.collegeSubjectId,
    );

    const { data: studentPinRow, error: studentPinError } = await supabase
        .from("student_pins")
        .select("pinNumber")
        .eq("studentId", studentContext.studentId)
        .eq("isActive", true)
        .is("deletedAt", null)
        .maybeSingle<{ pinNumber: string }>();

    if (studentPinError) throw studentPinError;

    const { data: facultySectionRows, error: facultySectionError } =
        semesterSubjectIds.length > 0
            ? await supabase
                .from("faculty_sections")
                .select("facultyId, collegeSubjectId")
                .eq("collegeAcademicYearId", studentContext.collegeAcademicYearId)
                .eq("collegeSectionsId", studentContext.collegeSectionsId)
                .in("collegeSubjectId", semesterSubjectIds)
                .eq("isActive", true)
                .is("deletedAt", null)
                .returns<FacultySectionRow[]>()
            : { data: [], error: null };

    if (facultySectionError) throw facultySectionError;

    const facultyIds = Array.from(
        new Set((facultySectionRows ?? []).map((row) => row.facultyId)),
    );

    const { data: attendanceRecords, error: attendanceError } = await supabase
        .from("attendance_record")
        .select(
            `
      calendarEventId,
      status,
      calendar_event:calendarEventId (
        calendarEventId,
        subject,
        facultyId,
        type,
        date,
        is_deleted
      )
    `,
        )
        .eq("studentId", studentContext.studentId)
        .is("deletedAt", null)
        .lte("markedAt", today)
        .returns<AttendanceRecordRow[]>();

    if (attendanceError) throw attendanceError;

    const validRecords = (attendanceRecords ?? []).filter((record) => {
        const event = record.calendar_event;

        return (
            !!event &&
            event.type === "class" &&
            event.is_deleted === false &&
            event.date <= today &&
            !!event.subject &&
            semesterSubjectIds.includes(event.subject) &&
            !isCancelledStatus(record.status)
        );
    });

    const profileAttendanceRecords = (attendanceRecords ?? []).filter((record) => {
        const event = record.calendar_event;

        return (
            !!event &&
            event.date <= today &&
            !!event.subject &&
            !isCancelledStatus(record.status)
        );
    });

    let attendedCount = 0;
    let absentCount = 0;
    let leaveCount = 0;

    for (const record of profileAttendanceRecords) {
        if (!isConductedStatus(record.status)) continue;

        if (isAttendedStatus(record.status)) {
            attendedCount += 1;
        } else if (record.status === "ABSENT") {
            absentCount += 1;
        } else if (record.status === "LEAVE") {
            leaveCount += 1;
        }
    }

    const conductedCount = attendedCount + absentCount;

    const subjectAttendanceMap = new Map<
        number,
        { attended: number; total: number }
    >();

    for (const record of validRecords) {
        if (!isConductedStatus(record.status)) continue;

        const subjectId = record.calendar_event?.subject;
        if (!subjectId) continue;

        const subjectStats = subjectAttendanceMap.get(subjectId) ?? {
            attended: 0,
            total: 0,
        };

        subjectStats.total += 1;
        if (isAttendedStatus(record.status)) {
            subjectStats.attended += 1;
        }

        subjectAttendanceMap.set(subjectId, subjectStats);
    }

    const unresolvedSubjectIds = Array.from(subjectAttendanceMap.keys()).filter(
        (subjectId) => !subjectMap.has(subjectId),
    );

    if (unresolvedSubjectIds.length > 0) {
        const { data: fallbackSubjects, error: fallbackSubjectsError } =
            await supabase
                .from("college_subjects")
                .select("collegeSubjectId, subjectName, subjectKey")
                .in("collegeSubjectId", unresolvedSubjectIds)
                .is("deletedAt", null)
                .returns<SubjectRow[]>();

        if (fallbackSubjectsError) throw fallbackSubjectsError;

        for (const subject of fallbackSubjects ?? []) {
            subjectMap.set(subject.collegeSubjectId, subject.subjectName);
        }
    }

    const overallAttendancePercentage =
        conductedCount === 0
            ? 0
            : Math.round((attendedCount / conductedCount) * 100);
    const absentPercentage =
        conductedCount === 0 ? 0 : Math.round((absentCount / conductedCount) * 100);
    const leavePercentage =
        conductedCount === 0 ? 0 : Math.round((leaveCount / conductedCount) * 100);

    const subjectAttendance = (semesterSubjects ?? [])
        .map((subject) => {
            const stats = subjectAttendanceMap.get(subject.collegeSubjectId) ?? {
                attended: 0,
                total: 0,
            };
            const percentage =
                stats.total === 0 ? 0 : Math.round((stats.attended / stats.total) * 100);

            return {
                subject: subject.subjectName,
                attended: stats.attended,
                total: stats.total,
                subjectId: subject.collegeSubjectId,
                status: getAttendanceStatus(percentage),
                percentage,
            };
        })
        .sort((a, b) => a.subject.localeCompare(b.subject));

    let assignmentQuery = supabase
        .from("assignments")
        .select(
            `
      assignmentId,
      subjectId,
      topicName,
      submissionDeadlineInt,
      marks,
      dateAssignedInt,
      status
    `,
        )
        .eq("collegeBranchId", studentContext.collegeBranchId)
        .eq("collegeAcademicYearId", studentContext.collegeAcademicYearId)
        .eq("collegeSectionsId", studentContext.collegeSectionsId)
        .eq("is_deleted", false)
        .neq("status", "Cancelled");

    if (semesterSubjectIds.length > 0) {
        assignmentQuery = assignmentQuery.in("subjectId", semesterSubjectIds);
    }

    const { data: assignments, error: assignmentsError } = await assignmentQuery
        .order("dateAssignedInt", { ascending: false })
        .returns<AssignmentRow[]>();

    if (assignmentsError) throw assignmentsError;

    const assignmentIds = (assignments ?? []).map(
        (assignment) => assignment.assignmentId,
    );

    const { data: submissions, error: submissionsError } = assignmentIds.length
        ? await supabase
            .from("student_assignments_submission")
            .select("assignmentId, feedback, marksScored, status")
            .eq("studentId", studentContext.studentId)
            .is("deletedAt", null)
            .in("assignmentId", assignmentIds)
            .returns<SubmissionRow[]>()
        : { data: [], error: null };

    if (submissionsError) throw submissionsError;

    const submissionMap = new Map(
        (submissions ?? []).map((submission) => [submission.assignmentId, submission]),
    );

    const assignmentsSummary = (assignments ?? []).map((assignment) => {
        const submission = submissionMap.get(assignment.assignmentId);
        const marks =
            submission?.marksScored !== null && submission?.marksScored !== undefined
                ? `${submission.marksScored} / ${assignment.marks}`
                : "-";

        return {
            assignmentId: assignment.assignmentId,
            subject: subjectMap.get(assignment.subjectId) ?? "Unknown",
            title: assignment.topicName,
            dueDate: formatIntDate(assignment.submissionDeadlineInt),
            marks,
            feedback: submission?.feedback?.trim() || "-",
            submissionStatus: submission?.status ?? null,
            assignmentStatus: assignment.status ?? null,
        };
    });

    const { data: quizzes, error: quizzesError } = semesterSubjectIds.length
        ? await supabase
            .from("quizzes")
            .select("quizId, collegeSubjectId, totalMarks")
            .eq("collegeAcademicYearId", studentContext.collegeAcademicYearId)
            .eq("collegeSectionsId", studentContext.collegeSectionsId)
            .in("collegeSubjectId", semesterSubjectIds)
            .eq("isActive", true)
            .is("deletedAt", null)
            .returns<QuizRow[]>()
        : { data: [], error: null };

    if (quizzesError) throw quizzesError;

    const quizIds = (quizzes ?? []).map((quiz) => quiz.quizId);

    const { data: quizSubmissions, error: quizSubmissionsError } = quizIds.length
        ? await supabase
            .from("quiz_submissions")
            .select("quizId, totalMarksObtained")
            .eq("studentId", studentContext.studentId)
            .in("quizId", quizIds)
            .returns<QuizSubmissionRow[]>()
        : { data: [], error: null };

    if (quizSubmissionsError) throw quizSubmissionsError;

    const { data: discussions, error: discussionsError } = facultyIds.length
        ? await supabase
            .from("discussion_forum")
            .select("discussionId, createdBy")
            .in("createdBy", facultyIds)
            .eq("is_deleted", false)
            .is("deletedAt", null)
            .returns<DiscussionForumRow[]>()
        : { data: [], error: null };

    if (discussionsError) throw discussionsError;

    const discussionIds = (discussions ?? []).map(
        (discussion) => discussion.discussionId,
    );

    const { data: discussionSections, error: discussionSectionsError } =
        discussionIds.length
            ? await supabase
                .from("discussion_forum_sections")
                .select("discussionId, collegeSectionsId, marks")
                .in("discussionId", discussionIds)
                .eq("collegeSectionsId", studentContext.collegeSectionsId)
                .eq("is_deleted", false)
                .is("deletedAt", null)
                .returns<DiscussionSectionRow[]>()
            : { data: [], error: null };

    if (discussionSectionsError) throw discussionSectionsError;

    const { data: discussionUploads, error: discussionUploadsError } =
        discussionIds.length
            ? await supabase
                .from("student_discussion_uploads")
                .select("discussionId, marksObtained")
                .eq("studentId", studentContext.studentId)
                .in("discussionId", discussionIds)
                .eq("isActive", true)
                .eq("is_deleted", false)
                .returns<DiscussionUploadRow[]>()
            : { data: [], error: null };

    if (discussionUploadsError) throw discussionUploadsError;

    let weightageConfigs: WeightageConfigRow[] | null = null;
    let weightageConfigsError = null;

    if (semesterSubjectIds.length > 0) {
        if (studentContext.collegeSemesterId === null) {
            const res = await supabase
                .from("faculty_weightage_configs")
                .select(
                    `
              collegeSubjectId,
              collegeSectionsId,
              collegeSemesterId,
              faculty_weightage_items (
                label,
                percentage
              )
            `,
                )
                .eq("collegeId", studentContext.collegeId)
                .eq("collegeEducationId", studentContext.collegeEducationId)
                .eq("collegeBranchId", studentContext.collegeBranchId)
                .eq("collegeSectionsId", studentContext.collegeSectionsId)
                .in("collegeSubjectId", semesterSubjectIds)
                .is("collegeSemesterId", null)
                .is("deletedAt", null)
                .returns<WeightageConfigRow[]>();
            weightageConfigs = res.data;
            weightageConfigsError = res.error;
        } else {
            const res = await supabase
                .from("faculty_weightage_configs")
                .select(
                    `
              collegeSubjectId,
              collegeSectionsId,
              collegeSemesterId,
              faculty_weightage_items (
                label,
                percentage
              )
            `,
                )
                .eq("collegeId", studentContext.collegeId)
                .eq("collegeEducationId", studentContext.collegeEducationId)
                .eq("collegeBranchId", studentContext.collegeBranchId)
                .eq("collegeSectionsId", studentContext.collegeSectionsId)
                .in("collegeSubjectId", semesterSubjectIds)
                .eq("collegeSemesterId", studentContext.collegeSemesterId)
                .is("deletedAt", null)
                .returns<WeightageConfigRow[]>();
            weightageConfigs = res.data;
            weightageConfigsError = res.error;
        }
    } else {
        weightageConfigs = [];
    }

    if (weightageConfigsError) throw weightageConfigsError;

    if (semesterSubjectIds.length > 0 && (!weightageConfigs || weightageConfigs.length === 0)) {
        const { data: fallbackConfigs, error: fallbackError } = await supabase
            .from("faculty_weightage_configs")
            .select(
                `
          collegeSubjectId,
          collegeSectionsId,
          collegeSemesterId,
          faculty_weightage_items (
            label,
            percentage
          )
        `,
            )
            .eq("collegeId", studentContext.collegeId)
            .eq("collegeEducationId", studentContext.collegeEducationId)
            .eq("collegeBranchId", studentContext.collegeBranchId)
            .eq("collegeSectionsId", studentContext.collegeSectionsId)
            .in("collegeSubjectId", semesterSubjectIds)
            .is("deletedAt", null)
            .returns<WeightageConfigRow[]>();

        if (!fallbackError && fallbackConfigs) {
            weightageConfigs = fallbackConfigs;
        }
    }

    const assignmentProgressBySubject = new Map<
        number,
        { total: number; submitted: number; obtained: number; possible: number }
    >();

    for (const assignment of assignments ?? []) {
        const stats = assignmentProgressBySubject.get(assignment.subjectId) ?? {
            total: 0,
            submitted: 0,
            obtained: 0,
            possible: 0,
        };

        stats.total += 1;
        stats.possible += assignment.marks ?? 0;

        const submission = submissionMap.get(assignment.assignmentId);
        if (submission) {
            stats.submitted += 1;
            stats.obtained += Math.min(
                submission.marksScored ?? 0,
                assignment.marks ?? 0,
            );
        }

        assignmentProgressBySubject.set(assignment.subjectId, stats);
    }

    const bestQuizSubmissionByQuizId = new Map<number, number>();
    for (const submission of quizSubmissions ?? []) {
        const previous = bestQuizSubmissionByQuizId.get(submission.quizId) ?? -1;
        const current = submission.totalMarksObtained ?? 0;
        if (current > previous) {
            bestQuizSubmissionByQuizId.set(submission.quizId, current);
        }
    }

    const quizProgressBySubject = new Map<
        number,
        { obtained: number; possible: number }
    >();

    for (const quiz of quizzes ?? []) {
        const stats = quizProgressBySubject.get(quiz.collegeSubjectId) ?? {
            obtained: 0,
            possible: 0,
        };

        stats.possible += quiz.totalMarks ?? 0;
        stats.obtained += Math.min(
            bestQuizSubmissionByQuizId.get(quiz.quizId) ?? 0,
            quiz.totalMarks ?? 0,
        );

        quizProgressBySubject.set(quiz.collegeSubjectId, stats);
    }

    const subjectIdsByFacultyId = new Map<number, number[]>();
    for (const row of facultySectionRows ?? []) {
        const existing = subjectIdsByFacultyId.get(row.facultyId) ?? [];
        if (!existing.includes(row.collegeSubjectId)) {
            existing.push(row.collegeSubjectId);
            subjectIdsByFacultyId.set(row.facultyId, existing);
        }
    }

    const discussionSectionById = new Map(
        (discussionSections ?? []).map((section) => [section.discussionId, section]),
    );
    const discussionUploadById = new Map(
        (discussionUploads ?? []).map((upload) => [upload.discussionId, upload]),
    );

    const discussionScoresBySubject = new Map<number, { obtained: number; total: number }>();
    for (const discussion of discussions ?? []) {
        const section = discussionSectionById.get(discussion.discussionId);
        if (!section) continue;

        const mappedSubjectIds = (
            subjectIdsByFacultyId.get(discussion.createdBy ?? -1) ?? []
        ).filter((subjectId) => semesterSubjectIds.includes(subjectId));

        const effectiveSubjectIds =
            mappedSubjectIds.length === 1
                ? mappedSubjectIds
                : semesterSubjectIds.length === 1
                    ? [semesterSubjectIds[0]]
                    : [];

        if (!effectiveSubjectIds.length) continue;

        const upload = discussionUploadById.get(discussion.discussionId);
        const totalMarks = Number(section.marks) || 0;
        const obtainedMarks = Math.min(Number(upload?.marksObtained) || 0, totalMarks);

        for (const subjectId of effectiveSubjectIds) {
            const stats = discussionScoresBySubject.get(subjectId) ?? {
                obtained: 0,
                total: 0,
            };
            stats.obtained += obtainedMarks;
            stats.total += totalMarks;
            discussionScoresBySubject.set(subjectId, stats);
        }
    }

    const subjectProgressRows = (semesterSubjects ?? []).map((subject) => {
        const attendanceStats = subjectAttendanceMap.get(subject.collegeSubjectId) ?? {
            attended: 0,
            total: 0,
        };
        const assignmentStats =
            assignmentProgressBySubject.get(subject.collegeSubjectId) ?? {
                total: 0,
                submitted: 0,
                obtained: 0,
                possible: 0,
            };
        const quizStats = quizProgressBySubject.get(subject.collegeSubjectId) ?? {
            obtained: 0,
            possible: 0,
        };
        const discussionStats =
            discussionScoresBySubject.get(subject.collegeSubjectId) ?? {
                obtained: 0,
                total: 0,
            };

        const attendancePercentage =
            attendanceStats.total > 0
                ? Math.round((attendanceStats.attended / attendanceStats.total) * 100)
                : 0;
        const subjectLabel =
            subject.subjectKey?.trim() || subject.subjectName;

        const attendancePct =
            attendanceStats.total > 0
                ? Math.round((attendanceStats.attended / attendanceStats.total) * 100)
                : null;
        const assignmentPct =
            assignmentStats.possible > 0
                ? Math.round((assignmentStats.obtained / assignmentStats.possible) * 100)
                : null;
        const quizPct =
            quizStats.possible > 0
                ? Math.round((quizStats.obtained / quizStats.possible) * 100)
                : null;
        const discussionPct =
            discussionStats.total > 0
                ? Math.round((discussionStats.obtained / discussionStats.total) * 100)
                : null;

        const subjectConfigs = (weightageConfigs ?? []).filter(
            (config) => config.collegeSubjectId === subject.collegeSubjectId,
        );
        const weights = buildProgressWeightsFromConfigs(subjectConfigs);
        const totalConfiguredWeight =
            weights.attendance + weights.assignments + weights.quiz + weights.discussion;

        let value = 0;
        if (totalConfiguredWeight > 0) {
            if (attendancePct !== null && weights.attendance > 0) {
                value += (attendancePct / 100) * weights.attendance;
            }
            if (assignmentPct !== null && weights.assignments > 0) {
                value += (assignmentPct / 100) * weights.assignments;
            }
            if (quizPct !== null && weights.quiz > 0) {
                value += (quizPct / 100) * weights.quiz;
            }
            if (discussionPct !== null && weights.discussion > 0) {
                value += (discussionPct / 100) * weights.discussion;
            }
            value = Math.round(value);
        }

        return {
            subject: subject.subjectName,
            subjectKey: subjectLabel,
            attendance: `${attendancePercentage}%`,
            assignmentsDone:
                assignmentStats.total > 0
                    ? `${assignmentStats.submitted}/${assignmentStats.total}`
                    : "-",
            quiz:
                quizStats.possible > 0
                    ? `${quizStats.obtained}/${quizStats.possible}`
                    : "-",
            discussionForum:
                discussionStats.total > 0
                    ? `${discussionStats.obtained}/${discussionStats.total}`
                    : "-",
            progressPercent: value,
        };
    });

    return {
        overallAttendancePercentage,
        absentPercentage,
        leavePercentage,
        subjectAttendance,
        conductedCount,
        attendedCount,
        absentCount,
        leaveCount,
        assignmentsSummary,
        subjectProgressRows,
    };
}
