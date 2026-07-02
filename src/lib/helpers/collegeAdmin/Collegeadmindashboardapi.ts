import { supabase } from "@/lib/supabaseClient";

const formatDateOfJoining = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return "—";
  }
};

export type AdminDetail = {
  adminId: number;
  fullName: string;
  email: string;
  mobile: string;
  gender: string;
  dateOfJoining: string;
  collegeEducationId: number;
  eduType: string;
  branchCount: number;
  isActive: boolean;
};

export type EduTypeStat = {
  collegeEducationId: number;
  eduType: string;
  adminCount: number;
  branchCount: number;
};

export type DashboardStats = {
  educationTypeCount: number;
  totalAdmins: number;
  totalBranches: number;
  totalUsers: number;
  eduTypeStats: EduTypeStat[];
  adminDetails: AdminDetail[];
};

export async function fetchCollegeAdminDashboardStats(
  collegeId: number,
): Promise<DashboardStats> {
  const [eduRes, adminsRes, branchRes, usersRes] = await Promise.all([
    supabase
      .from("college_education")
      .select("collegeEducationId, collegeEducationType")
      .eq("collegeId", collegeId)
      .eq("isActive", true),

    supabase
      .from("admins")
      .select(
        `
        adminId,
        fullName,
        email,
        mobile,
        gender,
        collegeEducationId,
        is_deleted,
        college_education ( collegeEducationType )
      `,
      )
      .eq("collegeId", collegeId)
      .eq("is_deleted", false),

    supabase
      .from("college_branch")
      .select("collegeBranchId, collegeEducationId")
      .eq("collegeId", collegeId)
      .eq("isActive", true),

    supabase
      .from("users")
      .select("userId, email, dateOfJoining", { count: "exact" })
      .eq("collegeId", collegeId)
      .eq("is_deleted", false),
  ]);

  if (eduRes.error) throw eduRes.error;
  if (adminsRes.error) throw adminsRes.error;
  if (branchRes.error) throw branchRes.error;
  if (usersRes.error) throw usersRes.error;

  const eduList = eduRes.data ?? [];
  const adminList = adminsRes.data ?? [];
  const branchList = branchRes.data ?? [];
  const userList = usersRes.data ?? [];
  const totalUsers = usersRes.count ?? 0;

  const userDateOfJoiningMap = new Map<string, string | null>(
    userList.map((u: any) => [u.email, u.dateOfJoining]),
  );

  const eduTypeStats: EduTypeStat[] = eduList.map((edu) => ({
    collegeEducationId: edu.collegeEducationId,
    eduType: edu.collegeEducationType,
    adminCount: adminList.filter(
      (a) => a.collegeEducationId === edu.collegeEducationId,
    ).length,
    branchCount: branchList.filter(
      (b) => b.collegeEducationId === edu.collegeEducationId,
    ).length,
  }));

  const adminDetails: AdminDetail[] = adminList.map((a: any) => {
    const eduStat = eduTypeStats.find(
      (e) => e.collegeEducationId === a.collegeEducationId,
    );
    const dateOfJoining = userDateOfJoiningMap.get(a.email);

    return {
      adminId: a.adminId,
      fullName: a.fullName,
      email: a.email,
      mobile: a.mobile,
      gender: a.gender ?? "—",
      dateOfJoining: formatDateOfJoining(dateOfJoining),
      collegeEducationId: a.collegeEducationId,
      eduType: (a.college_education as any)?.collegeEducationType ?? "N/A",
      branchCount: eduStat?.branchCount ?? 0,
      isActive: true,
    };
  });

  return {
    educationTypeCount: eduList.length,
    totalAdmins: adminList.length,
    totalBranches: branchList.length,
    totalUsers,
    eduTypeStats,
    adminDetails,
  };
}
