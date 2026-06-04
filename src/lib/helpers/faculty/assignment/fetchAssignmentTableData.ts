import { supabase } from "@/lib/supabaseClient";

export async function fetchAssignmentTableData(assignmentId: string, page: number = 1, limit: number = 10) {
  const { data: assign, error: assignErr } = await supabase
    .from("assignments")
    .select("collegeBranchId, marks")
    .eq("assignmentId", assignmentId)
    .single();

  if (assignErr) throw assignErr;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: students, count: totalCount, error: studentError } = await supabase
    .from("students")
    .select(`studentId, student_pins ( pinNumber ), users (fullName, email, userId, user_profile ( profileUrl, is_deleted ))`)
    .eq("collegeBranchId", assign.collegeBranchId)
    .eq("isActive", true);

  if (studentError) throw studentError;

  const studentIds = students?.map(s => s.studentId) || [];

  const { data: submissions, error: submissionError } = await supabase
    .from("student_assignments_submission")
    .select("*")
    .eq("assignmentId", assignmentId)
    .in("studentId", studentIds.length > 0 ? studentIds : [0]);

  if (submissionError) throw submissionError;

  return { students, submissions, totalCount: totalCount || 0 };
}
