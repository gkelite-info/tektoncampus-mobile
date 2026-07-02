import { supabase } from "@/lib/supabaseClient";
 
export type EduTypeDistribution = {
  collegeEducationId: number;
  eduType: string;
  totalUsers: number;
  admins: number;
  students: number;
  parents: number;
  faculty: number;
  finance: number;
  placement: number;
  collegeHr: number; // ← ADDED
};
 
export type ParentRow = {
  parentId: number;
  fullName: string;
  collegeEducationId: number;
  eduType: string;
  collegeBranchId: number;
  branchCode: string;
  linkedStudent: string;
  supportAdmin: string;
  academicYear: string;
};
 
export type ParentListData = {
  distributions: EduTypeDistribution[];
  parents: ParentRow[];
  branches: { collegeBranchId: number; collegeBranchCode: string; collegeEducationId: number }[];
  academicYears: { collegeAcademicYearId: number; collegeAcademicYear: string; collegeEducationId: number; collegeBranchId: number }[];
  // ← ADDED: summary counts for stat cards
  summary: {
    admins: number;
    students: number;
    parents: number;
    faculty: number;
    financeManagers: number;
    hrExecutives: number;
    placementManagers: number;
  };
};
 
export async function getParentListData(
  collegeId: number,
  page: number = 1,
  limit: number = 10,
  filters?: {
    collegeEducationId?: number;
    collegeBranchId?: number;
    collegeAcademicYearId?: number;
    search?: string; // ← ADDED
  }
): Promise<ParentListData & { totalCount: number }> {
 
  const from = (page - 1) * limit;
  const to = from + limit - 1;
 
  const { data: eduList, error: eduError } = await supabase
    .from("college_education")
    .select("collegeEducationId, collegeEducationType")
    .eq("collegeId", collegeId)
    .eq("isActive", true);
 
  if (eduError) throw eduError;
  if (!eduList || eduList.length === 0) {
    return {
      distributions: [], parents: [], branches: [], academicYears: [], totalCount: 0,
      summary: { admins: 0, students: 0, parents: 0, faculty: 0, financeManagers: 0, hrExecutives: 0, placementManagers: 0 },
    };
  }
 
  const eduIds = eduList.map((e: any) => e.collegeEducationId) as number[];
 
  // All supporting queries — no pagination
  const [
    { data: studentData },
    { data: adminData },
    { data: facultyData },
    { data: financeData },
    { data: branchData },
    { data: academicYearData },
    { data: usersData },
    { data: academicHistoryData },
    { data: allParentData },
    { data: hrData }, // ← ADDED
  ] = await Promise.all([
 
    supabase
      .from("students")
      .select("studentId, userId, collegeEducationId, collegeBranchId, createdBy, isActive")
      .eq("collegeId", collegeId)
      .is("deletedAt", null),
 
    supabase
      .from("admins")
      .select("adminId, fullName, collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("is_deleted", false),
 
    supabase
      .from("faculty")
      .select("collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true),
 
    supabase
      .from("finance_manager")
      .select("collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("is_deleted", false),
 
    supabase
      .from("college_branch")
      .select("collegeBranchId, collegeBranchCode, collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .in("collegeEducationId", eduIds),
 
    supabase
      .from("college_academic_year")
      .select("collegeAcademicYearId, collegeAcademicYear, collegeEducationId, collegeBranchId")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .in("collegeEducationId", eduIds),
 
    supabase
      .from("users")
      .select("userId, fullName")
      .eq("collegeId", collegeId)
      .eq("is_deleted", false),
 
    supabase
      .from("student_academic_history")
      .select("studentId, collegeAcademicYearId")
      .eq("isCurrent", true)
      .is("deletedAt", null),
 
    // All parents for distribution counts (no pagination)
    supabase
      .from("parents")
      .select("parentId, studentId")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .eq("is_deleted", false),

    // ← ADDED: HR executives from college_hr table (college-scoped)
    supabase
      .from("college_hr")
      .select("collegeHrId, userId")
      .eq("collegeId", collegeId)
      .eq("is_deleted", false),
  ]);
 
  // ── Lookup maps ──────────────────────────────────────────────────────────────
 
  const userNameMap     = new Map((usersData ?? []).map((u: any) => [u.userId, u.fullName]));
  const branchMap       = new Map((branchData ?? []).map((b: any) => [b.collegeBranchId, b.collegeBranchCode]));
  const adminMap        = new Map((adminData ?? []).map((a: any) => [a.adminId, a.fullName]));
  const academicYearMap = new Map((academicYearData ?? []).map((y: any) => [y.collegeAcademicYearId, y.collegeAcademicYear]));
  const studentYearMap  = new Map((academicHistoryData ?? []).map((h: any) => [h.studentId, h.collegeAcademicYearId]));
  const studentMap      = new Map((studentData ?? []).map((s: any) => [s.studentId, s]));

  // ── ADDED: collect userIds matching search term ──────────────────────────
  let searchUserIds: number[] | null = null;
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    searchUserIds = (usersData ?? [])
      .filter((u: any) => u.fullName?.toLowerCase().includes(term))
      .map((u: any) => u.userId);
  }
 
  // ── Build student filter ids for pagination ───────────────────────────────
 
  // Filter studentIds based on edu/branch/year filters
  let filteredStudentIds: Set<number> | null = null;
 
  if (filters?.collegeEducationId || filters?.collegeBranchId || filters?.collegeAcademicYearId) {
    filteredStudentIds = new Set<number>();
    (studentData ?? []).forEach((s: any) => {
      const matchEdu    = !filters.collegeEducationId || s.collegeEducationId === filters.collegeEducationId;
      const matchBranch = !filters.collegeBranchId    || s.collegeBranchId    === filters.collegeBranchId;
      const yearId      = studentYearMap.get(s.studentId);
      const matchYear   = !filters.collegeAcademicYearId || yearId === filters.collegeAcademicYearId;
      if (matchEdu && matchBranch && matchYear) filteredStudentIds!.add(s.studentId);
    });
  }
 
  // ── Paginated parents query ───────────────────────────────────────────────
 
  let parentQuery = supabase
    .from("parents")
    .select("parentId, userId, studentId, createdBy, isActive", { count: "exact" })
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .eq("is_deleted", false)
    .range(from, to);
 
  if (filteredStudentIds && filteredStudentIds.size > 0) {
    parentQuery = parentQuery.in("studentId", Array.from(filteredStudentIds));
  }

  // ← ADDED: filter by matched userIds when search term is provided
  if (searchUserIds !== null) {
    if (searchUserIds.length > 0) {
      parentQuery = parentQuery.in("userId", searchUserIds);
    } else {
      parentQuery = parentQuery.in("userId", [-1]); // no match → empty result
    }
  }
 
  const { data: parentData, count: parentCount } = await parentQuery;
 
  // ── Distributions — always college-wide ───────────────────────────────────
 
  const distributions: EduTypeDistribution[] = eduList.map((edu: any) => {
    const eduId = edu.collegeEducationId;
    const adminsCount   = (adminData     ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
    const studentsCount = (studentData   ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
    const facultyCount  = (facultyData   ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
    const financeCount  = (financeData   ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
    const parentsCount  = (allParentData ?? []).filter((p: any) => {
      const student = studentMap.get(p.studentId);
      return student?.collegeEducationId === eduId;
    }).length;
 
    return {
      collegeEducationId: eduId,
      eduType:    edu.collegeEducationType,
      totalUsers: adminsCount + studentsCount + parentsCount + facultyCount + financeCount,
      admins:     adminsCount,
      students:   studentsCount,
      parents:    parentsCount,
      faculty:    facultyCount,
      finance:    financeCount,
      placement:  0,
      collegeHr:  0, // ← ADDED (college-wide, shown in summary card)
    };
  });

  // ← ADDED: summary totals for stat cards
  const summary = {
    admins:           (adminData      ?? []).length,
    students:         (studentData    ?? []).length,
    parents:          (allParentData  ?? []).length,
    faculty:          (facultyData    ?? []).length,
    financeManagers:  (financeData    ?? []).length,
    hrExecutives:     (hrData         ?? []).length,
    placementManagers: 0,
  };
 
  // ── Parent rows ───────────────────────────────────────────────────────────
 
  const parents: ParentRow[] = (parentData ?? []).map((p: any) => {
    const student = studentMap.get(p.studentId);
    const yearId = student ? studentYearMap.get(student.studentId) : undefined;
    const academicYear = yearId ? (academicYearMap.get(yearId) ?? "—") : "—";
 
    return {
      parentId:           p.parentId,
      fullName:           userNameMap.get(p.userId) ?? "—",
      collegeEducationId: student?.collegeEducationId ?? 0,
      eduType:            eduList.find((e: any) => e.collegeEducationId === student?.collegeEducationId)?.collegeEducationType ?? "—",
      collegeBranchId:    student?.collegeBranchId ?? 0,
      branchCode:         student ? (branchMap.get(student.collegeBranchId) ?? "—") : "—",
      linkedStudent:      student ? (userNameMap.get(student.userId) ?? "—") : "—",
      supportAdmin:       adminMap.get(p.createdBy) ?? "—",
      academicYear,
    };
  });
 
  return {
    distributions,
    parents,
    branches:      branchData      ?? [],
    academicYears: academicYearData ?? [],
    totalCount:    parentCount      ?? 0,
    summary, // ← ADDED
  };
}