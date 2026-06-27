import { supabase } from "@/lib/supabaseClient";

/* ---------- TYPES ---------- */

type StudentRow = {
    studentId: number;
    userId: number;
    collegeBranchId: number;

    users: {
        fullName: string;
        email: string;
        mobile: string;
    };

    college_branch: {
        collegeBranchCode: string;
        collegeBranchType: string;
    };

    college_education: {
        collegeEducationType: string; // ✅ added
    };
};

type AcademicRow = {
    studentAcademicHistoryId: number;
    collegeAcademicYearId: number;

    college_academic_year: {
        collegeAcademicYear: string;
    };
};

/* ---------- HELPER ---------- */

export async function fetchStudentProfileCardData(userId: number) {
    /* ---- 1. Fetch student + user + branch ---- */
    const { data: student, error: studentError } = await supabase
        .from("students")
        .select(`
      studentId,

      users:userId (
        fullName,
        email,
        mobile
      ),

      college_branch:collegeBranchId (
        collegeBranchCode,
         collegeBranchType
      ),

      college_education:collegeEducationId (
      collegeEducationType
    )
    `)
        .eq("userId", userId)
        .is("deletedAt", null)
        .single<StudentRow>();

    if (studentError) throw studentError;

    /* ---- 2. Fetch current academic year ---- */
    const { data: academic, error: academicError } = await supabase
        .from("student_academic_history")
        .select(`
      studentAcademicHistoryId,

      college_academic_year:collegeAcademicYearId (
        collegeAcademicYear
      )
    `)
        .eq("studentId", student.studentId)
        .eq("isCurrent", true)
        .is("deletedAt", null)
        .single<AcademicRow>();

    if (academicError) throw academicError;

    /* ---- 3. Return ProfileCard-ready data ---- */
    return {
        name: student.users.fullName,
        email: student.users.email,
        mobile: student.users.mobile,

        rollNo: student.studentId.toString(),

        branch: student.college_branch.collegeBranchCode,

        year: academic.college_academic_year.collegeAcademicYear,
        course: `${student.college_education.collegeEducationType} – ${student.college_branch.collegeBranchType}`,
    };
}
