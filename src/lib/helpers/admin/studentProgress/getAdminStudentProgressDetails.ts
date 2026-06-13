import { supabase } from "@/lib/supabaseClient";

const ATTENDED_STATUSES = ["PRESENT", "LATE"] as const;
const CONDUCTED_STATUSES = ["PRESENT", "ABSENT", "LATE", "LEAVE"] as const;
const CANCELLED_STATUSES = ["CLASS_CANCEL", "CANCEL_CLASS", "CANCELLED"] as const;

function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

type AdminStudentProgressDetailsScope = {
    rollNo: string;
    collegeId: number;
    collegeEducationId: number;
    collegeBranchIds: number[];
    academicYearIds: number[];
    semesterIds: number[];
    sectionIds: number[];
    subjectIds: number[];
    departmentLabel?: string | null;
};

type FacultySectionRow = {
    facultyId: number;
    collegeSubjectId: number;
};

type StudentPinLookupRow = {
    studentId: number;
    pinNumber: string;
};

type StudentProfileLookupRow = {
    studentId: number;
    userId: number;
    collegeBranchId: number;
    user: {
        fullName: string;
        email: string;
        mobile: string;
        gender: string | null;
    } | {
        fullName: string;
        email: string;
        mobile: string;
        gender: string | null;
    }[] | null;
};

type CurrentHistoryRow = {
    studentId: number;
    collegeAcademicYearId: number;
    collegeSemesterId: number | null;
    collegeSectionsId: number;
    college_sections: { collegeSections: string } | { collegeSections: string }[] | null;
    college_academic_year:
    | { collegeAcademicYear: string }
    | { collegeAcademicYear: string }[]
    | null;
    college_semester:
    | { collegeSemester: number }
    | { collegeSemester: number }[]
    | null;
};

type UserProfileRow = {
    userId: number;
    profileUrl: string | null;
};

type ParentRow = {
    parentId: number;
    userId: number;
    user:
    | {
        fullName: string;
        gender: string | null;
    }
    | {
        fullName: string;
        gender: string | null;
    }[]
    | null;
};

type AttendanceRecordRow = {
    status: string;
    calendar_event:
    | {
        subject: number | null;
        facultyId: number | null;
        type: string | null;
        date: string | null;
        is_deleted: boolean | null;
    }
    | {
        subject: number | null;
        facultyId: number | null;
        type: string | null;
        date: string | null;
        is_deleted: boolean | null;
    }[]
    | null;
};

type SubjectRow = {
    collegeSubjectId: number;
    subjectName: string;
    subjectKey: string | null;
};

type CollegeBranchRow = {
    collegeBranchId: number;
    collegeBranchCode: string;
};

type AssignmentRow = {
    assignmentId: number;
    subjectId: number;
    topicName: string;
    submissionDeadlineInt: number;
    marks: number;
    status: string | null;
};

type AssignmentSubmissionRow = {
    assignmentId: number;
    marksScored: number | null;
    status: string | null;
};

type QuizRow = {
    quizId: number;
    collegeSubjectId: number;
    totalMarks: number;
    quizTitle: string;
    endDate: string | null;
    status: string | null;
};

type QuizSubmissionRow = {
    quizId: number;
    totalMarksObtained: number | null;
    submittedAt?: string | null;
    createdAt?: string | null;
};

type DiscussionForumRow = {
    discussionId: number;
    title: string;
    deadline: string | null;
    createdAt: string | null;
    createdBy: number | null;
};

type DiscussionSectionRow = {
    discussionId: number;
    collegeSectionsId: number;
    marks: number;
};

type DiscussionUploadRow = {
    discussionId: number;
    marksObtained: number | null;
    submittedAt?: string | null;
    createdAt?: string | null;
};

type WeightageItemRow = {
    label: string;
    percentage: number;
};

type WeightageConfigRow = {
    collegeSubjectId: number;
    collegeSectionsId: number;
    collegeSemesterId: number;
    faculty_weightage_items:
    | WeightageItemRow[]
    | WeightageItemRow
    | null;
};

type SubjectMetric = {
    subject: string;
    value: number;
    full: number;
};

type GradeEntry = {
    subject: string;
    grade: string;
    improvement: "Improved" | "Declining";
};

type AssignmentListItem = {
    subject: string;
    task: string;
    dueDate: string;
    dueDateInt: number;
    status: "Pending" | "Incomplete" | "Completed";
    obtainedMarks?: number;
    totalMarks?: number;
};

type QuizListItem = {
    subject: string;
    task: string;
    dueDate: string;
    dueDateSortKey: string;
    status: "Not Attempted" | "Attempted" | "Evaluated";
    obtainedMarks?: number;
    totalMarks?: number;
};

type DiscussionListItem = {
    subject: string;
    task: string;
    dueDate: string;
    dueDateSortKey: string;
    status: "Not Submitted" | "Submitted" | "Evaluated";
    obtainedMarks?: number;
    totalMarks?: number;
};

type TaskInsight = {
    obtained: number;
    total: number;
    weightedScore: number;
};

type ParentInfo = {
    name: string;
    relation: string;
    avatar: string;
};

type ProgressWeights = {
    attendance: number;
    assignments: number;
    quiz: number;
    discussion: number;
};

const getFirst = <T>(value: T | T[] | null | undefined): T | null =>
    Array.isArray(value) ? value[0] ?? null : value ?? null;

const isAttendedStatus = (status: string) =>
    (ATTENDED_STATUSES as readonly string[]).includes(status);

const isConductedStatus = (status: string) =>
    (CONDUCTED_STATUSES as readonly string[]).includes(status);

const isCancelledStatus = (status: string) =>
    (CANCELLED_STATUSES as readonly string[]).includes(status);

const formatIntDate = (dateInt: number) => {
    if (!dateInt) return "-";

    const raw = String(dateInt);
    if (raw.length !== 8) return "-";

    const year = Number(raw.slice(0, 4));
    const month = Number(raw.slice(4, 6));
    const day = Number(raw.slice(6, 8));

    return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const formatIsoDate = (value: string | null | undefined) => {
    if (!value) return "-";

    const normalized =
        value.length <= 10 && /^\d{4}-\d{2}-\d{2}$/.test(value)
            ? `${value}T00:00:00`
            : value;
    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

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

const getDerivedGrade = (value: number) => {
    if (value >= 90) return "A+";
    if (value >= 80) return "A";
    if (value >= 70) return "B";
    if (value >= 60) return "C";
    if (value >= 50) return "D";
    return "F";
};

const getParentRelation = (gender: string | null | undefined, index: number) => {
    if (gender?.toLowerCase() === "male") return "Father";
    if (gender?.toLowerCase() === "female") return "Mother";
    return `Parent ${index + 1}`;
};

export type AdminStudentProgressDetails = {
    departmentLabel: string;
    yearLabel: string;
    sectionLabel: string;
    semesterLabel: string;
    studentProfile: {
        name: string;
        department: string;
        studentId: string;
        phone: string;
        email: string;
        address: string;
        photo: string;
        attendancePercentage: number;
        absentPercentage: number;
        leavePercentage: number;
    };
    parents: ParentInfo[];
    attendancePercentage: number;
    academicPerformance: SubjectMetric[];
    taskWeightages: {
        assignments: number;
        quizzes: number;
        discussions: number;
    };
    taskInsights: {
        assignments: TaskInsight;
        quizzes: TaskInsight;
        discussions: TaskInsight;
    };
    assignments: AssignmentListItem[];
    quizzes: QuizListItem[];
    discussions: DiscussionListItem[];
    grades: GradeEntry[];
};

export async function getAdminStudentProgressDetails(
    scope: AdminStudentProgressDetailsScope,
): Promise<AdminStudentProgressDetails | null> {
    const today = formatDate(new Date());
    const { data: pinRow, error: pinError } = await supabase
        .from("student_pins")
        .select("studentId, pinNumber")
        .eq("pinNumber", scope.rollNo)
        .eq("isActive", true)
        .is("deletedAt", null)
        .maybeSingle<StudentPinLookupRow>();

    if (pinError) throw pinError;
    if (!pinRow?.studentId) return null;

    const { data: studentRow, error: studentError } = await supabase
        .from("students")
        .select(
            `
      studentId,
      userId,
      collegeBranchId,
      user:users (
        fullName,
        email,
        mobile,
        gender
      )
    `,
        )
        .eq("studentId", pinRow.studentId)
        .eq("collegeId", scope.collegeId)
        .eq("collegeEducationId", scope.collegeEducationId)
        .in("collegeBranchId", scope.collegeBranchIds)
        .eq("isActive", true)
        .is("deletedAt", null)
        .maybeSingle<StudentProfileLookupRow>();

    if (studentError) throw studentError;
    if (!studentRow) return null;

    const { data: historyRow, error: historyError } = await supabase
        .from("student_academic_history")
        .select(
            `
      studentId,
      collegeAcademicYearId,
      collegeSemesterId,
      collegeSectionsId,
      college_sections:collegeSectionsId (
        collegeSections
      ),
      college_academic_year:collegeAcademicYearId (
        collegeAcademicYear
      ),
      college_semester:collegeSemesterId (
        collegeSemester
      )
    `,
        )
        .eq("studentId", studentRow.studentId)
        .eq("isCurrent", true)
        .is("deletedAt", null)
        .maybeSingle<CurrentHistoryRow>();

    if (historyError) throw historyError;
    if (!historyRow) return null;

    if (
        !scope.academicYearIds.includes(historyRow.collegeAcademicYearId) ||
        (historyRow.collegeSemesterId !== null &&
            !scope.semesterIds.includes(historyRow.collegeSemesterId)) ||
        !scope.sectionIds.includes(historyRow.collegeSectionsId)
    ) {
        return null;
    }

    const user = getFirst(studentRow.user);

    const { data: branchRow, error: branchError } = await supabase
        .from("college_branch")
        .select("collegeBranchId, collegeBranchCode")
        .eq("collegeBranchId", studentRow.collegeBranchId)
        .eq("collegeId", scope.collegeId)
        .eq("collegeEducationId", scope.collegeEducationId)
        .eq("isActive", true)
        .is("deletedAt", null)
        .maybeSingle<CollegeBranchRow>();

    if (branchError) throw branchError;
    const resolvedDepartmentLabel =
        branchRow?.collegeBranchCode ?? scope.departmentLabel ?? "N/A";

    const { data: facultySectionRows, error: facultySectionError } = await supabase
        .from("faculty_sections")
        .select("facultyId, collegeSubjectId")
        .eq("collegeAcademicYearId", historyRow.collegeAcademicYearId)
        .eq("collegeSectionsId", historyRow.collegeSectionsId)
        .in("collegeSubjectId", scope.subjectIds)
        .eq("isActive", true)
        .is("deletedAt", null)
        .returns<FacultySectionRow[]>();

    if (facultySectionError) throw facultySectionError;

    const facultyIds = Array.from(
        new Set((facultySectionRows ?? []).map((row) => row.facultyId)),
    );

    let weightageQuery = supabase
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
        .eq("collegeId", scope.collegeId)
        .eq("collegeEducationId", scope.collegeEducationId)
        .in("collegeBranchId", scope.collegeBranchIds)
        .eq("collegeSectionsId", historyRow.collegeSectionsId)
        .in("collegeSubjectId", scope.subjectIds)
        .is("deletedAt", null);

    if (historyRow.collegeSemesterId === null) {
        weightageQuery = weightageQuery.is("collegeSemesterId", null);
    } else {
        weightageQuery = weightageQuery.eq(
            "collegeSemesterId",
            historyRow.collegeSemesterId,
        );
    }

    const [
        userProfileResult,
        parentsResult,
        attendanceResult,
        subjectsResult,
        assignmentsResult,
        discussionsResult,
        quizzesResult,
        weightagesResult,
    ] = await Promise.all([
        supabase
            .from("user_profile")
            .select("userId, profileUrl")
            .eq("userId", studentRow.userId)
            .eq("is_deleted", false)
            .is("deletedAt", null)
            .maybeSingle<UserProfileRow>(),
        supabase
            .from("parents")
            .select(
                `
        parentId,
        userId,
        user:userId (
          fullName,
          gender
        )
      `,
            )
            .eq("studentId", studentRow.studentId)
            .eq("is_deleted", false)
            .is("deletedAt", null)
            .returns<ParentRow[]>(),
        supabase
            .from("attendance_record")
            .select(
                `
        status,
        calendar_event:calendarEventId (
          subject,
          facultyId,
          type,
          date,
          is_deleted
        )
      `,
            )
            .eq("studentId", studentRow.studentId)
            .is("deletedAt", null)
            .lte("markedAt", today)
            .returns<AttendanceRecordRow[]>(),
        supabase
            .from("college_subjects")
            .select("collegeSubjectId, subjectName, subjectKey")
            .in("collegeSubjectId", scope.subjectIds)
            .eq("collegeAcademicYearId", historyRow.collegeAcademicYearId)
            .eq("collegeBranchId", studentRow.collegeBranchId)
            .eq("collegeEducationId", scope.collegeEducationId)
            .eq("collegeSemesterId", historyRow.collegeSemesterId)
            .eq("isActive", true)
            .is("deletedAt", null)
            .returns<SubjectRow[]>(),
        supabase
            .from("assignments")
            .select("assignmentId, subjectId, topicName, submissionDeadlineInt, marks, status")
            .in("collegeBranchId", scope.collegeBranchIds)
            .eq("collegeAcademicYearId", historyRow.collegeAcademicYearId)
            .eq("collegeSectionsId", historyRow.collegeSectionsId)
            .in("subjectId", scope.subjectIds)
            .eq("is_deleted", false)
            .neq("status", "Cancelled")
            .returns<AssignmentRow[]>(),
        facultyIds.length
            ? supabase
                .from("discussion_forum")
                .select("discussionId, title, deadline, createdAt, createdBy")
                .in("createdBy", facultyIds)
                .eq("is_deleted", false)
                .is("deletedAt", null)
                .returns<DiscussionForumRow[]>()
            : Promise.resolve({ data: [], error: null }),
        supabase
            .from("quizzes")
            .select("quizId, collegeSubjectId, totalMarks, quizTitle, endDate, status")
            .eq("collegeAcademicYearId", historyRow.collegeAcademicYearId)
            .eq("collegeSectionsId", historyRow.collegeSectionsId)
            .in("collegeSubjectId", scope.subjectIds)
            .eq("isActive", true)
            .is("deletedAt", null)
            .returns<QuizRow[]>(),
        weightageQuery.returns<WeightageConfigRow[]>(),
    ]);

    if (userProfileResult.error) throw userProfileResult.error;
    if (parentsResult.error) throw parentsResult.error;
    if (attendanceResult.error) throw attendanceResult.error;
    if (subjectsResult.error) throw subjectsResult.error;

    if (!subjectsResult.data || subjectsResult.data.length === 0) {
        const { data: fallbackSubjects, error: fallbackError } = await supabase
            .from("college_subjects")
            .select("collegeSubjectId, subjectName, subjectKey")
            .in("collegeSubjectId", scope.subjectIds)
            .eq("collegeAcademicYearId", historyRow.collegeAcademicYearId)
            .eq("collegeBranchId", studentRow.collegeBranchId)
            .eq("collegeEducationId", scope.collegeEducationId)
            .eq("isActive", true)
            .is("deletedAt", null)
            .returns<SubjectRow[]>();
        if (!fallbackError && fallbackSubjects) {
            subjectsResult.data = fallbackSubjects;
        }
    }

    if (assignmentsResult.error) throw assignmentsResult.error;
    if (discussionsResult.error) throw discussionsResult.error;
    if (quizzesResult.error) throw quizzesResult.error;
    if (weightagesResult.error) throw weightagesResult.error;

    const parentUserIds = (parentsResult.data ?? []).map((parent) => parent.userId);
    const assignmentIds = (assignmentsResult.data ?? []).map((assignment) => assignment.assignmentId);
    const discussionIds = ((discussionsResult.data ?? []) as DiscussionForumRow[]).map(
        (discussion) => discussion.discussionId,
    );
    const quizIds = (quizzesResult.data ?? []).map((quiz) => quiz.quizId);

    const [
        parentProfilesResult,
        assignmentSubmissionsResult,
        discussionSectionsResult,
        discussionUploadsResult,
        quizSubmissionsResult,
    ] =
        await Promise.all([
            parentUserIds.length
                ? supabase
                    .from("user_profile")
                    .select("userId, profileUrl")
                    .in("userId", parentUserIds)
                    .eq("is_deleted", false)
                    .is("deletedAt", null)
                    .returns<UserProfileRow[]>()
                : Promise.resolve({ data: [], error: null }),
            assignmentIds.length
                ? supabase
                    .from("student_assignments_submission")
                    .select("assignmentId, marksScored, status")
                    .eq("studentId", studentRow.studentId)
                    .in("assignmentId", assignmentIds)
                    .is("deletedAt", null)
                    .returns<AssignmentSubmissionRow[]>()
                : Promise.resolve({ data: [], error: null }),
            discussionIds.length
                ? supabase
                    .from("discussion_forum_sections")
                    .select("discussionId, collegeSectionsId, marks")
                    .in("discussionId", discussionIds)
                    .eq("collegeSectionsId", historyRow.collegeSectionsId)
                    .eq("is_deleted", false)
                    .is("deletedAt", null)
                    .returns<DiscussionSectionRow[]>()
                : Promise.resolve({ data: [], error: null }),
            discussionIds.length
                ? supabase
                    .from("student_discussion_uploads")
                    .select("discussionId, marksObtained, submittedAt, createdAt")
                    .eq("studentId", studentRow.studentId)
                    .in("discussionId", discussionIds)
                    .eq("isActive", true)
                    .eq("is_deleted", false)
                    .returns<DiscussionUploadRow[]>()
                : Promise.resolve({ data: [], error: null }),
            quizIds.length
                ? supabase
                    .from("quiz_submissions")
                    .select("quizId, totalMarksObtained, submittedAt, createdAt")
                    .eq("studentId", studentRow.studentId)
                    .in("quizId", quizIds)
                    .eq("isActive", true)
                    .is("deletedAt", null)
                    .returns<QuizSubmissionRow[]>()
                : Promise.resolve({ data: [], error: null }),
        ]);

    if (parentProfilesResult.error) throw parentProfilesResult.error;
    if (assignmentSubmissionsResult.error) throw assignmentSubmissionsResult.error;
    if (discussionSectionsResult.error) throw discussionSectionsResult.error;
    if (discussionUploadsResult.error) throw discussionUploadsResult.error;
    if (quizSubmissionsResult.error) throw quizSubmissionsResult.error;

    const studentProfileUrl = userProfileResult.data?.profileUrl ?? null;
    const parentProfilesByUserId = new Map(
        ((parentProfilesResult.data ?? []) as UserProfileRow[]).map((profile) => [
            profile.userId,
            profile.profileUrl,
        ]),
    );
    const subjectNameById = new Map(
        ((subjectsResult.data ?? []) as SubjectRow[]).map((subject) => [
            subject.collegeSubjectId,
            subject.subjectName,
        ]),
    );
    const subjectLabelById = new Map(
        ((subjectsResult.data ?? []) as SubjectRow[]).map((subject) => [
            subject.collegeSubjectId,
            subject.subjectKey?.trim() || subject.subjectName,
        ]),
    );
    const subjectNamesByFacultyId = new Map<number, string[]>();
    const subjectIdsByFacultyId = new Map<number, number[]>();
    for (const row of (facultySectionRows ?? []) as FacultySectionRow[]) {
        const subjectName = subjectNameById.get(row.collegeSubjectId);
        if (!subjectName) continue;

        const existing = subjectNamesByFacultyId.get(row.facultyId) ?? [];
        if (!existing.includes(subjectName)) {
            existing.push(subjectName);
            subjectNamesByFacultyId.set(row.facultyId, existing);
        }

        const existingSubjectIds = subjectIdsByFacultyId.get(row.facultyId) ?? [];
        if (!existingSubjectIds.includes(row.collegeSubjectId)) {
            existingSubjectIds.push(row.collegeSubjectId);
            subjectIdsByFacultyId.set(row.facultyId, existingSubjectIds);
        }
    }

    const relevantAttendance = ((attendanceResult.data ?? []) as AttendanceRecordRow[]).filter(
        (record) => {
            const event = getFirst(record.calendar_event);

            return (
                !!event &&
                !!event.subject &&
                scope.subjectIds.includes(event.subject) &&
                event.type === "class" &&
                event.is_deleted === false &&
                !!event.date &&
                event.date <= today &&
                !isCancelledStatus(record.status) &&
                isConductedStatus(record.status)
            );
        },
    );

    let attendanceDays = 0;
    let absentDays = 0;
    let leaveDays = 0;

    const attendanceBySubject = new Map<number, { attended: number; total: number }>();

    for (const record of relevantAttendance) {
        const event = getFirst(record.calendar_event);
        if (!event?.subject) continue;

        const subjectStats = attendanceBySubject.get(event.subject) ?? {
            attended: 0,
            total: 0,
        };

        subjectStats.total += 1;

        if (isAttendedStatus(record.status)) {
            subjectStats.attended += 1;
            attendanceDays += 1;
        } else if (record.status === "LEAVE") {
            leaveDays += 1;
        } else {
            absentDays += 1;
        }

        attendanceBySubject.set(event.subject, subjectStats);
    }

    const attendancePercentage =
        attendanceDays + absentDays === 0
            ? 0
            : Math.round(
                (attendanceDays / (attendanceDays + absentDays)) * 100,
            );
    const absentPercentage =
        attendanceDays + absentDays + leaveDays === 0
            ? 0
            : Math.round(
                (absentDays / (attendanceDays + absentDays + leaveDays)) * 100,
            );
    const leavePercentage =
        attendanceDays + absentDays + leaveDays === 0
            ? 0
            : Math.round(
                (leaveDays / (attendanceDays + absentDays + leaveDays)) * 100,
            );

    const assignmentSubmissionById = new Map(
        ((assignmentSubmissionsResult.data ?? []) as AssignmentSubmissionRow[]).map((submission) => [
            submission.assignmentId,
            submission,
        ]),
    );

    const assignments: AssignmentListItem[] = ((assignmentsResult.data ?? []) as AssignmentRow[])
        .map((assignment) => ({
            subject: subjectNameById.get(assignment.subjectId) ?? "Unknown",
            task: assignment.topicName,
            dueDate: formatIntDate(assignment.submissionDeadlineInt),
            dueDateInt: assignment.submissionDeadlineInt,
            obtainedMarks:
                assignmentSubmissionById.get(assignment.assignmentId)?.marksScored ?? 0,
            totalMarks: assignment.marks ?? 0,
            status: (() => {
                const submission = assignmentSubmissionById.get(assignment.assignmentId);

                if (!submission) {
                    return "Pending" as const;
                }

                return submission.marksScored !== null && submission.marksScored !== undefined
                    ? ("Completed" as const)
                    : ("Incomplete" as const);
            })(),
        }))
        .sort((a, b) => a.dueDateInt - b.dueDateInt);

    const quizSubmissionById = new Map(
        ((quizSubmissionsResult.data ?? []) as QuizSubmissionRow[]).map((submission) => [
            submission.quizId,
            submission,
        ]),
    );

    const quizzes: QuizListItem[] = ((quizzesResult.data ?? []) as QuizRow[])
        .map((quiz) => ({
            subject: subjectNameById.get(quiz.collegeSubjectId) ?? "Unknown",
            task: quiz.quizTitle,
            dueDate: formatIsoDate(quiz.endDate),
            dueDateSortKey: quiz.endDate ?? "",
            obtainedMarks: quizSubmissionById.get(quiz.quizId)?.totalMarksObtained ?? 0,
            totalMarks: quiz.totalMarks ?? 0,
            status: (() => {
                const submission = quizSubmissionById.get(quiz.quizId);

                if (!submission) {
                    return "Not Attempted" as const;
                }

                return submission.totalMarksObtained !== null &&
                    submission.totalMarksObtained !== undefined
                    ? ("Evaluated" as const)
                    : ("Attempted" as const);
            })(),
        }))
        .sort((a, b) => a.dueDateSortKey.localeCompare(b.dueDateSortKey));

    const discussionSectionById = new Map(
        ((discussionSectionsResult.data ?? []) as DiscussionSectionRow[]).map((section) => [
            section.discussionId,
            section,
        ]),
    );
    const discussionUploadById = new Map(
        ((discussionUploadsResult.data ?? []) as DiscussionUploadRow[]).map((upload) => [
            upload.discussionId,
            upload,
        ]),
    );

    const discussionScoresBySubject = new Map<number, { obtained: number; total: number }>();
    for (const discussion of (discussionsResult.data ?? []) as DiscussionForumRow[]) {
        const section = discussionSectionById.get(discussion.discussionId);
        if (!section) continue;

        const mappedSubjectIds = (
            subjectIdsByFacultyId.get(discussion.createdBy ?? -1) ?? []
        ).filter((subjectId) => scope.subjectIds.includes(subjectId));

        const effectiveSubjectIds =
            mappedSubjectIds.length === 1
                ? mappedSubjectIds
                : scope.subjectIds.length === 1
                    ? [scope.subjectIds[0]]
                    : [];

        if (!effectiveSubjectIds.length) continue;

        const upload = discussionUploadById.get(discussion.discussionId);
        const obtainedMarks = upload?.marksObtained ?? 0;
        const totalMarks = section.marks ?? 0;

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

    const discussions: DiscussionListItem[] = ((discussionsResult.data ?? []) as DiscussionForumRow[])
        .filter((discussion) => discussionSectionById.has(discussion.discussionId))
        .map((discussion) => {
            const section = discussionSectionById.get(discussion.discussionId);
            const subjectNames = subjectNamesByFacultyId.get(discussion.createdBy ?? -1) ?? [];
            const upload = discussionUploadById.get(discussion.discussionId);

            return {
                subject:
                    subjectNames.length > 1
                        ? "Multiple Subjects"
                        : subjectNames[0] ?? "Unknown",
                task: discussion.title,
                dueDate: formatIsoDate(discussion.deadline),
                dueDateSortKey: discussion.deadline ?? discussion.createdAt ?? "",
                obtainedMarks: upload?.marksObtained ?? 0,
                totalMarks: section?.marks ?? 0,
                status: (() => {
                    if (!upload) {
                        return "Not Submitted" as const;
                    }

                    return upload.marksObtained !== null && upload.marksObtained !== undefined
                        ? ("Evaluated" as const)
                        : ("Submitted" as const);
                })(),
            };
        })
        .sort((a, b) => a.dueDateSortKey.localeCompare(b.dueDateSortKey));

    const bestQuizById = new Map<number, number>();
    for (const submission of (quizSubmissionsResult.data ?? []) as QuizSubmissionRow[]) {
        bestQuizById.set(
            submission.quizId,
            Math.max(bestQuizById.get(submission.quizId) ?? 0, submission.totalMarksObtained ?? 0),
        );
    }

    const assignmentScoresBySubject = new Map<
        number,
        { obtained: number; total: number }
    >();
    for (const assignment of (assignmentsResult.data ?? []) as AssignmentRow[]) {
        const stats = assignmentScoresBySubject.get(assignment.subjectId) ?? {
            obtained: 0,
            total: 0,
        };
        const submission = assignmentSubmissionById.get(assignment.assignmentId);

        stats.total += assignment.marks ?? 0;
        stats.obtained += submission?.marksScored ?? 0;

        assignmentScoresBySubject.set(assignment.subjectId, stats);
    }

    const quizzesBySubject = new Map<number, { obtained: number; total: number }>();
    for (const quiz of (quizzesResult.data ?? []) as QuizRow[]) {
        const stats = quizzesBySubject.get(quiz.collegeSubjectId) ?? { obtained: 0, total: 0 };
        stats.total += quiz.totalMarks ?? 0;
        stats.obtained += bestQuizById.get(quiz.quizId) ?? 0;
        quizzesBySubject.set(quiz.collegeSubjectId, stats);
    }

    const subjectIds = Array.from(subjectNameById.keys());
    const weightageConfigs = (weightagesResult.data ?? []) as WeightageConfigRow[];
    const taskWeights = buildProgressWeightsFromConfigs(weightageConfigs);
    const assignmentInsight = {
        obtained: Array.from(assignmentScoresBySubject.values()).reduce(
            (sum, stats) => sum + stats.obtained,
            0,
        ),
        total: Array.from(assignmentScoresBySubject.values()).reduce(
            (sum, stats) => sum + stats.total,
            0,
        ),
    };
    const quizInsight = {
        obtained: Array.from(quizzesBySubject.values()).reduce(
            (sum, stats) => sum + stats.obtained,
            0,
        ),
        total: Array.from(quizzesBySubject.values()).reduce(
            (sum, stats) => sum + stats.total,
            0,
        ),
    };
    const discussionInsight = {
        obtained: Array.from(discussionScoresBySubject.values()).reduce(
            (sum, stats) => sum + stats.obtained,
            0,
        ),
        total: Array.from(discussionScoresBySubject.values()).reduce(
            (sum, stats) => sum + stats.total,
            0,
        ),
    };

    const academicPerformance: SubjectMetric[] = subjectIds.map((subjectId) => {
        const attendanceStats = attendanceBySubject.get(subjectId) ?? { attended: 0, total: 0 };
        const assignmentStats = assignmentScoresBySubject.get(subjectId) ?? {
            obtained: 0,
            total: 0,
        };
        const quizStats = quizzesBySubject.get(subjectId) ?? { obtained: 0, total: 0 };
        const discussionStats = discussionScoresBySubject.get(subjectId) ?? {
            obtained: 0,
            total: 0,
        };

        const attendancePct =
            attendanceStats.total > 0
                ? Math.round((attendanceStats.attended / attendanceStats.total) * 100)
                : null;
        const assignmentPct =
            assignmentStats.total > 0
                ? Math.round((assignmentStats.obtained / assignmentStats.total) * 100)
                : null;
        const quizPct =
            quizStats.total > 0
                ? Math.round((quizStats.obtained / quizStats.total) * 100)
                : null;
        const discussionPct =
            discussionStats.total > 0
                ? Math.round((discussionStats.obtained / discussionStats.total) * 100)
                : null;

        const subjectConfigs = weightageConfigs.filter(
            (config) => config.collegeSubjectId === subjectId,
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
            subject: subjectLabelById.get(subjectId) ?? "Unknown",
            value,
            full: 100,
        };
    });

    const grades: GradeEntry[] = academicPerformance.map((subject) => ({
        subject: subject.subject,
        grade: getDerivedGrade(subject.value),
        improvement: subject.value >= 60 ? "Improved" : "Declining",
    }));

    const parents: ParentInfo[] = ((parentsResult.data ?? []) as ParentRow[]).map(
        (parent, index) => {
            const parentUser = getFirst(parent.user);

            return {
                name: parentUser?.fullName ?? `Parent ${index + 1}`,
                relation: getParentRelation(parentUser?.gender, index),
                avatar:
                    parentProfilesByUserId.get(parent.userId) ||
                    (parentUser?.gender?.toLowerCase() === "female"
                        ? "/student-f.png"
                        : "/maleuser.png"),
            };
        },
    );

    return {
        departmentLabel: resolvedDepartmentLabel,
        yearLabel: getFirst(historyRow.college_academic_year)?.collegeAcademicYear ?? "N/A",
        sectionLabel: getFirst(historyRow.college_sections)?.collegeSections ?? "N/A",
        semesterLabel:
            getFirst(historyRow.college_semester)?.collegeSemester !== null &&
                getFirst(historyRow.college_semester)?.collegeSemester !== undefined
                ? String(getFirst(historyRow.college_semester)?.collegeSemester)
                : "N/A",
        studentProfile: {
            name: user?.fullName ?? "Unknown Student",
            department: resolvedDepartmentLabel,
            studentId: pinRow.pinNumber,
            phone: user?.mobile ?? "N/A",
            email: user?.email ?? "N/A",
            address: "Not Available",
            photo:
                studentProfileUrl ||
                (user?.gender?.toLowerCase() === "female" ? "/student-f.png" : "/maleuser.png"),
            attendancePercentage,
            absentPercentage,
            leavePercentage,
        },
        parents,
        attendancePercentage,
        academicPerformance,
        taskWeightages: {
            assignments: Math.round(taskWeights.assignments),
            quizzes: Math.round(taskWeights.quiz),
            discussions: Math.round(taskWeights.discussion),
        },
        taskInsights: {
            assignments: {
                ...assignmentInsight,
                weightedScore:
                    assignmentInsight.total > 0 && taskWeights.assignments > 0
                        ? Math.round(
                            (assignmentInsight.obtained / assignmentInsight.total) *
                            taskWeights.assignments,
                        )
                        : 0,
            },
            quizzes: {
                ...quizInsight,
                weightedScore:
                    quizInsight.total > 0 && taskWeights.quiz > 0
                        ? Math.round(
                            (quizInsight.obtained / quizInsight.total) * taskWeights.quiz,
                        )
                        : 0,
            },
            discussions: {
                ...discussionInsight,
                weightedScore:
                    discussionInsight.total > 0 && taskWeights.discussion > 0
                        ? Math.round(
                            (discussionInsight.obtained / discussionInsight.total) *
                            taskWeights.discussion,
                        )
                        : 0,
            },
        },
        assignments,
        quizzes,
        discussions,
        grades,
    };
}
