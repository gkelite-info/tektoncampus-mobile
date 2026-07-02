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
  collegeHr: number;
};

export type StudentRow = {
  studentId: string | number;
  userId: number;
  fullName: string;
  email: string;
  mobile: string;
  gender: string;
  collegeEducationId: number;
  eduType: string;
  collegeBranchId: number;
  branchCode: string;
  academicYear: string;
  supportAdmin: string;
  entryType: string;
  status: string;
  isActive: boolean;
};

export type StudentListData = {
  totalStudents: number;
  distributions: EduTypeDistribution[];
  students: StudentRow[];
  branches: { collegeBranchId: number; collegeBranchCode: string; collegeEducationId: number }[];
  academicYears: { collegeAcademicYearId: number; collegeAcademicYear: string; collegeBranchId: number; collegeEducationId: number }[];
  admins: { adminId: number; fullName: string; collegeEducationId: number }[];
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

export async function getStudentListData(
  collegeId: number,
  page: number = 1,
  limit: number = 10,
  filters?: {
    collegeEducationId?: number;
    collegeBranchId?: number;
    collegeAcademicYearId?: number; // ← passed directly from dropdown selection
    adminId?: number;
    search?: string;
  }
): Promise<StudentListData & { totalCount: number }> {

  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  // 1. Education types for this college
  const { data: eduList } = await supabase
    .from("college_education")
    .select("collegeEducationId, collegeEducationType")
    .eq("collegeId", collegeId)
    .eq("isActive", true);

  if (!eduList || eduList.length === 0) {
    return {
      totalStudents: 0, totalCount: 0, distributions: [], students: [],
      branches: [], academicYears: [], admins: [],
      summary: { admins: 0, students: 0, parents: 0, faculty: 0, financeManagers: 0, hrExecutives: 0, placementManagers: 0 },
    };
  }

  const eduIds = eduList.map((e: any) => e.collegeEducationId) as number[];

  // 2. All supporting data in parallel
  const [
    { data: allStudentData },
    { data: studentPinsData },
    { data: parentData },
    { data: adminData },
    { data: financeData },
    { data: facultyData },
    { data: branchData },
    { data: academicYearData },
    { data: hrData },        // college_hr table — same as getFacultyListData
    { data: historyData },   // student_academic_history — isCurrent=true
  ] = await Promise.all([

    supabase
      .from("students")
      .select("studentId, userId, collegeEducationId, collegeBranchId, createdBy, entryType, status, isActive")
      .eq("collegeId", collegeId)
      .in("collegeEducationId", eduIds),

    supabase
      .from("student_pins")
      .select("studentId, pinNumber")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .is("deletedAt", null),

    supabase
      .from("parents")
      .select("parentId, students ( collegeEducationId )")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .eq("is_deleted", false),

    supabase
      .from("admins")
      .select("adminId, fullName, collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("is_deleted", false),

    supabase
      .from("finance_manager")
      .select("financeManagerId, collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .eq("is_deleted", false),

    supabase
      .from("faculty")
      .select("facultyId, collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true),

    supabase
      .from("college_branch")
      .select("collegeBranchId, collegeBranchCode, collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .in("collegeEducationId", eduIds),

    supabase
      .from("college_academic_year")
      .select("collegeAcademicYearId, collegeAcademicYear, collegeBranchId, collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .in("collegeEducationId", eduIds),

    // ── HR: same table as getFacultyListData uses ──
    supabase
      .from("college_hr")
      .select("collegeHrId, userId")
      .eq("collegeId", collegeId)
      .eq("is_deleted", false),

    // ── student_academic_history: isCurrent=true → studentId → collegeAcademicYearId ──
    supabase
      .from("student_academic_history")
      .select("studentId, collegeAcademicYearId")
      .eq("isCurrent", true),
  ]);

  // 3. Lookup maps
  const branchMap    = new Map((branchData  ?? []).map((b: any) => [b.collegeBranchId, b.collegeBranchCode]));
  const adminMap     = new Map((adminData   ?? []).map((a: any) => [a.adminId, a.fullName]));
  // collegeAcademicYearId → year label string
  const yearLabelMap = new Map((academicYearData ?? []).map((y: any) => [y.collegeAcademicYearId, y.collegeAcademicYear]));
  // studentId → current collegeAcademicYearId  (from student_academic_history WHERE isCurrent=true)
  const historyMap   = new Map((historyData ?? []).map((h: any) => [h.studentId, h.collegeAcademicYearId]));
  const studentPinMap = new Map((studentPinsData ?? []).map((p: any) => [p.studentId, p.pinNumber]));

  // 4. Fetch user info (fullName, email, mobile, gender) for all students
  const studentUserIds = (allStudentData ?? []).map((s: any) => s.userId).filter(Boolean) as number[];
  const userMap = new Map<number, { fullName: string; email: string; mobile: string; gender: string }>();
  if (studentUserIds.length > 0) {
    const { data: userData } = await supabase
      .from("users")
      .select("userId, fullName, email, mobile, gender")
      .in("userId", studentUserIds);
    (userData ?? []).forEach((u: any) => {
      userMap.set(u.userId, { fullName: u.fullName, email: u.email, mobile: u.mobile, gender: u.gender });
    });
  }

  // 5. Apply all filters
  let filtered = allStudentData ?? [];

  if (filters?.collegeEducationId) {
    filtered = filtered.filter((s: any) => s.collegeEducationId === filters.collegeEducationId);
  }
  if (filters?.collegeBranchId) {
    filtered = filtered.filter((s: any) => s.collegeBranchId === filters.collegeBranchId);
  }
  if (filters?.adminId) {
    filtered = filtered.filter((s: any) => s.createdBy === filters.adminId);
  }

  // ── YEAR FILTER: match student's current collegeAcademicYearId from student_academic_history ──
  if (filters?.collegeAcademicYearId) {
    filtered = filtered.filter(
      (s: any) => historyMap.get(s.studentId) === filters.collegeAcademicYearId
    );
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter((s: any) =>
      (userMap.get(s.userId)?.fullName ?? "").toLowerCase().includes(q) ||
      String(studentPinMap.get(s.studentId) ?? "").toLowerCase().includes(q)
    );
  }

  const totalCount = filtered.length;

  // 6. Paginate
  const paginated = filtered.slice(from, to + 1);

  // 7. Build student rows
  const students: StudentRow[] = paginated.map((s: any) => {
    const currentYearId = historyMap.get(s.studentId);
    const yearLabel     = currentYearId ? (yearLabelMap.get(currentYearId) ?? "—") : "—";
    const user          = userMap.get(s.userId);
    const studentPin    = studentPinMap.get(s.studentId);
    return {
      studentId:          studentPin || s.studentId,
      userId:             s.userId,
      fullName:           user?.fullName ?? "—",
      email:              user?.email    ?? "—",
      mobile:             user?.mobile   ?? "—",
      gender:             user?.gender   ?? "—",
      collegeEducationId: s.collegeEducationId,
      eduType:            eduList.find((e: any) => e.collegeEducationId === s.collegeEducationId)?.collegeEducationType ?? "N/A",
      collegeBranchId:    s.collegeBranchId,
      branchCode:         branchMap.get(s.collegeBranchId) ?? "—",
      academicYear:       yearLabel,
      supportAdmin:       adminMap.get(s.createdBy) ?? "—",
      entryType:          s.entryType ?? "—",
      status:             s.status    ?? "Active",
      isActive:           s.isActive,
    };
  });

  // 8. Distributions — HR count from college_hr (same as getFacultyListData)
  const hrCount = (hrData ?? []).length;

  const distributions: EduTypeDistribution[] = eduList.map((edu: any) => {
    const eduId         = edu.collegeEducationId;
    const adminsCount   = (adminData      ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
    const studentsCount = (allStudentData ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
    const parentsCount  = (parentData     ?? []).filter((r: any) => (r.students as any)?.collegeEducationId === eduId).length;
    const facultyCount  = (facultyData    ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
    const financeCount  = (financeData    ?? []).filter((r: any) => r.collegeEducationId === eduId).length;
    return {
      collegeEducationId: eduId,
      eduType:    edu.collegeEducationType,
      admins:     adminsCount,
      students:   studentsCount,
      parents:    parentsCount,
      faculty:    facultyCount,
      finance:    financeCount,
      placement:  0,
      collegeHr:  hrCount,
      totalUsers: adminsCount + studentsCount + parentsCount + facultyCount + financeCount + hrCount,
    };
  });

  // 9. Summary for stat cards
  const summary = {
    admins:            (adminData      ?? []).length,
    students:          (allStudentData ?? []).length,
    parents:           (parentData     ?? []).length,
    faculty:           (facultyData    ?? []).length,
    financeManagers:   (financeData    ?? []).length,
    hrExecutives:      hrCount,
    placementManagers: 0,
  };

  return {
    totalStudents: allStudentData?.length ?? 0,
    totalCount,
    distributions,
    students,
    branches:      branchData       ?? [],
    academicYears: academicYearData ?? [],
    admins:        adminData        ?? [],
    summary,
  };
}
