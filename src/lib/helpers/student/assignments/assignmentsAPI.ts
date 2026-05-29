import { supabase } from "@/lib/supabaseClient";

type AssignmentFilters = {
    collegeBranchId: number;
    collegeAcademicYearId: number;
    collegeSectionsId: number;
};

export const fetchAssignmentsForStudent = async (
    filters: AssignmentFilters,
    page: number,
    limit: number,
    type: "active" | "previous"
) => {
    try {
        const { collegeBranchId, collegeAcademicYearId, collegeSectionsId } = filters;

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const today = new Date();
        const todayInt = Number(
            `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`
        );

        let query = supabase
            .from("assignments")
            .select(
                `
        assignmentId,
        topicName,
        dateAssignedInt,
        submissionDeadlineInt,
        marks,
        status,

        subject:subjectId (
          subjectName
        ),

        faculty:createdBy (
          facultyId,
          user:userId (
            fullName
          )
        )
      `,
                { count: "exact" }
            )
            .eq("collegeBranchId", collegeBranchId)
            .eq("collegeAcademicYearId", collegeAcademicYearId)
            .eq("collegeSectionsId", collegeSectionsId)
            .eq("is_deleted", false);

        if (type === "active") {
            query = query.gte("submissionDeadlineInt", todayInt);
        } else if (type === "previous") {
            query = query.lt("submissionDeadlineInt", todayInt);
        }

        const { data, error, count } = await query
            .order("dateAssignedInt", { ascending: false })
            .range(from, to);

        if (error) throw error;

        return {
            success: true,
            assignments: data ?? [],
            totalCount: count ?? 0,
        };

    } catch (err: any) {
        return {
            success: false,
            assignments: [],
            totalCount: 0,
            error: err.message,
        };
    }
};