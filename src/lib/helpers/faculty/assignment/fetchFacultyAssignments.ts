import { supabase } from "@/lib/supabaseClient";

export const fetchFacultyAssignments = async (
  facultyId: number,
  tab: "Active" | "Evaluated",
  page: number = 1,
  limit: number = 10,
) => {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const selectQuery =
      tab === "Evaluated"
        ? `*, college_subjects (subjectName, subjectCode), student_assignments_submission!inner(status), submissions_count:student_assignments_submission(count)`
        : `*, college_subjects (subjectName, subjectCode), submissions_count:student_assignments_submission(count)`;

    let query = supabase
      .from("assignments")
      .select(selectQuery, { count: "exact" })
      .eq("createdBy", facultyId)
      .eq("is_deleted", false)
      .eq("status", "Active");

    if (tab === "Evaluated") {
      query = query.eq("student_assignments_submission.status", "Evaluated");
    }

    const { data, error, count } = await query
      .order("assignmentId", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const enrichedData = await Promise.all(
      (data || []).map(async (assignment: any) => {
        const { count: expectedStudentsCount, error: stuError } = await supabase
          .from("students")
          .select(
            "studentId, student_academic_history!inner(collegeAcademicYearId, collegeSectionsId)",
            { count: "exact", head: true },
          )
          .eq("collegeBranchId", assignment.collegeBranchId)
          .eq(
            "student_academic_history.collegeAcademicYearId",
            assignment.collegeAcademicYearId,
          )
          .eq(
            "student_academic_history.collegeSectionsId",
            assignment.collegeSectionsId,
          )
          .eq("student_academic_history.isCurrent", true)
          .eq("isActive", true);

        if (stuError)
          console.error("Error fetching student count:", stuError.message);

        const actualSubmissionsCount =
          assignment.submissions_count?.[0]?.count || 0;

        return {
          ...assignment,
          actualSubmissionsCount,
          expectedStudentsCount: expectedStudentsCount || 0,
        };
      }),
    );

    return { data: enrichedData, count, error: null };
  } catch (err: any) {
    console.error("Fetch Error:", err.message);
    return { data: null, count: 0, error: err.message };
  }
};
