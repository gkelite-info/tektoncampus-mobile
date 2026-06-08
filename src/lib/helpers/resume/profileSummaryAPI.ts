import { supabase } from "@/lib/supabaseClient";

export async function getProfileSummary(studentId: number) {
    const { data, error } = await supabase
        .from("resume_profile_summary")
        .select("resumeSummaryId, summary")
        .eq("studentId", studentId)
        .eq("is_deleted", false)
        .maybeSingle();

    if (error && error.code !== "PGRST116") {
        console.error("getProfileSummary error:", JSON.stringify(error, null, 2));
        throw error;
    }
    return data;
}

export async function insertProfileSummary(
    studentId: number,
    summary: string
): Promise<{ resumeSummaryId: number }> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("resume_profile_summary")
        .insert({
            studentId,
            summary,
            is_deleted: false,
            createdAt: now,
            updatedAt: now,
        })
        .select("resumeSummaryId")
        .single();

    if (error) {
        console.error("insertProfileSummary error:", JSON.stringify(error, null, 2));
        console.error("code:", error.code);
        console.error("message:", error.message);
        console.error("details:", error.details);
        console.error("hint:", error.hint);
        throw error;
    }

    return data;
}

export async function upsertProfileSummary(
    studentId: number,
    summary: string
): Promise<{ resumeSummaryId: number }> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("resume_profile_summary")
        .upsert(
            {
                studentId,
                summary,
                is_deleted: false,
                updatedAt: now,
            },
            {
                onConflict: "studentId",
            }
        )
        .select("resumeSummaryId")
        .single();

    if (error) {
        console.error("upsertProfileSummary error:", JSON.stringify(error, null, 2));
        console.error("code:", error.code);
        console.error("message:", error.message);
        console.error("details:", error.details);
        console.error("hint:", error.hint);
        throw error;
    }

    return data;
}

export async function updateProfileSummary(studentId: number, summary: string) {
    const { error } = await supabase
        .from("resume_profile_summary")
        .update({
            summary,
            updatedAt: new Date().toISOString(),
        })
        .eq("studentId", studentId)
        .eq("is_deleted", false);

    if (error) {
        console.error("updateProfileSummary error:", JSON.stringify(error, null, 2));
        console.error("code:", error.code);
        console.error("message:", error.message);
        throw error;
    }
}

export async function deleteProfileSummary(studentId: number) {
    const { error } = await supabase
        .from("resume_profile_summary")
        .update({
            is_deleted: true,
            deletedAt: new Date().toISOString(),
        })
        .eq("studentId", studentId);

    if (error) {
        console.error("deleteProfileSummary error:", JSON.stringify(error, null, 2));
        throw error;
    }
}
