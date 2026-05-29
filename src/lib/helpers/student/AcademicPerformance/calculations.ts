import { supabase } from "@/lib/supabaseClient";

const ATTENDED_STATUSES = ["PRESENT", "LATE"] as const;
const CONDUCTED_STATUSES = ["PRESENT", "ABSENT", "LATE", "LEAVE"] as const;
const CANCELLED_STATUSES = ["CLASS_CANCEL", "CANCEL_CLASS"] as const;

function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function isAttendedStatus(status: string) {
    return (ATTENDED_STATUSES as readonly string[]).includes(status);
}

function isConductedStatus(status: string) {
    return (CONDUCTED_STATUSES as readonly string[]).includes(status);
}

function isCancelledStatus(status: string) {
    return (CANCELLED_STATUSES as readonly string[]).includes(status);
}

export async function getStudentAcademicPerformance(studentId: number | null) {
    const today = formatDate(new Date());

    if (!studentId) return [];

    // 1. Fetch Student profile data
    const { data: student } = await supabase
        .from("students")
        .select("collegeBranchId")
        .eq("studentId", studentId)
        .single();

    // 2. Fetch Active Academic History
    const { data: history } = await supabase
        .from("student_academic_history")
        .select("collegeSemesterId, collegeAcademicYearId")
        .eq("studentId", studentId)
        .eq("isCurrent", true)
        .single();

    if (!student || !history) {
        return [{ subject: "BASE_DATA_MISSING", value: 0, full: 100 }];
    }

    // 3. Get Course Subjects matching current criteria
    const { data: subjects } = await supabase
        .from("college_subjects")
        .select("collegeSubjectId, subjectName, subjectKey")
        .eq("collegeSemesterId", history.collegeSemesterId)
        .eq("collegeBranchId", student.collegeBranchId)
        .is("deletedAt", null);

    if (!subjects) return [];

    // 4. Resolve calculations in parallel across all found courses
    const performanceData = await Promise.all(
        subjects.map(async (subject) => {
            const { data: config } = await supabase
                .from("faculty_weightage_configs")
                .select("facultyWeightageConfigId")
                .eq("collegeSubjectId", subject.collegeSubjectId)
                .maybeSingle();

            // Fallback: If no strict grading weight config exists, calculate raw average score across quizzes
            if (!config) {
                const { data: rawQuizzes } = await supabase
                    .from("quiz_submissions")
                    .select("totalMarksObtained, quizzes!inner(totalMarks)")
                    .eq("studentId", studentId)
                    .eq("quizzes.collegeSubjectId", subject.collegeSubjectId);

                const rawEarned = rawQuizzes?.reduce((acc, curr) => acc + (curr.totalMarksObtained || 0), 0) || 0;
                const rawTotal = rawQuizzes?.reduce((acc, curr: any) => acc + (curr.quizzes?.totalMarks || 0), 0) || 0;

                return {
                    subject: subject.subjectKey || subject.subjectName,
                    value: rawTotal > 0 ? Math.round((rawEarned / rawTotal) * 100) : 0,
                    full: 100,
                };
            }

            const { data: weights } = await supabase
                .from("faculty_weightage_items")
                .select("percentage, label")
                .eq("facultyWeightageConfigId", config.facultyWeightageConfigId);

            if (!weights || weights.length === 0) {
                return { subject: subject.subjectKey || subject.subjectName, value: 0, full: 100 };
            }

            let totalWeightedScore = 0;

            for (const item of weights) {
                const label = item.label.toLowerCase();
                let earned = 0;
                let possible = 0;

                // Category A: Quizzes
                if (label.includes("quiz")) {
                    const { data: quizData } = await supabase
                        .from("quiz_submissions")
                        .select("totalMarksObtained, quizId, quizzes!inner(totalMarks)")
                        .eq("studentId", studentId)
                        .eq("quizzes.collegeSubjectId", subject.collegeSubjectId);

                    if (quizData && quizData.length > 0) {
                        const bestAttempts = quizData.reduce((acc: any, curr: any) => {
                            const id = curr.quizId;
                            if (!acc[id] || curr.totalMarksObtained > acc[id].earned) {
                                acc[id] = { earned: curr.totalMarksObtained || 0, possible: curr.quizzes?.totalMarks || 0 };
                            }
                            return acc;
                        }, {});
                        const res = Object.values(bestAttempts) as any[];
                        earned = res.reduce((s, r) => s + r.earned, 0);
                        possible = res.reduce((s, r) => s + r.possible, 0);
                    }
                }

                // Category B: Discussion Board Posts
                else if (label.includes("discussion")) {
                    const { data: forumData } = await supabase
                        .from("student_discussion_uploads")
                        .select(`
                            marksObtained, discussionId,
                            discussion_forum_sections!inner(marks, discussion_forum!inner(title))
                        `)
                        .eq("studentId", studentId)
                        .is("is_deleted", false);

                    if (forumData && forumData.length > 0) {
                        const bestForum = forumData.reduce((acc: any, curr: any) => {
                            const id = curr.discussionId;
                            const s = Number(curr.marksObtained) || 0;
                            const m = Number(curr.discussion_forum_sections?.marks) || 0;
                            if (!acc[id] || s > acc[id].earned) {
                                acc[id] = { earned: Math.min(s, m), possible: m, title: curr.discussion_forum_sections?.discussion_forum?.title };
                            }
                            return acc;
                        }, {});
                        const res = Object.values(bestForum) as any[];
                        earned = res.reduce((s, r) => s + r.earned, 0);
                        possible = res.reduce((s, r) => s + r.possible, 0);
                    }
                }

                // Category C: Homework / Assignments
                else if (label.includes("assignment")) {
                    const { data: assignData } = await supabase
                        .from("student_assignments_submission")
                        .select(`marksScored, assignments!inner(assignmentId, marks, subjectId)`)
                        .eq("studentId", studentId)
                        .eq("assignments.subjectId", subject.collegeSubjectId);

                    if (assignData && assignData.length > 0) {
                        const uniqueAssign = assignData.reduce((acc: any, curr: any) => {
                            const id = curr.assignments.assignmentId;
                            const s = Number(curr.marksScored) || 0;
                            const m = Number(curr.assignments.marks) || 0;
                            if (!acc[id] || s > acc[id].earned) {
                                acc[id] = { earned: Math.min(s, m), possible: m };
                            }
                            return acc;
                        }, {});
                        const res = Object.values(uniqueAssign) as any[];
                        earned = res.reduce((s, r) => s + r.earned, 0);
                        possible = res.reduce((s, r) => s + r.possible, 0);
                    }
                }

                // Category D: Class Attendance Logs
                else if (label.includes("attendance")) {
                    const { data: attendanceRecords } = await supabase
                        .from("attendance_record")
                        .select(`
                            status,
                            calendar_event:calendarEventId (
                                subject,
                                type,
                                date,
                                is_deleted
                            )
                        `)
                        .eq("studentId", studentId)
                        .is("deletedAt", null)
                        .lte("markedAt", today);

                    const validAttendance = ((attendanceRecords as any) || []).filter((record: any) => {
                        const event = record.calendar_event;
                        return (
                            !!event &&
                            event.subject === subject.collegeSubjectId &&
                            event.type === "class" &&
                            event.is_deleted === false &&
                            event.date <= today &&
                            !isCancelledStatus(record.status)
                        );
                    });

                    if (validAttendance.length > 0) {
                        earned = validAttendance.filter((record: any) =>
                            isAttendedStatus(record.status),
                        ).length;
                        possible = validAttendance.filter((record: any) =>
                            isConductedStatus(record.status),
                        ).length;
                    }
                }

                if (possible > 0) {
                    const contribution = (earned / possible) * item.percentage;
                    totalWeightedScore += contribution;
                }
            }

            return {
                subject: subject.subjectKey || subject.subjectName,
                value: Math.round(totalWeightedScore),
                full: 100
            };
        })
    );

    return performanceData;
}