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
 
export type FacultyRow = {
  facultyId: string | number;
  fullName: string;
  email: string;
  mobile: string;
  gender: string;
  collegeEducationId: number;
  eduType: string;
  collegeBranchId: number;
  branchCode: string;
  supportAdmin: string;
  subjectsHandled: string;
  isActive: boolean;
};
 
export type FacultyListData = {
  totalFaculty: number;
  distributions: EduTypeDistribution[];
  faculty: FacultyRow[];
  branches: { collegeBranchId: number; collegeBranchCode: string; collegeEducationId: number }[];
  admins: { adminId: number; fullName: string; collegeEducationId: number }[];
  // ── ADDED: summary counts across all edu types ──
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
 
export async function getFacultyListData(
  collegeId: number,
  page: number = 1,
  limit: number = 10,
  filters?: {
    collegeEducationId?: number;
    collegeBranchId?: number;
    adminId?: number;
    search?: string; // ← ADDED
  }
): Promise<FacultyListData & { totalCount: number }> {
 
  const from = (page - 1) * limit;
  const to = from + limit - 1;
 
  const { data: eduList } = await supabase
    .from("college_education")
    .select("collegeEducationId, collegeEducationType")
    .eq("collegeId", collegeId)
    .eq("isActive", true);
 
  if (!eduList || eduList.length === 0) {
    return {
      totalFaculty: 0, totalCount: 0, distributions: [], faculty: [], branches: [], admins: [],
      summary: { admins: 0, students: 0, parents: 0, faculty: 0, financeManagers: 0, hrExecutives: 0, placementManagers: 0 },
    };
  }
 
  const eduIds = eduList.map((e: any) => e.collegeEducationId) as number[];
 
  // Paginated faculty query with optional filters
  let facultyQuery = supabase
    .from("faculty")
    .select("facultyId, userId, fullName, email, mobile, gender, collegeEducationId, collegeBranchId, createdBy, isActive", { count: "exact" })
    .eq("collegeId", collegeId)
    .in("collegeEducationId", eduIds)
    .range(from, to);
 
  if (filters?.collegeEducationId) facultyQuery = facultyQuery.eq("collegeEducationId", filters.collegeEducationId);
  if (filters?.collegeBranchId)    facultyQuery = facultyQuery.eq("collegeBranchId", filters.collegeBranchId);
  if (filters?.adminId)            facultyQuery = facultyQuery.eq("createdBy", filters.adminId);
  // ── ADDED: search filter ──
  if (filters?.search?.trim()) {
    const term = filters.search.trim();
    const { data: employeeMatches } = await supabase
      .from("employee_ids")
      .select("userId")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .is("deletedAt", null)
      .ilike("employeeId", `%${term}%`);
    const matchedUserIds = (employeeMatches ?? [])
      .map((row: any) => Number(row.userId))
      .filter(Boolean);

    if (matchedUserIds.length > 0) {
      facultyQuery = facultyQuery.or(
        `fullName.ilike.%${term}%,userId.in.(${matchedUserIds.join(",")})`,
      );
    } else {
      facultyQuery = facultyQuery.ilike("fullName", `%${term}%`);
    }
  }
 
  const { data: facultyData, count: facultyCount } = await facultyQuery;
 
  // All supporting queries — no pagination needed
  const [
    { data: studentData },
    { data: parentData },
    { data: adminData },
    { data: financeData },
    { data: branchData },
    { data: subjectData },
    { data: hrData }, // ← ADDED
  ] = await Promise.all([
 
    supabase
      .from("students")
      .select("studentId, collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true),
 
    supabase
      .from("parents")
      .select("parentId, students ( collegeEducationId )")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .eq("is_deleted", false),
 
    supabase
      .from("admins")
      .select("adminId, fullName, collegeEducationId, userId")
      .eq("collegeId", collegeId)
      .eq("is_deleted", false),
 
    supabase
      .from("finance_manager")
      .select("financeManagerId, collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .eq("is_deleted", false),
 
    supabase
      .from("college_branch")
      .select("collegeBranchId, collegeBranchCode, collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .in("collegeEducationId", eduIds),
 
    supabase
      .from("college_subjects")
      .select("collegeSubjectId, collegeBranchId, collegeEducationId, subjectKey")
      .eq("collegeId", collegeId)
      .in("collegeEducationId", eduIds),
 
    // ── ADDED: fetch HR executives from college_hr table (ties userId -> college)
    supabase
      .from("college_hr")
      .select("collegeHrId, userId")
      .eq("collegeId", collegeId)
      .eq("is_deleted", false),
  ]);
 
  const branchMap = new Map((branchData ?? []).map((b: any) => [b.collegeBranchId, b.collegeBranchCode]));
  const adminMap  = new Map((adminData  ?? []).map((a: any) => [a.adminId, a.fullName]));
  const facultyUserIds = (facultyData ?? [])
    .map((f: any) => f.userId)
    .filter(Boolean);
  const { data: employeeIdData } = await supabase
    .from("employee_ids")
    .select("userId, employeeId")
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .is("deletedAt", null)
    .in("userId", facultyUserIds.length > 0 ? facultyUserIds : [-1]);
  const employeeIdMap = new Map(
    (employeeIdData ?? []).map((row: any) => [row.userId, row.employeeId]),
  );
 
  const subjectCodesMap = new Map<string, string>();
  (subjectData ?? []).forEach((s: any) => {
    if (!s.subjectKey) return;
    const key = `${s.collegeBranchId}_${s.collegeEducationId}`;
    const existing = subjectCodesMap.get(key);
    subjectCodesMap.set(key, existing ? `${existing}, ${s.subjectKey}` : s.subjectKey);
  });
 
  // Build HR per-education mapping by looking up user profiles for HR userIds
  const collegeHrDataArr = hrData ?? [];
  const hrUserIds = (collegeHrDataArr as any[]).map((r: any) => r.userId).filter(Boolean) as number[];
  let hrUsersByEdu: Record<number, number> = {};
  if (hrUserIds.length > 0) {
    const { data: hrUsers } = await supabase
      .from("users")
      .select("userId, collegeEducationId")
      .in("userId", hrUserIds);
    (hrUsers ?? []).forEach((u: any) => {
      const edu = u.collegeEducationId;
      if (!edu) return;
      hrUsersByEdu[edu] = (hrUsersByEdu[edu] || 0) + 1;
    });
  }

  // Distributions — always full college-wide counts
  const distributions: EduTypeDistribution[] = eduList.map((edu: any) => {
    const eduId = edu.collegeEducationId;
    return {
      collegeEducationId: eduId,
      eduType:    edu.collegeEducationType,
      totalUsers: [adminData, studentData, parentData, facultyData, financeData]
        .map((arr) => (arr ?? []).filter((r: any) =>
          r.collegeEducationId === eduId || (r.students as any)?.collegeEducationId === eduId
        ).length)
        .reduce((a, b) => a + b, 0),
      admins:     (adminData   ?? []).filter((r: any) => r.collegeEducationId === eduId).length,
      students:   (studentData ?? []).filter((r: any) => r.collegeEducationId === eduId).length,
      parents:    (parentData  ?? []).filter((r: any) => (r.students as any)?.collegeEducationId === eduId).length,
      faculty:    (facultyData ?? []).filter((r: any) => r.collegeEducationId === eduId).length,
      finance:    (financeData ?? []).filter((r: any) => r.collegeEducationId === eduId).length,
      placement:  0,
      collegeHr:  hrUsersByEdu[eduId] ?? 0,
    };
  });
 
  const faculty: FacultyRow[] = (facultyData ?? []).map((f: any) => ({
    facultyId:          employeeIdMap.get(f.userId) ?? f.facultyId,
    fullName:           f.fullName,
    email:              f.email,
    mobile:             f.mobile,
    gender:             f.gender,
    collegeEducationId: f.collegeEducationId,
    eduType:            eduList.find((e: any) => e.collegeEducationId === f.collegeEducationId)?.collegeEducationType ?? "N/A",
    collegeBranchId:    f.collegeBranchId,
    branchCode:         branchMap.get(f.collegeBranchId) ?? "—",
    supportAdmin:       adminMap.get(f.createdBy) ?? "—",
    subjectsHandled:    subjectCodesMap.get(`${f.collegeBranchId}_${f.collegeEducationId}`) ?? "—",
    isActive:           f.isActive,
  }));
 
  // ── ADDED: Build summary totals for stat cards ──
  const summary = {
    admins:           (adminData   ?? []).length,
    students:         (studentData ?? []).length,
    parents:          (parentData  ?? []).length,
    faculty:          facultyCount ?? 0,
    financeManagers:  (financeData ?? []).length,
    hrExecutives:     (collegeHrDataArr ?? []).length,
    placementManagers: 0,
  };
 
  return {
    totalFaculty: facultyCount ?? 0,
    totalCount:   facultyCount ?? 0,
    distributions,
    faculty,
    branches: branchData ?? [],
    admins:   adminData  ?? [],
    summary,  // ← ADDED
  };
}
