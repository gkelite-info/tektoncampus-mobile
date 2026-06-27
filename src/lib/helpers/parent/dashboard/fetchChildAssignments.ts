import { supabase } from "@/lib/supabaseClient";

export async function fetchChildAssignmentStats(childUserId: number) {
  try {
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select(
        `
        studentId,
        collegeBranchId,
        student_academic_history (
          collegeAcademicYearId,
          collegeSectionsId,
          isCurrent
        )
      `,
      )
      .eq("userId", childUserId)
      .single();

    if (studentError || !studentData) throw new Error("Student not found");

    const studentId = studentData.studentId;
    const branchId = studentData.collegeBranchId;

    const activeHistory = studentData.student_academic_history?.find(
      (h: any) => h.isCurrent === true,
    );
    const yearId = activeHistory?.collegeAcademicYearId;
    const sectionId = activeHistory?.collegeSectionsId;

    let assignQuery = supabase
      .from("assignments")
      .select("assignmentId, submissionDeadlineInt")
      .eq("collegeBranchId", branchId)
      .eq("is_deleted", false)
      .neq("status", "Cancelled");

    if (yearId) assignQuery = assignQuery.eq("collegeAcademicYearId", yearId);
    if (sectionId) assignQuery = assignQuery.eq("collegeSectionsId", sectionId);

    const { data: assignments, error: assignError } = await assignQuery;
    if (assignError) throw assignError;

    const totalAssignments = assignments?.length || 0;

    const { count: completedCount, error: subError } = await supabase
      .from("student_assignments_submission")
      .select("*", { count: "exact", head: true })
      .eq("studentId", studentId)
      .is("deletedAt", null);

    if (subError) throw subError;

    const todayDate = new Date();
    const todayInt = parseInt(
      todayDate.getFullYear().toString() +
        String(todayDate.getMonth() + 1).padStart(2, "0") +
        String(todayDate.getDate()).padStart(2, "0"),
    );

    let nextDateStr = "N/A";

    if (assignments && assignments.length > 0) {
      const upcoming = assignments
        .filter((a) => a.submissionDeadlineInt >= todayInt)
        .sort((a, b) => a.submissionDeadlineInt - b.submissionDeadlineInt);

      if (upcoming.length > 0) {
        const nextInt = upcoming[0].submissionDeadlineInt;
        const year = Math.floor(nextInt / 10000);
        const month = Math.floor((nextInt % 10000) / 100);
        const day = nextInt % 100;

        const dateObj = new Date(year, month - 1, day);
        nextDateStr = dateObj.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }

    return {
      completed: completedCount || 0,
      total: totalAssignments,
      nextDate: nextDateStr,
    };
  } catch (error) {
    console.error("Error fetching assignment stats:", error);
    return { completed: 0, total: 0, nextDate: "N/A" };
  }
}
