import { supabase } from "@/lib/supabaseClient";

export async function fetchFilteredFaculties(params: { collegeId: number }) {
    const { data, error } = await supabase
        .from("faculty")
        .select(`
            facultyId,
            userId,
            users!inner (
                fullName,
                user_profile (
                    profileUrl
                )
            )
        `)
        .eq("collegeId", params.collegeId)
        .eq("isActive", true)
        .is("deletedAt", null);

    if (error) throw error;

    return {
        data: data?.map((f: any) => {
            const profileData = f.users?.user_profile?.[0] || f.users?.user_profile;
            return {
                id: f.facultyId,
                name: f.users?.fullName || `Faculty ${f.facultyId}`,
                image: profileData?.profileUrl || null,
            };
        }) ?? []
    };
}
