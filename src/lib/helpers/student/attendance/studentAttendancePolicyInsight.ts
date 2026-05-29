
import { supabase } from "@/lib/supabaseClient";
import { AttendancePolicyMessageResult, buildAttendancePolicyMessage } from "../../attendance/attendancePolicyMessage";

type StudentAttendanceContext = {
    collegeEducationId: number;
    collegeBranchId: number;
    collegeAcademicYearId: number;
    collegeSemesterId: number | null;
};

type StudentAttendancePolicyInsightInput = {
    userId: number;
    context: StudentAttendanceContext;
    attendedClasses: number;
    totalClasses: number;
};

export type StudentAttendancePolicyInsight = AttendancePolicyMessageResult;

async function fetchStudentName(userId: number) {
    const { data } = await supabase
        .from("users")
        .select("fullName")
        .eq("userId", userId)
        .maybeSingle();

    return data?.fullName || "Student";
}

async function fetchMinAttendance(context: StudentAttendanceContext) {
    if (!context.collegeSemesterId) return null;

    const { data, error } = await supabase
        .from("college_attendance_policies")
        .select("minAttendance")
        .eq("collegeEducationId", context.collegeEducationId)
        .eq("collegeBranchId", context.collegeBranchId)
        .eq("collegeAcademicYearId", context.collegeAcademicYearId)
        .eq("collegeSemesterId", context.collegeSemesterId)
        .eq("isActive", true)
        .eq("is_deleted", false)
        .is("deletedAt", null)
        .maybeSingle();

    if (error) {
        console.error("Student attendance policy fetch error:", error);
        return null;
    }

    return data?.minAttendance ?? null;
}

export async function buildStudentAttendancePolicyInsight({
    userId,
    context,
    attendedClasses,
    totalClasses,
}: StudentAttendancePolicyInsightInput) {
    const [studentName, minAttendance] = await Promise.all([
        fetchStudentName(userId),
        fetchMinAttendance(context),
    ]);

    return buildAttendancePolicyMessage({
        studentName,
        attendedClasses,
        totalClasses,
        minAttendance,
        audience: "student",
    });
}
