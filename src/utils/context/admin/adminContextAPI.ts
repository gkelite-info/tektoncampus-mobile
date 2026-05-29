import { supabase } from "@/lib/supabaseClient";

type AdminJoin = {
    adminId: number;
    userId: number;
    collegeId: number;
    collegePublicId: string;
    collegeCode: string;
    collegeEducationId: number;

    college_edu_type: {
        collegeEducationType: string;
    };

    college: {
        collegeCode: string;
    };
};

export async function fetchAdminContext(userId: number | null) {
    const { data: admin, error } = await supabase
        .from("admins")
        .select(`
      adminId,
      userId,
      collegeId,
      collegePublicId,
      collegeEducationId,

      college:collegeId!inner (
        collegeCode
      ),

      college_edu_type:collegeEducationId!inner (
        collegeEducationType
      )
    `)
        .eq("userId", userId)
        .is("deletedAt", null)
        .single<AdminJoin>();

    if (error) throw error;

    return {
        adminId: admin.adminId,
        userId: admin.userId,
        collegeId: admin.collegeId,
        collegePublicId: admin.collegePublicId,
        collegeCode: admin.college.collegeCode,
        collegeEducationId: admin.collegeEducationId,
        collegeEducationType: admin.college_edu_type.collegeEducationType,
    };
}