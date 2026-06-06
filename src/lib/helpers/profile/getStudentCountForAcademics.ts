import { supabase } from "@/lib/supabaseClient";

export async function getStudentCountForAcademics(params: {
  collegeId: number;
  collegeAcademicYearId?: number;
  collegeSemesterId?: number;
  collegeSectionsId?: number;
}) {

  let query = supabase
    .from("student_academic_history")
    .select("studentAcademicHistoryId", {
      count: "exact",
      head: true,
    })
    .eq("isCurrent", true)
    .is("deletedAt", null);
  if (params.collegeAcademicYearId) {
    query = query.eq(
      "collegeAcademicYearId",
      params.collegeAcademicYearId
    );
  }

  if (params.collegeSemesterId) {
    query = query.eq("collegeSemesterId", params.collegeSemesterId);
  }

  if (params.collegeSectionsId) {
    query = query.eq("collegeSectionsId", params.collegeSectionsId);
  }

  const { count, error } = await query;
  if (error) {
    return 0;
  }

  return count ?? 0;
}
