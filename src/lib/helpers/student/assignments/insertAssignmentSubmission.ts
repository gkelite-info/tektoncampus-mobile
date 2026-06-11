import { supabase } from "@/lib/supabaseClient";

type InsertSubmissionParams = {
    assignmentId: number;
    filePath: string;
};

export async function insertAssignmentSubmission({
    assignmentId,
    filePath,
}: InsertSubmissionParams) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data: userRow, error: userErr } = await supabase
            .from("users")
            .select("userId")
            .eq("auth_id", user.id)
            .single();

        if (userErr || !userRow) {
            throw new Error("Internal user not found");
        }

        const { data: student, error: studentErr } = await supabase
            .from("students")
            .select("studentId")
            .eq("userId", userRow.userId)
            .single();

        if (studentErr || !student) {
            throw new Error("Student not found");
        }

        const { data: existing } = await supabase
            .from("student_assignments_submission")
            .select("studentAssignmentSubmissionId")
            .eq("studentId", student.studentId)
            .eq("assignmentId", assignmentId)
            .is("deletedAt", null)
            .maybeSingle();

        const payload = {
            studentId: student.studentId,
            assignmentId,
            submittedOn: new Date().toISOString().split("T")[0],
            file: filePath,
            status: "Pending",
            updatedAt: new Date().toISOString(),
        };

        const query = existing
            ? supabase
                .from("student_assignments_submission")
                .update(payload)
                .eq(
                    "studentAssignmentSubmissionId",
                    existing.studentAssignmentSubmissionId
                )
            : supabase
                .from("student_assignments_submission")
                .insert({
                    ...payload,
                    createdAt: new Date().toISOString(),
                });

        const { data, error } = await query.select().single();
        if (error) throw error;

        return { success: true, data };

    } catch (err: any) {
        console.error("❌ Submission upsert failed:", err);
        return { success: false, error: err.message };
    }
}

export async function getSubmissionForAssignment(assignmentId: number) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: userRow } = await supabase
        .from("users")
        .select("userId")
        .eq("auth_id", user.id)
        .single();

    if (!userRow) return null;

    const { data: student } = await supabase
        .from("students")
        .select("studentId")
        .eq("userId", userRow.userId)
        .single();

    if (!student) return null;

    const { data } = await supabase
        .from("student_assignments_submission")
        .select("file, studentId, assignmentId, deletedAt")
        .eq("studentId", student.studentId)
        .eq("assignmentId", assignmentId)
        .is("deletedAt", null)
        .maybeSingle();

    return data?.file ?? null;
}

export async function getSubmissionDetailsForAssignment(assignmentId: number) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: userRow } = await supabase
        .from("users")
        .select("userId")
        .eq("auth_id", user.id)
        .single();

    if (!userRow) return null;

    const { data: student } = await supabase
        .from("students")
        .select("studentId")
        .eq("userId", userRow.userId)
        .single();

    if (!student) return null;

    const { data } = await supabase
        .from("student_assignments_submission")
        .select("file, marksScored, status")
        .eq("studentId", student.studentId)
        .eq("assignmentId", assignmentId)
        .is("deletedAt", null)
        .maybeSingle();

    return data ?? null;
}

export async function deleteAssignmentSubmission(assignmentId: number, studentId: number) {
    try {
        const { error } = await supabase
            .from("student_assignments_submission")
            .update({
                deletedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .eq("assignmentId", assignmentId)
            .eq("studentId", studentId)
            .is("deletedAt", null);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        console.error("deleteAssignmentSubmission error:", err);
        return { success: false, error: err.message };
    }
}
