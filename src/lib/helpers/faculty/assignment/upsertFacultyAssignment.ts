import { supabase } from "@/lib/supabaseClient";

export const upsertFacultyAssignment = async (payload: any) => {
  try {
    const {
      assignmentId,
      facultyId,
      subjectId,
      topicName,
      dateAssigned,
      submissionDeadline,
      collegeBranchId,
      collegeAcademicYearId,
      collegeSectionsId,
      marks,
    } = payload;

    const now = new Date().toISOString();

    const dbPayload = {
      createdBy: facultyId,
      subjectId: Number(subjectId),
      topicName: topicName,
      dateAssignedInt: convertToInt(dateAssigned),
      submissionDeadlineInt: convertToInt(submissionDeadline),
      collegeBranchId: Number(collegeBranchId),
      collegeAcademicYearId: Number(collegeAcademicYearId),
      collegeSectionsId: Number(collegeSectionsId),
      marks: Number(marks),
      status: "Active",
      updatedAt: now,
    };

    if (assignmentId) {
      const { data, error } = await supabase
        .from("assignments")
        .update(dbPayload)
        .eq("assignmentId", assignmentId)
        .select();

      if (error) throw error;

      return {
        success: true,
        message: "Assignment updated successfully",
        data,
      };
    }

    const { data, error } = await supabase
      .from("assignments")
      .insert({
        ...dbPayload,
        is_deleted: false,
        createdAt: now,
      })
      .select();

    if (error) throw error;

    return {
      success: true,
      message: "Assignment created successfully",
      data,
    };
  } catch (err: any) {
    console.error("UPSERT ASSIGNMENT ERROR:", err);
    return { success: false, error: err.message };
  }
};

function convertToInt(dateStr: string) {
  if (!dateStr) return 0;
  return Number(dateStr.replace(/-/g, ""));
}
