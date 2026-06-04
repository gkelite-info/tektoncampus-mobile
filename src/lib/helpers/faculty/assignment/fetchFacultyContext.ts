import { supabase } from "@/lib/supabaseClient";

export async function fetchFacultyContext(userId: number) {
  // 1. Fetch Basic Faculty Info
  const { data: faculty, error: facultyError } = await supabase
    .from("faculty")
    .select(
      `
      facultyId,
      userId,
      fullName,
      role,
      collegeId,
      isActive
    `,
    )
    .eq("userId", userId)
    .is("deletedAt", null)
    .single();

  if (facultyError) throw facultyError;

  const { data: facultySections, error: sectionsError } = await supabase
    .from("faculty_sections")
    .select(
      `
      facultySectionId,
      collegeSectionsId,
      collegeSubjectId,
      collegeAcademicYearId,
      college_subjects (subjectName, subjectCode),
      college_sections (
        collegeSections,
        collegeBranchId, 
        college_branch (collegeBranchCode, collegeBranchType)
      ),
      college_academic_year (collegeAcademicYear)
    `,
    )
    .eq("facultyId", faculty.facultyId)
    .eq("isActive", true)
    .is("deletedAt", null);

  if (sectionsError) throw sectionsError;

  return {
    ...faculty,
    sections: facultySections || [],
  };
}
