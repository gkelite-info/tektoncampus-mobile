import { supabase } from "@/lib/supabaseClient";

export interface EmploymentPayload {
    studentId: number;
    companyName: string;
    designation: string;
    experienceYears: number;
    experienceMonths: number;
    startDate: string;       // YYYY-MM-DD
    endDate: string | null;  // ✅ FIXED (allow NULL)
    description?: string;
    updatedAt: string;
}

export interface EmploymentInsertPayload extends EmploymentPayload {
    createdAt: string;
}

// ── READ ──────────────────────────────────────────────────────────────────────

export async function getEmployment(studentId: number) {
    const { data, error } = await supabase
        .from("resume_employment_details")
        .select(
            `employmentId,
       companyName,
       designation,
       experienceYears,
       experienceMonths,
       startDate,
       endDate,
       description`
        )
        .eq("studentId", studentId)
        .eq("is_deleted", false)
        .order("employmentId", { ascending: true });

    if (error) {
        console.error("getEmployment error:", error.message);
        throw error;
    }

    return data ?? [];
}

// ── CREATE ────────────────────────────────────────────────────────────────────

export async function addEmployment(
    payload: EmploymentInsertPayload
): Promise<{ employmentId: number }> {

    const { data, error } = await supabase
        .from("resume_employment_details")
        .insert({
            studentId: payload.studentId,
            companyName: payload.companyName,
            designation: payload.designation,
            experienceYears: payload.experienceYears,
            experienceMonths: payload.experienceMonths,
            startDate: payload.startDate,
            endDate: payload.endDate ?? null,
            description: payload.description ?? null,
            is_deleted: false,
            createdAt: payload.createdAt,
            updatedAt: payload.updatedAt,
        })
        .select("employmentId");

    if (error || !data || data.length === 0) {
        console.error("❌ INSERT FAILED:", error);
        throw new Error(error?.message || "Insert failed");
    }

    return data[0];
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

export async function updateEmployment(
    employmentId: number,
    payload: Partial<EmploymentPayload>
) {
    const { error } = await supabase
        .from("resume_employment_details")
        .update({
            ...payload,
            endDate: payload.endDate ?? null, // ✅ ENSURE NULL (no "current")
            updatedAt: new Date().toISOString(),
        })
        .eq("employmentId", employmentId)
        .eq("is_deleted", false);

    if (error) {
        console.error("updateEmployment error:", error.message);
        throw error;
    }
}

// ── DELETE (soft) ─────────────────────────────────────────────────────────────

export async function deleteEmployment(employmentId: number) {
    const { error } = await supabase
        .from("resume_employment_details")
        .update({
            is_deleted: true,
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
        .eq("employmentId", employmentId);

    if (error) {
        console.error("deleteEmployment error:", error.message);
        throw error;
    }
}