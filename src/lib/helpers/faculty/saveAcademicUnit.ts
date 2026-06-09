import { supabase } from "@/lib/supabaseClient";

export async function saveAcademicUnit(params: {
  collegeId: number;
  collegeEducationId: number;
  collegeBranchId: number;
  collegeAcademicYearId: number;
  collegeSemesterId: number;
  collegeSubjectId: number;
  collegeSectionId: number;
  collegeSubjectUnitId: number;
  createdBy: number;
}) {
  const { error } = await supabase.from("academics").insert({
    collegeId: params.collegeId,
    collegeEducationId: params.collegeEducationId,
    collegeBranchId: params.collegeBranchId,
    collegeAcademicYearId: params.collegeAcademicYearId,
    collegeSemesterId: params.collegeSemesterId,
    collegeSubjectId: params.collegeSubjectId,
    collegeSectionsId: params.collegeSectionId,
    collegeSubjectUnitId: params.collegeSubjectUnitId,
    createdBy: params.createdBy,
    isAdmin: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (error) throw error;
}
