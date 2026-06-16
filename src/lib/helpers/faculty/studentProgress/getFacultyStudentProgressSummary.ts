import { supabase } from "@/lib/supabaseClient";

const ATTENDED_STATUSES = ["PRESENT", "LATE"] as const;
const CONDUCTED_STATUSES = ["PRESENT", "ABSENT", "LATE", "LEAVE"] as const;
const CANCELLED_STATUSES = ["CLASS_CANCEL", "CANCEL_CLASS", "CANCELLED"] as const;

type FacultyStudentProgressScope = {
  facultyId: number;
  collegeId: number;
  collegeEducationId: number;
  collegeBranchId: number;
  academicYearIds: number[];
  sectionIds: number[];
  subjectIds: number[];
  departmentLabel?: string | null;
  subjectLabel?: string | null;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
};

type StudentAcademicHistoryRow = {
  studentId: number;
  collegeAcademicYearId: number;
  collegeSemesterId: number | null;
  collegeSectionsId: number;
  college_sections: { collegeSections: string } | null;
  college_academic_year: { collegeAcademicYear: string } | null;
  college_semester: { collegeSemester: number } | null;
};

type StudentAcademicHistoryRawRow = {
  studentId: number;
  collegeAcademicYearId: number;
  collegeSemesterId: number | null;
  collegeSectionsId: number;
  college_sections: { collegeSections: string }[] | { collegeSections: string } | null;
  college_academic_year:
    | { collegeAcademicYear: string }[]
    | { collegeAcademicYear: string }
    | null;
  college_semester:
    | { collegeSemester: number }[]
    | { collegeSemester: number }
    | null;
};

type AttendanceRecordRow = {
  studentId: number;
  status: string;
  markedAt?: string | null;
  calendar_event:
    | {
        facultyId: number | null;
        subject: number | null;
      }
    | {
        facultyId: number | null;
        subject: number | null;
      }[]
    | null;
};

type MarkedStudentSummary = {
  studentId: number;
  attended: number;
  conducted: number;
  percentage: number;
};

type StudentRow = {
  studentId: number;
  userId: number;
};

type StudentUserRow = {
  userId: number;
  fullName: string;
};

type StudentProfileRow = {
  userId: number;
  profileUrl: string | null;
};

type StudentPinRow = {
  studentId: number;
  pinNumber: string;
};

type AssignmentRow = {
  assignmentId: number;
  collegeSectionsId: number;
  collegeAcademicYearId: number;
  submissionDeadlineInt: number | null;
};

type AssignmentSubmissionRow = {
  studentId: number;
  assignmentId: number;
  submittedOn?: string | null;
  createdAt?: string | null;
};

type QuizRow = {
  quizId: number;
  collegeSectionsId: number;
  collegeAcademicYearId: number;
  totalMarks: number;
  endDate?: string | null;
};

type QuizSubmissionRow = {
  quizId: number;
  studentId: number;
  totalMarksObtained: number | null;
  submittedAt?: string | null;
  createdAt?: string | null;
};

type DiscussionForumRow = {
  discussionId: number;
  deadline: string | null;
};

type DiscussionSectionRow = {
  discussionId: number;
  collegeSectionsId: number;
  marks: number;
};

type StudentDiscussionUploadRow = {
  studentId: number;
  discussionId: number;
  marksObtained: number | null;
  submittedAt?: string | null;
  createdAt?: string | null;
};

type FacultyWeightageItemRow = {
  label: string;
  percentage: number;
};

type FacultyWeightageConfigRow = {
  facultyWeightageConfigId: number;
  collegeSubjectId: number;
  collegeSectionsId: number;
  collegeSemesterId: number;
  totalPercentage: number;
  faculty_weightage_items:
    | FacultyWeightageItemRow[]
    | FacultyWeightageItemRow
    | null;
};

type FacultySectionScopeRawRow = {
  collegeSectionsId: number;
  collegeSubjectId: number;
  collegeAcademicYearId: number;
  faculty_subject: { subjectName: string }[] | { subjectName: string } | null;
  college_sections: { collegeSections: string }[] | { collegeSections: string } | null;
  college_academic_year:
    | { collegeAcademicYear: string }[]
    | { collegeAcademicYear: string }
    | null;
};

type CalendarEventScopeRawRow = {
  subject: number | null;
  college_subjects:
    | { subjectName: string }[]
    | { subjectName: string }
    | null;
  calendar_event_section:
    | {
        collegeEducationId: number;
        collegeBranchId: number;
        collegeAcademicYearId: number;
        collegeSectionId: number;
        isActive: boolean | null;
        deletedAt: string | null;
        college_sections:
          | { collegeSections: string }[]
          | { collegeSections: string }
          | null;
        college_academic_year:
          | { collegeAcademicYear: string }[]
          | { collegeAcademicYear: string }
          | null;
      }[]
    | null;
};

type StudentScopeRow = {
  studentId: number;
};

type StudentHistoryScopeRawRow = {
  collegeAcademicYearId: number;
  collegeSectionsId: number;
};

export type FacultyStudentProgressRow = {
  studentId: number;
  userId: number;
  profileUrl: string | null;
  rollNo: string;
  studentName: string;
  attendancePercentage: number;
  attendedClasses: number;
  conductedClasses: number;
  assignmentsDoneCount: number;
  totalAssignments: number;
  quizMarksObtained: number;
  totalQuizMarks: number;
  discussionForumMarksObtained: number;
  totalDiscussionForumMarks: number;
  progressPercent: number;
};

export type FacultyStudentProgressTrendPoint = {
  month: string;
  value: number;
};

type WeightedProgressComponent = {
  value: number;
  weight: number;
};

type ProgressWeights = {
  attendance: number;
  assignments: number;
  quiz: number;
  discussion: number;
};

const isAttendedStatus = (status: string) =>
  (ATTENDED_STATUSES as readonly string[]).includes(status);

const isConductedStatus = (status: string) =>
  (CONDUCTED_STATUSES as readonly string[]).includes(status);

const isCancelledStatus = (status: string) =>
  (CANCELLED_STATUSES as readonly string[]).includes(status);

const uniqueJoinedLabel = (values: (string | null | undefined)[]) =>
  Array.from(new Set(values.filter(Boolean) as string[])).join(", ") || "N/A";

const firstJoin = <T,>(value: T[] | T | null | undefined) =>
  Array.isArray(value) ? value[0] ?? null : value ?? null;

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MONTH_LABELS = [
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
] as const;

const parseIsoDate = (value?: string | null) => {
  if (!value) return null;

  const normalized =
    value.length <= 10 && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00Z`
      : value;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
};

const parseIntDate = (value?: number | null) => {
  if (!value) return null;

  const raw = String(value);
  if (raw.length !== 8) return null;

  const year = Number(raw.slice(0, 4));
  const month = Number(raw.slice(4, 6));
  const day = Number(raw.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));

  return Number.isNaN(date.getTime()) ? null : date;
};

const getMonthKey = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getMonthLabel = (monthKey: string) => {
  const [, month] = monthKey.split("-");
  return MONTH_LABELS[Math.max(0, Math.min(11, Number(month) - 1))] ?? monthKey;
};

const getMonthEnd = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
};

const buildYearMonthRange = (year: number) => {
  const months: string[] = [];

  for (let month = 0; month < 12; month += 1) {
    months.push(`${year}-${String(month + 1).padStart(2, "0")}`);
  }

  return months;
};

const normalizeWeightageLabel = (label: string) => label.trim().toLowerCase();

const buildProgressWeightsFromConfigs = (
  configs: FacultyWeightageConfigRow[],
): ProgressWeights => {
  const emptyWeights: ProgressWeights = {
    attendance: 0,
    assignments: 0,
    quiz: 0,
    discussion: 0,
  };

  if (!configs.length) {
    return emptyWeights;
  }

  const totals = {
    attendance: 0,
    assignments: 0,
    quiz: 0,
    discussion: 0,
  };

  let matchedConfigs = 0;

  for (const config of configs) {
    const items = Array.isArray(config.faculty_weightage_items)
      ? config.faculty_weightage_items
      : config.faculty_weightage_items
        ? [config.faculty_weightage_items]
        : [];

    let hasRecognizedItem = false;
    const bucket = {
      attendance: 0,
      assignments: 0,
      quiz: 0,
      discussion: 0,
    };

    for (const item of items) {
      const normalized = normalizeWeightageLabel(item.label);

      if (normalized.includes("attendance")) {
        bucket.attendance += item.percentage;
        hasRecognizedItem = true;
      } else if (normalized.includes("assignment")) {
        bucket.assignments += item.percentage;
        hasRecognizedItem = true;
      } else if (normalized.includes("quiz")) {
        bucket.quiz += item.percentage;
        hasRecognizedItem = true;
      } else if (normalized.includes("discussion")) {
        bucket.discussion += item.percentage;
        hasRecognizedItem = true;
      }
    }

    if (!hasRecognizedItem) continue;

    totals.attendance += bucket.attendance;
    totals.assignments += bucket.assignments;
    totals.quiz += bucket.quiz;
    totals.discussion += bucket.discussion;
    matchedConfigs += 1;
  }

  if (!matchedConfigs) {
    return emptyWeights;
  }

  return {
    attendance: totals.attendance / matchedConfigs,
    assignments: totals.assignments / matchedConfigs,
    quiz: totals.quiz / matchedConfigs,
    discussion: totals.discussion / matchedConfigs,
  };
};

const computeProgressPercent = (
  weights: ProgressWeights,
  percentages: {
    attendancePercentage: number;
    assignmentPercentage: number | null;
    quizPercentage: number | null;
    discussionPercentage: number | null;
  },
) => {
  const weightedComponents: WeightedProgressComponent[] = [];

  if (weights.attendance > 0) {
    weightedComponents.push({
      value: percentages.attendancePercentage,
      weight: weights.attendance,
    });
  }

  if (percentages.assignmentPercentage !== null && weights.assignments > 0) {
    weightedComponents.push({
      value: percentages.assignmentPercentage,
      weight: weights.assignments,
    });
  }

  if (percentages.quizPercentage !== null && weights.quiz > 0) {
    weightedComponents.push({
      value: percentages.quizPercentage,
      weight: weights.quiz,
    });
  }

  if (percentages.discussionPercentage !== null && weights.discussion > 0) {
    weightedComponents.push({
      value: percentages.discussionPercentage,
      weight: weights.discussion,
    });
  }

  const totalWeight = weightedComponents.reduce(
    (sum, component) => sum + component.weight,
    0,
  );

  return totalWeight
    ? Math.round(
        weightedComponents.reduce(
          (sum, component) => sum + component.value * component.weight,
          0,
        ) / totalWeight,
      )
    : 0;
};

const buildEmptySummary = (
  scope: FacultyStudentProgressScope,
  overrides?: Partial<{
    yearLabel: string;
    sectionLabel: string;
    semesterLabel: string;
  }>,
) => ({
  totalStudents: 0,
  tableTotalCount: 0,
  presentToday: 0,
  lowAttendance: 0,
  markedStudents: [] as MarkedStudentSummary[],
  studentRows: [] as FacultyStudentProgressRow[],
  topPerformerRows: [] as FacultyStudentProgressRow[],
  trendData: [] as FacultyStudentProgressTrendPoint[],
  departmentLabel: scope.departmentLabel ?? "N/A",
  subjectLabel: scope.subjectLabel ?? "N/A",
  yearLabel: overrides?.yearLabel ?? "N/A",
  sectionLabel: overrides?.sectionLabel ?? "N/A",
  semesterLabel: overrides?.semesterLabel ?? "N/A",
});

const needsProgressScopeFallback = (scope: FacultyStudentProgressScope) =>
  !scope.academicYearIds.length ||
  !scope.sectionIds.length ||
  !scope.subjectIds.length ||
  !scope.subjectLabel ||
  scope.subjectLabel === "N/A";

async function resolveFacultyStudentProgressScope(
  scope: FacultyStudentProgressScope,
): Promise<FacultyStudentProgressScope> {
  if (!needsProgressScopeFallback(scope)) return scope;

  const { data: facultySections, error: facultySectionsError } = await supabase
    .from("faculty_sections")
    .select(
      `
      collegeSectionsId,
      collegeSubjectId,
      collegeAcademicYearId,
      faculty_subject:college_subjects (
        subjectName
      ),
      college_sections:collegeSectionsId (
        collegeSections
      ),
      college_academic_year:collegeAcademicYearId (
        collegeAcademicYear
      )
    `,
    )
    .eq("facultyId", scope.facultyId)
    .eq("isActive", true)
    .is("deletedAt", null);

  if (facultySectionsError) throw facultySectionsError;

  const sectionRows = (facultySections ?? []) as FacultySectionScopeRawRow[];

  if (sectionRows.length) {
    return {
      ...scope,
      academicYearIds: scope.academicYearIds.length
        ? scope.academicYearIds
        : Array.from(new Set(sectionRows.map((row) => row.collegeAcademicYearId))),
      sectionIds: scope.sectionIds.length
        ? scope.sectionIds
        : Array.from(new Set(sectionRows.map((row) => row.collegeSectionsId))),
      subjectIds: scope.subjectIds.length
        ? scope.subjectIds
        : Array.from(new Set(sectionRows.map((row) => row.collegeSubjectId))),
      subjectLabel:
        scope.subjectLabel && scope.subjectLabel !== "N/A"
          ? scope.subjectLabel
          : uniqueJoinedLabel(
              sectionRows.map((row) => firstJoin(row.faculty_subject)?.subjectName),
            ),
    };
  }

  const { data: eventRows, error: eventError } = await supabase
    .from("calendar_event")
    .select(
      `
      subject,
      college_subjects:subject (
        subjectName
      ),
      calendar_event_section (
        collegeEducationId,
        collegeBranchId,
        collegeAcademicYearId,
        collegeSectionId,
        isActive,
        deletedAt,
        college_sections:collegeSectionId (
          collegeSections
        ),
        college_academic_year:collegeAcademicYearId (
          collegeAcademicYear
        )
      )
    `,
    )
    .eq("facultyId", scope.facultyId)
    .eq("type", "class")
    .eq("is_deleted", false)
    .is("deletedAt", null)
    .not("subject", "is", null);

  if (eventError) throw eventError;

  const calendarRows = (eventRows ?? []) as CalendarEventScopeRawRow[];
  const academicYearIds = new Set(scope.academicYearIds);
  const sectionIds = new Set(scope.sectionIds);
  const subjectIds = new Set(scope.subjectIds);
  const subjectNames = new Set<string>();

  for (const event of calendarRows) {
    if (event.subject) {
      subjectIds.add(event.subject);
    }

    const subject = firstJoin(event.college_subjects);
    if (subject?.subjectName) {
      subjectNames.add(subject.subjectName);
    }

    for (const section of event.calendar_event_section ?? []) {
      if (
        section.collegeEducationId !== scope.collegeEducationId ||
        section.collegeBranchId !== scope.collegeBranchId ||
        section.isActive === false ||
        section.deletedAt
      ) {
        continue;
      }

      academicYearIds.add(section.collegeAcademicYearId);
      sectionIds.add(section.collegeSectionId);
    }
  }

  const calendarScope = {
    ...scope,
    academicYearIds: Array.from(academicYearIds),
    sectionIds: Array.from(sectionIds),
    subjectIds: Array.from(subjectIds),
    subjectLabel:
      scope.subjectLabel && scope.subjectLabel !== "N/A"
        ? scope.subjectLabel
        : Array.from(subjectNames).join(", ") || "N/A",
  };

  if (academicYearIds.size && sectionIds.size) {
    return calendarScope;
  }

  const { data: studentRows, error: studentError } = await supabase
    .from("students")
    .select("studentId")
    .eq("collegeId", scope.collegeId)
    .eq("collegeEducationId", scope.collegeEducationId)
    .eq("collegeBranchId", scope.collegeBranchId)
    .eq("isActive", true)
    .is("deletedAt", null);

  if (studentError) throw studentError;

  const branchStudentIds = ((studentRows ?? []) as StudentScopeRow[]).map(
    (row) => row.studentId,
  );

  if (!branchStudentIds.length) {
    return calendarScope;
  }

  const { data: historyRows, error: historyError } = await supabase
    .from("student_academic_history")
    .select("collegeAcademicYearId, collegeSectionsId")
    .eq("isCurrent", true)
    .is("deletedAt", null)
    .in("studentId", branchStudentIds);

  if (historyError) throw historyError;

  for (const history of (historyRows ?? []) as StudentHistoryScopeRawRow[]) {
    academicYearIds.add(history.collegeAcademicYearId);
    sectionIds.add(history.collegeSectionsId);
  }

  return {
    ...calendarScope,
    academicYearIds: Array.from(academicYearIds),
    sectionIds: Array.from(sectionIds),
  };
}

export async function getFacultyStudentProgressSummary(
  scope: FacultyStudentProgressScope,
) {
  Object.assign(scope, await resolveFacultyStudentProgressScope(scope));

  const page = Math.max(1, scope.page ?? 1);
  const pageSize = Math.max(1, scope.pageSize ?? 10);
  const searchQuery = scope.searchQuery?.trim().toLowerCase() ?? "";

  if (
    !scope.academicYearIds.length ||
    !scope.sectionIds.length
  ) {
    return buildEmptySummary(scope);
  }

  const { data: historyRows, error: historyError } = await supabase
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
    .eq("isCurrent", true)
    .is("deletedAt", null)
    .in("collegeAcademicYearId", scope.academicYearIds)
    .in("collegeSectionsId", scope.sectionIds);

  if (historyError) throw historyError;

  const academicHistory = ((historyRows ?? []) as StudentAcademicHistoryRawRow[]).map(
    (row) => ({
      ...row,
      college_sections: Array.isArray(row.college_sections)
        ? row.college_sections[0] ?? null
        : row.college_sections ?? null,
      college_academic_year: Array.isArray(row.college_academic_year)
        ? row.college_academic_year[0] ?? null
        : row.college_academic_year ?? null,
      college_semester: Array.isArray(row.college_semester)
        ? row.college_semester[0] ?? null
        : row.college_semester ?? null,
    }),
  ) as StudentAcademicHistoryRow[];

  const candidateStudentIds = Array.from(
    new Set(academicHistory.map((row) => row.studentId)),
  );

  if (!candidateStudentIds.length) {
    return buildEmptySummary(scope, {
      yearLabel: uniqueJoinedLabel(
        academicHistory.map((row) => row.college_academic_year?.collegeAcademicYear),
      ),
      sectionLabel: uniqueJoinedLabel(
        academicHistory.map((row) => row.college_sections?.collegeSections),
      ),
      semesterLabel: uniqueJoinedLabel(
        academicHistory.map((row) =>
          row.college_semester?.collegeSemester
            ? String(row.college_semester.collegeSemester)
            : "N/A",
        ),
      ),
    });
  }

  const historyLabels = {
    yearLabel: uniqueJoinedLabel(
      academicHistory.map((row) => row.college_academic_year?.collegeAcademicYear),
    ),
    sectionLabel: uniqueJoinedLabel(
      academicHistory.map((row) => row.college_sections?.collegeSections),
    ),
    semesterLabel: uniqueJoinedLabel(
      academicHistory.map((row) =>
        row.college_semester?.collegeSemester
          ? String(row.college_semester.collegeSemester)
          : "N/A",
      ),
    ),
  };

  if (!scope.subjectIds.length) {
    return buildEmptySummary(scope, historyLabels);
  }

  const { data: studentRows, error: studentError } = await supabase
    .from("students")
    .select("studentId, userId")
    .in("studentId", candidateStudentIds)
    .eq("collegeId", scope.collegeId)
    .eq("collegeEducationId", scope.collegeEducationId)
    .eq("collegeBranchId", scope.collegeBranchId)
    .eq("isActive", true)
    .is("deletedAt", null);

  if (studentError) throw studentError;

  const validStudents = (studentRows ?? []) as StudentRow[];
  const validStudentIds = new Set(validStudents.map((row) => row.studentId));
  const filteredHistory = academicHistory.filter((row) =>
    validStudentIds.has(row.studentId),
  );

  if (!filteredHistory.length) {
    return buildEmptySummary(scope);
  }

  const studentIds = Array.from(new Set(filteredHistory.map((row) => row.studentId)));
  const userIds = Array.from(new Set(validStudents.map((row) => row.userId)));
  const today = formatDate(new Date());

  const { data: todayRowsRaw, error: todayError } = await supabase
    .from("attendance_record")
    .select("studentId, status, markedAt, calendarEventId")
    .in("studentId", studentIds)
    .eq("markedAt", today)
    .is("deletedAt", null);

  if (todayError) throw todayError;

  const { data: allAttendanceRowsRaw, error: allAttendanceError } = await supabase
    .from("attendance_record")
    .select("studentId, status, markedAt, calendarEventId")
    .in("studentId", studentIds)
    .is("deletedAt", null);

  if (allAttendanceError) throw allAttendanceError;

  const allCalendarEventIds = Array.from(new Set([
    ...(todayRowsRaw ?? []).map(r => r.calendarEventId),
    ...(allAttendanceRowsRaw ?? []).map(r => r.calendarEventId),
  ])).filter(Boolean);

  let calendarEventsData: any[] = [];
  if (allCalendarEventIds.length > 0) {
    const { data: events, error: eventsError } = await supabase
      .from("calendar_event")
      .select("calendarEventId, facultyId, subject")
      .in("calendarEventId", allCalendarEventIds);
    if (!eventsError && events) {
      calendarEventsData = events;
    }
  }

  const calendarEventsMap = new Map(
    calendarEventsData.map(e => [e.calendarEventId, e])
  );

  const todayRows = (todayRowsRaw ?? []).map(r => ({
    ...r,
    calendar_event: calendarEventsMap.get(r.calendarEventId) || null
  }));

  const allAttendanceRows = (allAttendanceRowsRaw ?? []).map(r => ({
    ...r,
    calendar_event: calendarEventsMap.get(r.calendarEventId) || null
  }));

  const [
    usersResult,
    profilesResult,
    pinsResult,
    assignmentsResult,
    discussionsResult,
    quizzesResult,
    weightageConfigsResult,
  ] = await Promise.all([
    userIds.length
      ? supabase.from("users").select("userId, fullName").in("userId", userIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? supabase
          .from("user_profile")
          .select("userId, profileUrl")
          .in("userId", userIds)
          .eq("is_deleted", false)
          .is("deletedAt", null)
      : Promise.resolve({ data: [], error: null }),
    studentIds.length
      ? supabase
          .from("student_pins")
          .select("studentId, pinNumber")
          .in("studentId", studentIds)
          .eq("isActive", true)
          .is("deletedAt", null)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("assignments")
      .select("assignmentId, collegeSectionsId, collegeAcademicYearId, submissionDeadlineInt")
      .eq("createdBy", scope.facultyId)
      .eq("collegeBranchId", scope.collegeBranchId)
      .in("subjectId", scope.subjectIds)
      .in("collegeAcademicYearId", scope.academicYearIds)
      .in("collegeSectionsId", scope.sectionIds)
      .eq("is_deleted", false)
      .neq("status", "Cancelled"),
    supabase
      .from("discussion_forum")
      .select("discussionId, deadline")
      .eq("createdBy", scope.facultyId)
      .eq("is_deleted", false)
      .is("deletedAt", null),
    supabase
      .from("quizzes")
      .select("quizId, collegeSectionsId, collegeAcademicYearId, totalMarks, endDate")
      .eq("facultyId", scope.facultyId)
      .in("collegeSubjectId", scope.subjectIds)
      .in("collegeAcademicYearId", scope.academicYearIds)
      .in("collegeSectionsId", scope.sectionIds)
      .eq("isActive", true)
      .is("deletedAt", null),
    supabase
      .from("faculty_weightage_configs")
      .select(
        `
        facultyWeightageConfigId,
        collegeSubjectId,
        collegeSectionsId,
        collegeSemesterId,
        totalPercentage,
        faculty_weightage_items (
          label,
          percentage
        )
      `,
      )
      .eq("facultyId", scope.facultyId)
      .eq("collegeId", scope.collegeId)
      .eq("collegeEducationId", scope.collegeEducationId)
      .eq("collegeBranchId", scope.collegeBranchId)
      .in("collegeSubjectId", scope.subjectIds)
      .in("collegeSectionsId", scope.sectionIds)
      .is("deletedAt", null),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (profilesResult.error) throw profilesResult.error;
  if (pinsResult.error) throw pinsResult.error;
  if (assignmentsResult.error) throw assignmentsResult.error;
  if (discussionsResult.error) throw discussionsResult.error;
  if (quizzesResult.error) throw quizzesResult.error;
  if (weightageConfigsResult.error) throw weightageConfigsResult.error;

  const assignments = (assignmentsResult.data ?? []) as AssignmentRow[];
  const assignmentIds = assignments.map((row) => row.assignmentId);
  const discussionIds = ((discussionsResult.data ?? []) as DiscussionForumRow[]).map(
    (row) => row.discussionId,
  );
  const quizzes = (quizzesResult.data ?? []) as QuizRow[];
  const quizIds = quizzes.map((row) => row.quizId);

  const [
    assignmentSubmissionsResult,
    discussionSectionsResult,
    discussionUploadsResult,
    quizSubmissionsResult,
  ] = await Promise.all([
    assignmentIds.length && studentIds.length
      ? supabase
          .from("student_assignments_submission")
          .select("studentId, assignmentId, submittedOn, createdAt")
          .in("studentId", studentIds)
          .in("assignmentId", assignmentIds)
          .is("deletedAt", null)
      : Promise.resolve({ data: [], error: null }),
    discussionIds.length
      ? supabase
          .from("discussion_forum_sections")
          .select("discussionId, collegeSectionsId, marks")
          .in("discussionId", discussionIds)
          .in("collegeSectionsId", scope.sectionIds)
          .eq("is_deleted", false)
          .is("deletedAt", null)
      : Promise.resolve({ data: [], error: null }),
    discussionIds.length && studentIds.length
      ? supabase
          .from("student_discussion_uploads")
          .select("studentId, discussionId, marksObtained, submittedAt, createdAt")
          .in("studentId", studentIds)
          .in("discussionId", discussionIds)
          .eq("isActive", true)
          .eq("is_deleted", false)
      : Promise.resolve({ data: [], error: null }),
    quizIds.length && studentIds.length
      ? supabase
          .from("quiz_submissions")
          .select("quizId, studentId, totalMarksObtained, submittedAt, createdAt")
          .in("studentId", studentIds)
          .in("quizId", quizIds)
          .eq("isActive", true)
          .is("deletedAt", null)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (assignmentSubmissionsResult.error) throw assignmentSubmissionsResult.error;
  if (discussionSectionsResult.error) throw discussionSectionsResult.error;
  if (discussionUploadsResult.error) throw discussionUploadsResult.error;
  if (quizSubmissionsResult.error) throw quizSubmissionsResult.error;

  const attendanceByStudent = new Map<number, { attended: number; conducted: number }>();
  const attendanceByStudentMonth = new Map<
    number,
    Map<string, { attended: number; conducted: number }>
  >();

  for (const row of (allAttendanceRows ?? []) as AttendanceRecordRow[]) {
    const event = Array.isArray(row.calendar_event)
      ? row.calendar_event[0]
      : row.calendar_event;

    if (
      event?.facultyId !== scope.facultyId ||
      !event.subject ||
      !scope.subjectIds.includes(event.subject)
    ) {
      continue;
    }

    if (isCancelledStatus(row.status) || !isConductedStatus(row.status)) continue;

    const current = attendanceByStudent.get(row.studentId) ?? {
      attended: 0,
      conducted: 0,
    };

    current.conducted += 1;
    if (isAttendedStatus(row.status)) {
      current.attended += 1;
    }

    attendanceByStudent.set(row.studentId, current);

    const markedAt = parseIsoDate(row.markedAt);
    if (markedAt) {
      const monthKey = getMonthKey(markedAt);
      const studentMonths =
        attendanceByStudentMonth.get(row.studentId) ??
        new Map<string, { attended: number; conducted: number }>();
      const monthStats = studentMonths.get(monthKey) ?? { attended: 0, conducted: 0 };

      monthStats.conducted += 1;
      if (isAttendedStatus(row.status)) {
        monthStats.attended += 1;
      }

      studentMonths.set(monthKey, monthStats);
      attendanceByStudentMonth.set(row.studentId, studentMonths);
    }
  }

  const markedStudentIds = Array.from(attendanceByStudent.keys());
  const markedStudents: MarkedStudentSummary[] = markedStudentIds.map((studentId) => {
    const stats = attendanceByStudent.get(studentId) ?? {
      attended: 0,
      conducted: 0,
    };
    const percentage =
      stats.conducted === 0
        ? 0
        : Math.round((stats.attended / stats.conducted) * 100);

    return {
      studentId,
      attended: stats.attended,
      conducted: stats.conducted,
      percentage,
    };
  });

  const userNameById = new Map(
    ((usersResult.data ?? []) as StudentUserRow[]).map((row) => [row.userId, row.fullName]),
  );
  const profileByUserId = new Map(
    ((profilesResult.data ?? []) as StudentProfileRow[]).map((row) => [
      row.userId,
      row.profileUrl,
    ]),
  );
  const pinByStudentId = new Map(
    ((pinsResult.data ?? []) as StudentPinRow[]).map((row) => [row.studentId, row.pinNumber]),
  );
  const studentById = new Map(validStudents.map((row) => [row.studentId, row]));
  const historyByStudentId = new Map(
    filteredHistory.map((row) => [row.studentId, row]),
  );

  const assignmentsByContext = new Map<string, number[]>();
  for (const assignment of assignments) {
    const key = `${assignment.collegeAcademicYearId}:${assignment.collegeSectionsId}`;
    const existing = assignmentsByContext.get(key) ?? [];
    existing.push(assignment.assignmentId);
    assignmentsByContext.set(key, existing);
  }

  const submittedAssignmentsByStudent = new Map<number, Set<number>>();
  for (const submission of (assignmentSubmissionsResult.data ?? []) as AssignmentSubmissionRow[]) {
    const existing = submittedAssignmentsByStudent.get(submission.studentId) ?? new Set<number>();
    existing.add(submission.assignmentId);
    submittedAssignmentsByStudent.set(submission.studentId, existing);
  }

  const assignmentSubmissionDateByStudent = new Map<number, Map<number, Date>>();
  for (const submission of (assignmentSubmissionsResult.data ?? []) as AssignmentSubmissionRow[]) {
    const existing =
      assignmentSubmissionDateByStudent.get(submission.studentId) ?? new Map<number, Date>();
    const submissionDate =
      parseIsoDate(submission.submittedOn) ?? parseIsoDate(submission.createdAt);

    if (!submissionDate) continue;

    const previous = existing.get(submission.assignmentId);
    if (!previous || submissionDate.getTime() < previous.getTime()) {
      existing.set(submission.assignmentId, submissionDate);
    }

    assignmentSubmissionDateByStudent.set(submission.studentId, existing);
  }

  const discussionsBySection = new Map<number, DiscussionSectionRow[]>();
  for (const discussion of (discussionSectionsResult.data ?? []) as DiscussionSectionRow[]) {
    const existing = discussionsBySection.get(discussion.collegeSectionsId) ?? [];
    existing.push(discussion);
    discussionsBySection.set(discussion.collegeSectionsId, existing);
  }

  const discussionMarksByStudent = new Map<number, Map<number, number>>();
  for (const upload of (discussionUploadsResult.data ?? []) as StudentDiscussionUploadRow[]) {
    const studentDiscussionMarks =
      discussionMarksByStudent.get(upload.studentId) ?? new Map<number, number>();
    const previous = studentDiscussionMarks.get(upload.discussionId) ?? 0;
    studentDiscussionMarks.set(
      upload.discussionId,
      Math.max(previous, upload.marksObtained ?? 0),
    );
    discussionMarksByStudent.set(upload.studentId, studentDiscussionMarks);
  }

  const discussionSubmissionDateByStudent = new Map<number, Map<number, Date>>();
  for (const upload of (discussionUploadsResult.data ?? []) as StudentDiscussionUploadRow[]) {
    const existing =
      discussionSubmissionDateByStudent.get(upload.studentId) ?? new Map<number, Date>();
    const submissionDate =
      parseIsoDate(upload.submittedAt) ?? parseIsoDate(upload.createdAt);

    if (!submissionDate) continue;

    const previous = existing.get(upload.discussionId);
    if (!previous || submissionDate.getTime() < previous.getTime()) {
      existing.set(upload.discussionId, submissionDate);
    }

    discussionSubmissionDateByStudent.set(upload.studentId, existing);
  }

  const quizzesByContext = new Map<string, QuizRow[]>();
  for (const quiz of quizzes) {
    const key = `${quiz.collegeAcademicYearId}:${quiz.collegeSectionsId}`;
    const existing = quizzesByContext.get(key) ?? [];
    existing.push(quiz);
    quizzesByContext.set(key, existing);
  }

  const bestQuizSubmissionByStudent = new Map<number, Map<number, number>>();
  for (const submission of (quizSubmissionsResult.data ?? []) as QuizSubmissionRow[]) {
    const studentQuizMarks =
      bestQuizSubmissionByStudent.get(submission.studentId) ?? new Map<number, number>();
    const previous = studentQuizMarks.get(submission.quizId) ?? 0;
    studentQuizMarks.set(
      submission.quizId,
      Math.max(previous, submission.totalMarksObtained ?? 0),
    );
    bestQuizSubmissionByStudent.set(submission.studentId, studentQuizMarks);
  }

  const quizSubmissionDateByStudent = new Map<number, Map<number, Date>>();
  for (const submission of (quizSubmissionsResult.data ?? []) as QuizSubmissionRow[]) {
    const existing =
      quizSubmissionDateByStudent.get(submission.studentId) ?? new Map<number, Date>();
    const submissionDate =
      parseIsoDate(submission.submittedAt) ?? parseIsoDate(submission.createdAt);

    if (!submissionDate) continue;

    const previous = existing.get(submission.quizId);
    if (!previous || submissionDate.getTime() < previous.getTime()) {
      existing.set(submission.quizId, submissionDate);
    }

    quizSubmissionDateByStudent.set(submission.studentId, existing);
  }

  const weightageConfigs = (weightageConfigsResult.data ?? []) as FacultyWeightageConfigRow[];
  const discussionById = new Map(
    ((discussionsResult.data ?? []) as DiscussionForumRow[]).map((discussion) => [
      discussion.discussionId,
      discussion,
    ]),
  );

  const studentProgressRows: FacultyStudentProgressRow[] = studentIds
    .map((studentId) => {
      const student = studentById.get(studentId);
      const history = historyByStudentId.get(studentId);

      if (!student || !history) return null;

      const attendance = attendanceByStudent.get(studentId) ?? {
        attended: 0,
        conducted: 0,
      };
      const attendancePercentage =
        attendance.conducted === 0
          ? 0
          : Math.round((attendance.attended / attendance.conducted) * 100);

      const contextKey = `${history.collegeAcademicYearId}:${history.collegeSectionsId}`;
      const applicableAssignmentIds = assignmentsByContext.get(contextKey) ?? [];
      const submittedAssignmentIds =
        submittedAssignmentsByStudent.get(studentId) ?? new Set<number>();
      const assignmentsDoneCount = applicableAssignmentIds.filter((assignmentId) =>
        submittedAssignmentIds.has(assignmentId),
      ).length;

      const applicableQuizzes = quizzesByContext.get(contextKey) ?? [];
      const quizMarksMap = bestQuizSubmissionByStudent.get(studentId) ?? new Map<number, number>();
      const totalQuizMarks = applicableQuizzes.reduce(
        (sum, quiz) => sum + (quiz.totalMarks ?? 0),
        0,
      );
      const quizMarksObtained = applicableQuizzes.reduce(
        (sum, quiz) => sum + (quizMarksMap.get(quiz.quizId) ?? 0),
        0,
      );

      const applicableDiscussions = discussionsBySection.get(history.collegeSectionsId) ?? [];
      const discussionMarksMap =
        discussionMarksByStudent.get(studentId) ?? new Map<number, number>();
      const totalDiscussionForumMarks = applicableDiscussions.reduce(
        (sum, discussion) => sum + (discussion.marks ?? 0),
        0,
      );
      const discussionForumMarksObtained = applicableDiscussions.reduce(
        (sum, discussion) => sum + (discussionMarksMap.get(discussion.discussionId) ?? 0),
        0,
      );

      const assignmentPercentage = applicableAssignmentIds.length
        ? Math.round((assignmentsDoneCount / applicableAssignmentIds.length) * 100)
        : null;
      const quizPercentage = totalQuizMarks
        ? Math.round((quizMarksObtained / totalQuizMarks) * 100)
        : null;
      const discussionPercentage = totalDiscussionForumMarks
        ? Math.round(
            (discussionForumMarksObtained / totalDiscussionForumMarks) * 100,
          )
        : null;

      const matchedWeightageConfigs = weightageConfigs.filter(
        (config) =>
          config.collegeSectionsId === history.collegeSectionsId &&
          config.collegeSemesterId === history.collegeSemesterId &&
          scope.subjectIds.includes(config.collegeSubjectId),
      );
      const progressWeights = buildProgressWeightsFromConfigs(matchedWeightageConfigs);
      const progressPercent = computeProgressPercent(progressWeights, {
        attendancePercentage,
        assignmentPercentage,
        quizPercentage,
        discussionPercentage,
      });

      return {
        studentId,
        userId: student.userId,
        profileUrl: profileByUserId.get(student.userId) ?? null,
        rollNo: pinByStudentId.get(studentId) ?? "N/A",
        studentName: userNameById.get(student.userId) ?? "Unknown Student",
        attendancePercentage,
        attendedClasses: attendance.attended,
        conductedClasses: attendance.conducted,
        assignmentsDoneCount,
        totalAssignments: applicableAssignmentIds.length,
        quizMarksObtained,
        totalQuizMarks,
        discussionForumMarksObtained,
        totalDiscussionForumMarks,
        progressPercent,
      };
    })
    .filter((row): row is FacultyStudentProgressRow => row !== null)
    .sort((a, b) => a.rollNo.localeCompare(b.rollNo));

  const topPerformerProgressRows = studentProgressRows.filter(
    (student) => student.progressPercent > 0,
  );

  const filteredStudentProgressRows = searchQuery
    ? studentProgressRows.filter((student) => {
        const rollNo = student.rollNo.toLowerCase();
        const studentName = student.studentName.toLowerCase();

        return (
          rollNo.includes(searchQuery) || studentName.includes(searchQuery)
        );
      })
    : studentProgressRows;

  const tableTotalCount = filteredStudentProgressRows.length;
  const paginatedStudentRows = filteredStudentProgressRows.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const trendSourceDates: Date[] = [];
  const activeTrendMonths = new Set<string>();
  for (const row of (allAttendanceRows ?? []) as AttendanceRecordRow[]) {
    const markedAt = parseIsoDate(row.markedAt);
    if (markedAt) {
      trendSourceDates.push(markedAt);
      activeTrendMonths.add(getMonthKey(markedAt));
    }
  }

  for (const assignment of assignments) {
    const deadline = parseIntDate(assignment.submissionDeadlineInt);
    if (deadline) {
      trendSourceDates.push(deadline);
      activeTrendMonths.add(getMonthKey(deadline));
    }
  }

  for (const quiz of quizzes) {
    const endDate = parseIsoDate(quiz.endDate);
    if (endDate) {
      trendSourceDates.push(endDate);
      activeTrendMonths.add(getMonthKey(endDate));
    }
  }

  for (const discussion of (discussionsResult.data ?? []) as DiscussionForumRow[]) {
    const deadline = parseIsoDate(discussion.deadline);
    if (deadline) {
      trendSourceDates.push(deadline);
      activeTrendMonths.add(getMonthKey(deadline));
    }
  }

  const trendYear = trendSourceDates.length
    ? new Date(Math.max(...trendSourceDates.map((date) => date.getTime()))).getUTCFullYear()
    : new Date().getUTCFullYear();

  const trendData: FacultyStudentProgressTrendPoint[] = buildYearMonthRange(trendYear).map(
    (monthKey) => {
        if (!activeTrendMonths.has(monthKey)) {
          return {
            month: getMonthLabel(monthKey),
            value: 0,
          };
        }

        const monthEnd = getMonthEnd(monthKey);

        const classAverage =
          studentIds.length === 0
            ? 0
            : Math.round(
                studentIds.reduce((sum, studentId) => {
                  const history = historyByStudentId.get(studentId);
                  if (!history) return sum;

                  const matchedWeightageConfigs = weightageConfigs.filter(
                    (config) =>
                      config.collegeSectionsId === history.collegeSectionsId &&
                      config.collegeSemesterId === history.collegeSemesterId &&
                      scope.subjectIds.includes(config.collegeSubjectId),
                  );
                  const progressWeights = buildProgressWeightsFromConfigs(
                    matchedWeightageConfigs,
                  );

                  const monthlyAttendanceStats =
                    attendanceByStudentMonth.get(studentId) ?? new Map();
                  let attendedClasses = 0;
                  let conductedClasses = 0;

                  for (const [key, stats] of monthlyAttendanceStats.entries()) {
                    if (key <= monthKey) {
                      attendedClasses += stats.attended;
                      conductedClasses += stats.conducted;
                    }
                  }

                  const attendancePercentage =
                    conductedClasses > 0
                      ? Math.round((attendedClasses / conductedClasses) * 100)
                      : 0;

                  const contextKey = `${history.collegeAcademicYearId}:${history.collegeSectionsId}`;
                  const applicableAssignmentIds = (assignmentsByContext.get(contextKey) ?? []).filter(
                    (assignmentId) => {
                      const assignment = assignments.find(
                        (item) => item.assignmentId === assignmentId,
                      );
                      const deadline = parseIntDate(assignment?.submissionDeadlineInt);

                      return !!deadline && deadline.getTime() <= monthEnd.getTime();
                    },
                  );
                  const assignmentDates =
                    assignmentSubmissionDateByStudent.get(studentId) ?? new Map<number, Date>();
                  const assignmentsDoneCount = applicableAssignmentIds.filter((assignmentId) => {
                    const submissionDate = assignmentDates.get(assignmentId);
                    return !!submissionDate && submissionDate.getTime() <= monthEnd.getTime();
                  }).length;

                  const applicableQuizzes = (quizzesByContext.get(contextKey) ?? []).filter(
                    (quiz) => {
                      const endDate = parseIsoDate(quiz.endDate);
                      return !!endDate && endDate.getTime() <= monthEnd.getTime();
                    },
                  );
                  const quizMarksMap =
                    bestQuizSubmissionByStudent.get(studentId) ?? new Map<number, number>();
                  const quizDateMap =
                    quizSubmissionDateByStudent.get(studentId) ?? new Map<number, Date>();
                  const totalQuizMarks = applicableQuizzes.reduce(
                    (sum, quiz) => sum + (quiz.totalMarks ?? 0),
                    0,
                  );
                  const quizMarksObtained = applicableQuizzes.reduce((sum, quiz) => {
                    const submissionDate = quizDateMap.get(quiz.quizId);
                    if (!submissionDate || submissionDate.getTime() > monthEnd.getTime()) {
                      return sum;
                    }
                    return sum + (quizMarksMap.get(quiz.quizId) ?? 0);
                  }, 0);

                  const applicableDiscussions = (
                    discussionsBySection.get(history.collegeSectionsId) ?? []
                  ).filter((discussion) => {
                    const discussionRow = discussionById.get(discussion.discussionId);
                    const deadline = parseIsoDate(discussionRow?.deadline);
                    return !!deadline && deadline.getTime() <= monthEnd.getTime();
                  });
                  const discussionMarksMap =
                    discussionMarksByStudent.get(studentId) ?? new Map<number, number>();
                  const discussionDateMap =
                    discussionSubmissionDateByStudent.get(studentId) ?? new Map<number, Date>();
                  const totalDiscussionForumMarks = applicableDiscussions.reduce(
                    (sum, discussion) => sum + (discussion.marks ?? 0),
                    0,
                  );
                  const discussionForumMarksObtained = applicableDiscussions.reduce(
                    (sum, discussion) => {
                      const submissionDate = discussionDateMap.get(discussion.discussionId);
                      if (!submissionDate || submissionDate.getTime() > monthEnd.getTime()) {
                        return sum;
                      }
                      return sum + (discussionMarksMap.get(discussion.discussionId) ?? 0);
                    },
                    0,
                  );

                  const assignmentPercentage = applicableAssignmentIds.length
                    ? Math.round((assignmentsDoneCount / applicableAssignmentIds.length) * 100)
                    : null;
                  const quizPercentage = totalQuizMarks
                    ? Math.round((quizMarksObtained / totalQuizMarks) * 100)
                    : null;
                  const discussionPercentage = totalDiscussionForumMarks
                    ? Math.round(
                        (discussionForumMarksObtained / totalDiscussionForumMarks) * 100,
                      )
                    : null;

                  return (
                    sum +
                    computeProgressPercent(progressWeights, {
                      attendancePercentage,
                      assignmentPercentage,
                      quizPercentage,
                      discussionPercentage,
                    })
                  );
                }, 0) / studentIds.length,
              );

        return {
          month: getMonthLabel(monthKey),
          value: classAverage,
        };
      },
  );

  const studentProgressIds = new Set(
    studentProgressRows.map((student) => student.studentId),
  );

  const lowAttendance = studentProgressRows.filter(
    (student) => student.conductedClasses > 0 && student.attendancePercentage < 70,
  ).length;

  return {
    totalStudents: studentProgressRows.length,
    tableTotalCount,
    presentToday: Array.from(
      new Set(
        ((todayRows ?? []) as AttendanceRecordRow[])
          .filter((row) => {
            const event = Array.isArray(row.calendar_event)
              ? row.calendar_event[0]
              : row.calendar_event;

            return (
              studentProgressIds.has(row.studentId) &&
              isAttendedStatus(row.status) &&
              event?.facultyId === scope.facultyId &&
              !!event.subject &&
              scope.subjectIds.includes(event.subject)
            );
          })
          .map((row) => row.studentId),
      ),
    ).length,
    lowAttendance,
    markedStudents,
    studentRows: paginatedStudentRows,
    topPerformerRows: topPerformerProgressRows,
    trendData,
    departmentLabel: scope.departmentLabel ?? "N/A",
    subjectLabel: scope.subjectLabel ?? "N/A",
    yearLabel: uniqueJoinedLabel(
      filteredHistory.map((row) => row.college_academic_year?.collegeAcademicYear),
    ),
    sectionLabel: uniqueJoinedLabel(
      filteredHistory.map((row) => row.college_sections?.collegeSections),
    ),
    semesterLabel: uniqueJoinedLabel(
      filteredHistory.map((row) =>
        row.college_semester?.collegeSemester
          ? String(row.college_semester.collegeSemester)
          : "N/A",
      ),
    ),
  };
}
