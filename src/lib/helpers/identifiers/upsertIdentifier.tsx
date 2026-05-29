import { supabase } from "@/lib/supabaseClient";

type UpsertIdentifierParams = {
    userId: number | null;
    studentId?: number;
    collegeId: number;
    role: string;
    identifierValue: string;
};

const getEmployeeIdentifierType = (role: string) =>
    role === "FinanceManager" ? "Finance Manager" : role;

async function getExistingStudentPin(
    studentId: number,
    collegeId: number
) {
    const { data, error } = await supabase
        .from("student_pins")
        .select("studentPinId")
        .eq("studentId", studentId)
        .eq("collegeId", collegeId)
        .maybeSingle();

    if (error) throw error;

    return data;
}

async function getExistingEmployeeId(
    userId: number,
    collegeId: number
) {

    const { data, error } = await supabase
        .from("employee_ids")
        .select("employeeIdPk")
        .eq("userId", userId)
        .eq("collegeId", collegeId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function upsertIdentifier({
    userId,
    studentId,
    collegeId,
    role,
    identifierValue,
}: UpsertIdentifierParams) {

    const value = identifierValue.trim().toUpperCase();
    const now = new Date().toISOString();

    if (role === "Student") {
        if (!studentId) {
            throw new Error("studentId required");
        }
        const existing = await getExistingStudentPin(
            studentId,
            collegeId
        );

        if (existing) {
            const { error } = await supabase
                .from("student_pins")
                .update({
                    pinNumber: value,
                    isActive: true,
                    deletedAt: null,
                    updatedAt: now,
                })
                .eq("studentId", studentId)
                .eq("collegeId", collegeId);
            if (error) throw error;
            return;
        }

        const { error } = await supabase
            .from("student_pins")
            .insert({
                studentId,
                collegeId,
                pinNumber: value,
                isActive: true,
                createdAt: now,
                updatedAt: now,
            });
        if (error) throw error;
        return;
    }

    if (role !== "Parent") {
        const employeeType = getEmployeeIdentifierType(role);
        const existing = await getExistingEmployeeId(
            userId!,
            collegeId
        );

        if (existing) {
            const { error } = await supabase
                .from("employee_ids")
                .update({
                    employeeId: value,
                    employeeType,
                    isActive: true,
                    deletedAt: null,
                    updatedAt: now,
                })
                .eq("userId", userId)
                .eq("collegeId", collegeId);
            if (error) throw error;
            return;
        }

        const { error } = await supabase
            .from("employee_ids")
            .insert({
                userId,
                collegeId,
                employeeId: value,
                employeeType,
                isActive: true,
                createdAt: now,
                updatedAt: now,
            });
        if (error) throw error;
    }
}


export async function getStudentRollNo(
    studentId: number,
    collegeId: number
): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from("student_pins")
            .select("pinNumber")
            .eq("studentId", studentId)
            .eq("collegeId", collegeId)
            .eq("isActive", true)
            .is("deletedAt", null)
            .maybeSingle();

        if (error) {
            console.error("[getStudentRollNo] DB error:", error.message);
            return null;
        }
        return data?.pinNumber ?? null;
    } catch (err) {
        console.error("[getStudentRollNo] Unexpected error:");
        return null;
    }
}

export async function getEmployeeEmpId(
    userId: number,
    collegeId: number
): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from("employee_ids")
            .select("employeeId")
            .eq("userId", userId)
            .eq("collegeId", collegeId)
            .eq("isActive", true)
            .is("deletedAt", null)
            .maybeSingle();

        if (error) {
            console.error("[getEmployeeEmpId] DB error:", error.message);
            return null;
        }
        return data?.employeeId ?? null;
    } catch (err) {
        console.error("[getEmployeeEmpId] Unexpected error:");
        return null;
    }
}
