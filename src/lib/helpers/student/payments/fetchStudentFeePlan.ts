import { supabase } from "@/lib/supabaseClient";

export interface FeeComponent {
    label: string;
    amount: number;
}

export interface SemesterRoadmapItem {
    semesterId: number;
    semesterNumber: number;
    localSemesterName: string;
    academicYearName: string;
    requiredAmount: number;
    paidAmount: number;
    pendingAmount: number;
    status: "PAID" | "PARTIAL" | "UNPAID";
    isCurrent: boolean;
}

export interface StudentFeePlan {
    programName: string;
    type: string;
    academicYear: string;
    openingBalance: number;
    components: FeeComponent[];
    gstAmount: number;
    gstPercent: number;
    applicableFees: number;
    scholarship: number;

    totalPayable: number;
    paidTillNow: number;
    pendingAmount: number;

    semesterTotalPayable: number;
    semesterPaidTillNow: number;
    semesterPendingAmount: number;

    semesterRoadmap: SemesterRoadmapItem[];
}

export interface StudentFeePlanWithIds extends StudentFeePlan {
    studentFeeObligationId: number;
    collegeSemesterId: number;
}

export async function fetchStudentFeePlan(
    userId: number,
): Promise<StudentFeePlanWithIds | null> {
    try {
        const { data: student, error: studentError } = await supabase
            .from("students")
            .select(
                `*, college_education(collegeEducationType), college_branch(collegeBranchCode), college_session(sessionName)`,
            )
            .eq("userId", userId)
            .maybeSingle();

        if (studentError || !student) return null;

        const getFirst = (item: any) => (Array.isArray(item) ? item[0] : item);
        const eduType =
            getFirst(student.college_education)?.collegeEducationType || "Course";
        const branchCode =
            getFirst(student.college_branch)?.collegeBranchCode || "Branch";
        const sessionName =
            getFirst(student.college_session)?.sessionName || "Session";
        const defaultProgram = `${eduType} ${branchCode} - ${sessionName}`;

        // 1. Get Current Academic History
        const { data: academicHistory } = await supabase
            .from("student_academic_history")
            .select("collegeAcademicYearId, collegeSemesterId")
            .eq("studentId", student.studentId)
            .eq("isCurrent", true)
            .maybeSingle();

        // 2. 🔥 FOOLPROOF DATA FETCH: Join Semesters with their Academic Years
        const { data: allSemestersRaw } = await supabase
            .from("college_semester")
            .select(
                `
        collegeSemesterId, 
        collegeSemester,
        college_academic_year!inner (
          collegeAcademicYearId,
          collegeAcademicYear,
          collegeBranchId
        )
      `,
            )
            .eq("collegeId", student.collegeId)
            .eq("collegeEducationId", student.collegeEducationId)
            .eq("college_academic_year.collegeBranchId", student.collegeBranchId);

        // 3. 🔥 DATA TRANSFORMATION: Sort chronologically by Year, then Semester
        const sortedSemesters = (allSemestersRaw || []).sort((a, b) => {
            const yearA = getFirst(a.college_academic_year);
            const yearB = getFirst(b.college_academic_year);

            // First sort by the Academic Year (1st Year, 2nd Year, etc.)
            if (yearA.collegeAcademicYearId !== yearB.collegeAcademicYearId) {
                return yearA.collegeAcademicYearId - yearB.collegeAcademicYearId;
            }
            // If same year, sort by semester (1 or 2)
            return a.collegeSemester - b.collegeSemester;
        });

        // 4. Get Fee Obligation
        const { data: obligation, error: obligationError } = await supabase
            .from("student_fee_obligation")
            .select(`studentFeeObligationId, totalAmount`)
            .eq("studentId", student.studentId)
            .eq("collegeSessionId", student.collegeSessionId)
            .eq("isActive", true)
            .is("deletedAt", null)
            .maybeSingle();

        if (obligationError || !obligation) return null;

        // 5. Get the Base Fee Structure
        const { data: feeStructs } = await supabase
            .from("college_fee_structure")
            .select("*")
            .eq("collegeId", student.collegeId)
            .eq("collegeBranchId", student.collegeBranchId)
            .eq("collegeEducationId", student.collegeEducationId)
            .eq("collegeSessionId", student.collegeSessionId)
            .eq("isActive", true)
            .order("createdAt", { ascending: false })
            .limit(1);

        const feeStruct = feeStructs?.[0];
        if (!feeStruct) return null;

        const { data: comps } = await supabase
            .from("college_fee_components")
            .select(`amount, fee_type_master ( feeTypeName )`)
            .eq("feeStructureId", feeStruct.feeStructureId)
            .eq("isActive", true);

        const componentsList: FeeComponent[] = [];
        let gstAmount = 0;
        let subTotal = 0;

        comps?.forEach((c: any) => {
            const name = getFirst(c.fee_type_master)?.feeTypeName || "Fee";
            const amt = Number(c.amount);

            if (name.toUpperCase() === "GST") {
                gstAmount = amt;
            } else {
                componentsList.push({ label: name, amount: amt });
                subTotal += amt;
            }
        });

        const gstPercent =
            subTotal > 0 ? Math.round((gstAmount / subTotal) * 100) : 0;
        const baseSemesterFee = subTotal + gstAmount;

        // 6. Build the Dynamic Roadmap with ABSOLUTE Indexing
        const { data: collectionRows } = await supabase
            .from("student_fee_collection")
            .select("collegeSemesterId, collectedAmount")
            .eq("studentFeeObligationId", obligation.studentFeeObligationId);

        // Fallback: If no current history, default to the very first chronological semester
        const targetSemesterId =
            academicHistory?.collegeSemesterId ||
            (sortedSemesters?.[0]?.collegeSemesterId ?? null);

        const semesterRoadmap: SemesterRoadmapItem[] = sortedSemesters.map(
            (sem, index) => {
                const yearData = getFirst(sem.college_academic_year);

                const paidForSem =
                    collectionRows
                        ?.filter((c) => c.collegeSemesterId === sem.collegeSemesterId)
                        .reduce((sum, row) => sum + Number(row.collectedAmount), 0) ?? 0;

                const pendingForSem = Math.max(0, baseSemesterFee - paidForSem);

                return {
                    semesterId: sem.collegeSemesterId,
                    semesterNumber: index + 1,
                    localSemesterName: `${yearData?.collegeAcademicYear} - Sem ${sem.collegeSemester}`,
                    academicYearName:
                        yearData?.collegeAcademicYear ||
                        `Year ${Math.ceil((index + 1) / 2)}`,
                    requiredAmount: baseSemesterFee,
                    paidAmount: paidForSem,
                    pendingAmount: pendingForSem,
                    status:
                        pendingForSem <= 0 ? "PAID" : paidForSem > 0 ? "PARTIAL" : "UNPAID",
                    isCurrent: sem.collegeSemesterId === targetSemesterId,
                };
            },
        );

        // 7. Calculate Program Totals
        const totalProgramPayable =
            baseSemesterFee * (sortedSemesters?.length || 1);
        const totalProgramPaid = semesterRoadmap.reduce(
            (sum, s) => sum + s.paidAmount,
            0,
        );
        const totalProgramPending = Math.max(
            0,
            totalProgramPayable - totalProgramPaid,
        );

        // 8. Get Current Semester Totals
        const currentSemData = semesterRoadmap.find((s) => s.isCurrent);
        const currentSemPending = currentSemData
            ? currentSemData.pendingAmount
            : baseSemesterFee;
        const currentSemPaid = currentSemData ? currentSemData.paidAmount : 0;

        return {
            studentFeeObligationId: obligation.studentFeeObligationId,
            collegeSemesterId: targetSemesterId,
            programName: defaultProgram,
            type: "Academic Fees",
            academicYear: sessionName,
            openingBalance: 0,
            components: componentsList,
            gstAmount,
            gstPercent,
            applicableFees: subTotal,
            scholarship: 0,

            // Program Totals
            totalPayable: totalProgramPayable,
            paidTillNow: totalProgramPaid,
            pendingAmount: totalProgramPending,

            // Current Semester Details
            semesterTotalPayable: baseSemesterFee,
            semesterPaidTillNow: currentSemPaid,
            semesterPendingAmount: currentSemPending,

            semesterRoadmap,
        };
    } catch (err) {
        console.error("fetchStudentFeePlan error:", err);
        return null;
    }
}
