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
 
export type FinanceRow = {
  financeManagerId: string | number;
  fullName: string;
  collegeEducationId: number;
  eduType: string;
  supportAdmin: string;
};
 
export type FinanceListData = {
  distributions: EduTypeDistribution[];
  finance: FinanceRow[];
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
 
export async function getFinanceListData(
  collegeId: number,
  page: number = 1,
  limit: number = 10,
  filters?: {
    collegeEducationId?: number;
    adminId?: number;
    search?: string; // ← ADDED
  }
): Promise<FinanceListData & { totalCount: number }> {
 
  const from = (page - 1) * limit;
  const to = from + limit - 1;
 
  const { data: eduList, error: eduError } = await supabase
    .from("college_education")
    .select("collegeEducationId, collegeEducationType")
    .eq("collegeId", collegeId)
    .eq("isActive", true);
 
  if (eduError) throw eduError;
  if (!eduList || eduList.length === 0) {
    return { distributions: [], finance: [], totalCount: 0, summary: { admins: 0, students: 0, parents: 0, faculty: 0, financeManagers: 0, hrExecutives: 0, placementManagers: 0 } };
  }
 
  const term = filters?.search?.trim() || "";
  let matchedSearchUserIds: number[] = [];
  if (term) {
    const [{ data: userMatches }, { data: employeeMatches }] = await Promise.all([
      supabase
        .from("users")
        .select("userId")
        .eq("collegeId", collegeId)
        .eq("is_deleted", false)
        .ilike("fullName", `%${term}%`),
      supabase
        .from("employee_ids")
        .select("userId")
        .eq("collegeId", collegeId)
        .eq("isActive", true)
        .is("deletedAt", null)
        .ilike("employeeId", `%${term}%`),
    ]);

    matchedSearchUserIds = Array.from(
      new Set(
        [...(userMatches ?? []), ...(employeeMatches ?? [])]
          .map((row: any) => Number(row.userId))
          .filter(Boolean),
      ),
    );
  }
 
  // Paginated finance query
  let financeQuery = supabase
    .from("finance_manager")
    .select("financeManagerId, userId, collegeEducationId, createdBy, isActive", { count: "exact" })
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .eq("is_deleted", false)
    .range(from, to);
 
  if (filters?.collegeEducationId) financeQuery = financeQuery.eq("collegeEducationId", filters.collegeEducationId);
  if (filters?.adminId)            financeQuery = financeQuery.eq("createdBy", filters.adminId);
  if (term) {
    financeQuery = financeQuery.in(
      "userId",
      matchedSearchUserIds.length > 0 ? matchedSearchUserIds : [-1],
    );
  }
 
  const { data: financeData, count: financeCount } = await financeQuery;
 
  const [
    { data: adminData },
    { data: studentData },
    { data: facultyData },
    { data: parentData },
    { data: usersData },
    { data: hrData }, // ← ADDED
    { data: allFinanceData }, // ← ADDED: Finance managers for college-wide count
  ] = await Promise.all([

    supabase
      .from("admins")
      .select("adminId, fullName, collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("is_deleted", false),

    supabase
      .from("students")
      .select("collegeEducationId")
      .eq("collegeId", collegeId)
      .is("deletedAt", null),

    supabase
      .from("faculty")
      .select("collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true),

    supabase
      .from("parents")
      .select("parentId, students ( collegeEducationId )")
      .eq("collegeId", collegeId)
      .eq("isActive", true),

    supabase
      .from("users")
      .select("userId, fullName")
      .eq("collegeId", collegeId)
      .eq("is_deleted", false),

    // ← ADDED: HR executives from college_hr table (college-scoped)
    supabase
      .from("college_hr")
      .select("collegeHrId, userId")
      .eq("collegeId", collegeId)
      .eq("is_deleted", false),

    // ← ADDED: Finance managers for college-wide count and per-education distribution
    supabase
      .from("finance_manager")
      .select("collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .eq("is_deleted", false),
  ]);

  const userNameMap = new Map((usersData ?? []).map((u: any) => [u.userId, u.fullName]));
  const adminMap    = new Map((adminData ?? []).map((a: any) => [a.adminId, a.fullName]));
  const financeUserIds = (financeData ?? []).map((f: any) => f.userId).filter(Boolean);
  const { data: financeEmployeeIds } = await supabase
    .from("employee_ids")
    .select("userId, employeeId")
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .is("deletedAt", null)
    .in("userId", financeUserIds.length > 0 ? financeUserIds : [-1]);
  const financeEmployeeIdMap = new Map(
    (financeEmployeeIds ?? []).map((row: any) => [row.userId, row.employeeId]),
  );

  const distributions: EduTypeDistribution[] = eduList.map((edu: any) => {
    const eduId = edu.collegeEducationId;
    const adminsCount   = (adminData      ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
    const studentsCount = (studentData    ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
    const facultyCount  = (facultyData    ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
    const financeCount  = (allFinanceData ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
    const parentsCount  = (parentData     ?? []).filter((r: any) => (r.students as any)?.collegeEducationId === eduId).length;
    return {
      collegeEducationId: eduId,
      eduType:    edu.collegeEducationType,
      totalUsers: adminsCount + studentsCount + parentsCount + facultyCount + financeCount + (hrData ?? []).length,
      admins:     adminsCount,
      students:   studentsCount,
      parents:    parentsCount,
      faculty:    facultyCount,
      finance:    financeCount,
      placement:  0,
      collegeHr:  (hrData ?? []).length, // ← ADDED
    };
  });
 
  const finance: FinanceRow[] = (financeData ?? []).map((f: any) => ({
    financeManagerId:   financeEmployeeIdMap.get(f.userId) ?? f.financeManagerId,
    fullName:           userNameMap.get(f.userId) ?? "—",
    collegeEducationId: f.collegeEducationId,
    eduType:            eduList.find((e: any) => e.collegeEducationId === f.collegeEducationId)?.collegeEducationType ?? "—",
    supportAdmin:       adminMap.get(f.createdBy) ?? "—",
  }));

  // ← ADDED: summary for stat cards (college-wide counts)
  const collegeWideFinanceCount = (allFinanceData ?? []).length;
  const summary = {
    admins:            (adminData    ?? []).length,
    students:          (studentData  ?? []).length,
    parents:           (parentData   ?? []).length,
    faculty:           (facultyData  ?? []).length,
    financeManagers:   collegeWideFinanceCount,
    hrExecutives:      (hrData       ?? []).length,
    placementManagers: 0,
  };

  return { distributions, finance, totalCount: financeCount ?? 0, summary };
}
