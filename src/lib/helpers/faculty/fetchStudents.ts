import { supabase } from "@/lib/supabaseClient";

export async function fetchStudentsWithProfile(
    collegeId: number,
    filters?: { branchId?: number; sectionId?: number; yearId?: number }
) {
    let query = supabase
        .from("students")
        .select(`
            studentId,
            userId,
            collegeBranchId,
            status,
            users (
                fullName,
                user_profile (
                    profileUrl
                )
            ),
            student_academic_history!inner ( 
                collegeSectionsId,
                collegeAcademicYearId,
                isCurrent
            )
        `)
        .eq("collegeId", collegeId)
        .eq("isActive", true)
        .is("deletedAt", null)
        .eq("student_academic_history.isCurrent", true);

    if (filters?.sectionId) {
        query = query.eq("student_academic_history.collegeSectionsId", filters.sectionId);
    }

    if (filters?.yearId) {
        query = query.eq("student_academic_history.collegeAcademicYearId", filters.yearId);
    }

    const { data: students, error } = await query;
    if (error) throw error;

    return students?.map((s: any) => {
        const profileData = s.users?.user_profile?.[0] || s.users?.user_profile;
        return {
            id: s.studentId,
            name: s.users?.fullName || `Student ${s.studentId}`,
            image: profileData?.profileUrl || null,
            ...s
        };
    }) ?? [];
}
