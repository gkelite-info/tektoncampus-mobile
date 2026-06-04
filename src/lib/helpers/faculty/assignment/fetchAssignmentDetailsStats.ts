import { supabase } from "@/lib/supabaseClient";

export const fetchAssignmentDetailsStats = async (
  assignmentId: string | number,
) => {
  try {
    const { data: assignmentData, error: assignmentError } = await supabase
      .from("assignments")
      .select("*")
      .eq("assignmentId", assignmentId)
      .single();

    if (assignmentError) throw assignmentError;

    const { count: submittedCount, error: subError } = await supabase
      .from("student_assignments_submission")
      .select("*", { count: "exact", head: true })
      .eq("assignmentId", assignmentId);

    if (subError) throw subError;

    const { count: expectedCount, error: expError } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("collegeBranchId", assignmentData.collegeBranchId)
      .eq("collegeAcademicYearId", assignmentData.collegeAcademicYearId)
      .eq("isActive", true);

    if (expError) throw expError;

    return {
      data: {
        ...assignmentData,
        totalSubmitted: submittedCount || 0,
        totalSubmissionsExpected: expectedCount || 0,
      },
      error: null,
    };
  } catch (err: any) {
    console.error("Error fetching detail stats:", err.message);
    return { data: null, error: err.message };
  }
};
