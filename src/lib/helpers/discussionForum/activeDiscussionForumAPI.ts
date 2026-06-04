import { supabase } from "@/lib/supabaseClient";

export async function fetchActiveDiscussionCount(
    collegeBranchId: number,
    collegeAcademicYearId: number
) {
    try {
        const today = new Date().toISOString().split("T")[0];

        const { count, error } = await supabase
            .from("discussion_forum_sections")
            .select(`
        discussionId,
        college_sections!inner(
          collegeBranchId,
          collegeAcademicYearId
        ),
        discussion_forum!inner(
          isActive,
          is_deleted
        )
      `, { count: "exact", head: true })
            .eq("college_sections.collegeBranchId", collegeBranchId)
            .eq("college_sections.collegeAcademicYearId", collegeAcademicYearId)
            .eq("discussion_forum.isActive", true)
            .eq("discussion_forum.is_deleted", false)
            .gte("discussion_forum.deadline", today)
            .eq("isActive", true)
            .eq("is_deleted", false);

        if (error) {
            console.error("fetchActiveDiscussionCount error:", error);
            return 0;
        }

        return count || 0;
    } catch (err) {
        console.error("Unexpected error fetching discussion count:", err);
        return 0;
    }
}