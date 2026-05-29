import { supabase } from "@/lib/supabaseClient";

type FinanceManagerJoin = {
    financeManagerId: number;
    userId: number;
    collegeId: number;
    collegeEducationId: number;
    isActive: boolean;

    college: {
        collegeName: string;
    };

    college_education: {
        collegeEducationType: string;
    };
};

export async function fetchFinanceManagerContext(userId: number) {
    const { data, error } = await supabase
        .from("finance_manager")
        .select(`
      financeManagerId,
      userId,
      collegeId,
      collegeEducationId,
      isActive,
      college:collegeId!inner (
        collegeName
      ),
      college_education:collegeEducationId!inner (
        collegeEducationType
      )
    `)
        .eq("userId", userId)
        .eq("is_deleted", false)
        .is("deletedAt", null)
        .single<FinanceManagerJoin>();

    if (error) throw error;

    return {
        financeManagerId: data.financeManagerId,
        userId: data.userId,
        collegeId: data.collegeId,
        collegeEducationId: data.collegeEducationId,
        collegeName: data.college.collegeName,
        collegeEducationType: data.college_education.collegeEducationType,
        isActive: data.isActive,
    };
}
