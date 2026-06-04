import { supabase } from "@/lib/supabaseClient";

export async function updateSubmissionEvaluation(
  submissionId: number,
  payload: {
    marksScored: number;
    feedback: string;
    status: "Evaluated" | "Pending";
  },
) {
  return supabase
    .from("student_assignments_submission")
    .update({
      ...payload,
      updatedAt: new Date().toISOString(),
    })
    .eq("studentAssignmentSubmissionId", submissionId);
}
