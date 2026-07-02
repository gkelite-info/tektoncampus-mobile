import { supabase } from "@/lib/supabaseClient";

export type AdminListRow = {
  adminId:       number;
  identifierId:  string | null;
  adminName:     string;
  educationType: string;
  branches:      string;
  createdBy:     string;
  faculty:       number;
  student:       number;
  parent:        number;
  finance:       number;
  placement:     number;
  hrExecutive:   number;
  // extra fields pulled directly from admins table
  email:         string;
  mobile:        string;
  gender:        string;
};

export type AdminPageSummary = {
  admins:            number;
  students:          number;
  parents:           number;
  faculty:           number;
  financeManagers:   number;
  hrExecutives:      number;
  placementManagers: number;
};

export async function getAdminListData(
  collegeId: number,
  page:      number = 1,
  limit:     number = 10,
  search?:   string,
): Promise<{ data: AdminListRow[]; totalCount: number; summary: AdminPageSummary }> {

  const from = (page - 1) * limit;
  const to   = from + limit - 1;
  const term = search?.trim() || "";

  let matchedEmployeeUserIds: number[] = [];
  if (term) {
    const { data: empMatches } = await supabase
      .from("employee_ids")
      .select("userId")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .is("deletedAt", null)
      .ilike("employeeId", `%${term}%`);
    matchedEmployeeUserIds = (empMatches ?? [])
      .map((row: any) => Number(row.userId))
      .filter(Boolean);
  }

  // 1. Paginated admins query — with optional server-side search
  let query = supabase
    .from("admins")
    .select(`
      adminId, userId, fullName, email, mobile, gender,
      collegeEducationId, createdBy, is_deleted
    `, { count: "exact" })
    .eq("collegeId", collegeId)
    .eq("is_deleted", false);

  if (term) {
    if (matchedEmployeeUserIds.length > 0) {
      query = query.or(
        `fullName.ilike.%${term}%,userId.in.(${matchedEmployeeUserIds.join(",")})`,
      );
    } else {
      query = query.ilike("fullName", `%${term}%`);
    }
  }

  const { data: admins, error: adminsError, count } = await query.range(from, to);

  if (adminsError) throw adminsError;

  const adminIds = admins ? [...new Set(admins.map((a: any) => a.adminId).filter(Boolean))] as number[] : [];
  const { data: adminEducationTypes } = await supabase
    .from("admin_education_types")
    .select(`
      adminId,
      collegeEducationId,
      college_education:collegeEducationId (
        collegeEducationType
      )
    `)
    .in("adminId", adminIds.length > 0 ? adminIds : [-1])
    .eq("isActive", true)
    .eq("is_deleted", false)
    .is("deletedAt", null);

  const adminEducationMap = new Map<number, any[]>();
  (adminEducationTypes ?? []).forEach((row: any) => {
    const list = adminEducationMap.get(row.adminId) ?? [];
    list.push(row);
    adminEducationMap.set(row.adminId, list);
  });

  const eduIds = [
    ...new Set([
      ...(adminEducationTypes ?? []).map((row: any) => row.collegeEducationId),
      ...(admins ?? []).map((a: any) => a.collegeEducationId).filter(Boolean),
    ]),
  ] as number[];
  const createdByIds = admins ? [...new Set(admins.map((a: any) => a.createdBy).filter(Boolean))] as number[] : [];
  const adminUserIds = admins ? [...new Set(admins.map((a: any) => a.userId).filter(Boolean))] as number[] : [];

  // 2. Run all supporting queries in parallel (row-level + summary counts)
  const [
    { data: branches },
    { data: facultyData },
    { data: studentData },
    { data: parentData },
    { data: financeData },
    { data: placementData },
    { data: hrData },
    { data: employeeIdData },
    { data: creatorUsers },
    // summary totals (head:true → count only, no rows returned)
    { count: totalAdmins },
    { count: totalStudents },
    { count: totalParents },
    { count: totalFaculty },
    { count: totalFinance },
    { count: totalHr },
    { count: totalPlacement },
  ] = await Promise.all([

    supabase
      .from("college_branch")
      .select("collegeEducationId, collegeBranchCode")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .in("collegeEducationId", eduIds.length > 0 ? eduIds : [-1]),

    supabase
      .from("faculty")
      .select("collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true),

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
      .from("finance_manager")
      .select("collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .eq("is_deleted", false),

    supabase
      .from("placement_manager")
      .select("collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true),

    // ── HR Executives (college-wide, no edu type) ──
    supabase
      .from("college_hr")
      .select("collegeHrId, userId")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .eq("is_deleted", false),

    supabase
      .from("employee_ids")
      .select("userId, employeeId")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .is("deletedAt", null)
      .in("userId", adminUserIds.length > 0 ? adminUserIds : [-1]),

    supabase
      .from("users")
      .select("userId, fullName")
      .in("userId", createdByIds.length > 0 ? createdByIds : [-1]),

    // summary counts (head: true → count only, zero data transfer)
    supabase.from("admins").select("*", { count: "exact", head: true }).eq("collegeId", collegeId).eq("is_deleted", false),
    supabase.from("students").select("*", { count: "exact", head: true }).eq("collegeId", collegeId).eq("isActive", true),
    supabase.from("parents").select("*", { count: "exact", head: true }).eq("collegeId", collegeId).eq("isActive", true).eq("is_deleted", false),
    supabase.from("faculty").select("*", { count: "exact", head: true }).eq("collegeId", collegeId).eq("isActive", true),
    supabase.from("finance_manager").select("*", { count: "exact", head: true }).eq("collegeId", collegeId).eq("isActive", true).eq("is_deleted", false),
    supabase.from("college_hr").select("*", { count: "exact", head: true }).eq("collegeId", collegeId).eq("isActive", true).eq("is_deleted", false),
    supabase.from("placement_manager").select("*", { count: "exact", head: true }).eq("collegeId", collegeId).eq("isActive", true),
  ]);

  const summary: AdminPageSummary = {
    admins:            totalAdmins    ?? 0,
    students:          totalStudents  ?? 0,
    parents:           totalParents   ?? 0,
    faculty:           totalFaculty   ?? 0,
    financeManagers:   totalFinance   ?? 0,
    hrExecutives:      totalHr        ?? 0,
    placementManagers: totalPlacement ?? 0,
  };

  if (!admins || admins.length === 0) return { data: [], totalCount: count ?? 0, summary };

  const creatorMap = new Map(
    (creatorUsers ?? []).map((u: any) => [u.userId, u.fullName])
  );
  const employeeIdMap = new Map(
    (employeeIdData ?? []).map((row: any) => [row.userId, row.employeeId])
  );

  const facultyByEdu   = (eduId: number) => (facultyData   ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
  const studentByEdu   = (eduId: number) => (studentData   ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
  const parentByEdu    = (eduId: number) => (parentData    ?? []).filter((r: any) => (r.students as any)?.collegeEducationId === eduId).length;
  const financeByEdu   = (eduId: number) => (financeData   ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
  const placementByEdu = (eduId: number) => (placementData ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
  // college_hr has no eduType link → show college-wide total on every row
  const hrTotal = (hrData ?? []).length;

  const data: AdminListRow[] = (admins ?? []).map((a: any) => {
    const educationRows = adminEducationMap.get(a.adminId) ?? [];
    const educationIds =
      educationRows.length > 0
        ? educationRows.map((row) => row.collegeEducationId)
        : [a.collegeEducationId].filter(Boolean);
    const totalForEduIds = (
      ids: number[],
      counter: (eduId: number) => number,
    ) => ids.reduce((total, eduId) => total + counter(eduId), 0);
    return {
      adminId:       a.adminId,
      identifierId:  employeeIdMap.get(a.userId) ?? null,
      adminName:     a.fullName,
      email:         a.email  ?? "—",
      mobile:        a.mobile ?? "—",
      gender:        a.gender ?? "—",
      educationType: educationRows
        .map((row) => (row.college_education as any)?.collegeEducationType)
        .filter(Boolean)
        .join(", ") || "N/A",
      branches:      (branches ?? [])
        .filter((b: any) => educationIds.includes(b.collegeEducationId))
        .map((b: any) => b.collegeBranchCode)
        .join(", ") || "—",
      createdBy:   creatorMap.get(a.createdBy) ?? "—",
      faculty:     totalForEduIds(educationIds, facultyByEdu),
      student:     totalForEduIds(educationIds, studentByEdu),
      parent:      totalForEduIds(educationIds, parentByEdu),
      finance:     totalForEduIds(educationIds, financeByEdu),
      placement:   totalForEduIds(educationIds, placementByEdu),
      hrExecutive: hrTotal,
    };
  });

  return { data, totalCount: count ?? 0, summary };
}
