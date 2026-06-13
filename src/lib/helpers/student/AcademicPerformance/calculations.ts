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

const getFirst = <T>(value: T | T[] | null | undefined): T | null =>
    Array.isArray(value) ? value[0] ?? null : value ?? null;

export async function getStudentAcademicPerformance(studentId: number | null) {
    const today = formatDate(new Date());

    if (!studentId) return [];

    const { data: student } = await supabase
        .from("students")
        .select("collegeBranchId, collegeEducationId")
        .eq("studentId", studentId)
        .single();

    const { data: history } = await supabase
        .from("student_academic_history")
        .select("collegeSemesterId, collegeAcademicYearId")
        .eq("studentId", studentId)
        .eq("isCurrent", true)
        .single();

    if (!student || !history) {
        return [{ subject: "BASE_DATA_MISSING", value: 0, full: 100 }];
    }

    const { data: subjects } = await supabase
        .from("college_subjects")
        .select("collegeSubjectId, subjectName, subjectKey")
        .eq("collegeBranchId", student.collegeBranchId)
        .eq("collegeEducationId", student.collegeEducationId)
        .eq("collegeAcademicYearId", history.collegeAcademicYearId)
        .is("deletedAt", null);

    if (!subjects || subjects.length === 0) return [];

    const subjectIds = subjects.map(s => s.collegeSubjectId);

    const { data: configs } = await supabase
        .from("faculty_weightage_configs")
        .select("facultyWeightageConfigId, collegeSubjectId")
        .in("collegeSubjectId", subjectIds);

    const configIds = configs?.map(c => c.facultyWeightageConfigId) || [];
    const configMap = new Map(configs?.map(c => [c.collegeSubjectId, c.facultyWeightageConfigId]) || []);

    const { data: allWeights } = configIds.length > 0
        ? await supabase
            .from("faculty_weightage_items")
            .select("facultyWeightageConfigId, percentage, label")
            .in("facultyWeightageConfigId", configIds)
        : { data: [] };

    const weightsByConfigId = new Map<number, typeof allWeights>();
    for (const item of allWeights || []) {
        const list = weightsByConfigId.get(item.facultyWeightageConfigId) || [];
        list.push(item);
        weightsByConfigId.set(item.facultyWeightageConfigId, list);
    }

    const { data: quizData } = await supabase
        .from("quiz_submissions")
        .select("totalMarksObtained, quizId, quizzes!inner(totalMarks, collegeSubjectId)")
        .eq("studentId", studentId)
        .in("quizzes.collegeSubjectId", subjectIds);

    const { data: forumData } = await supabase
        .from("student_discussion_uploads")
        .select(`
            marksObtained, discussionId,
            discussion_forum_sections!inner(marks, discussion_forum!inner(title))
        `)
        .eq("studentId", studentId)
        .is("is_deleted", false);

    const { data: assignData } = await supabase
        .from("student_assignments_submission")
        .select(`marksScored, assignments!inner(assignmentId, marks, subjectId)`)
        .eq("studentId", studentId)
        .in("assignments.subjectId", subjectIds);

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

    const performanceData = subjects.map((subject) => {
        const configId = configMap.get(subject.collegeSubjectId);

        if (!configId) {
            const subjectQuizzes = quizData?.filter(q => {
                const quiz = getFirst(q.quizzes);
                return quiz?.collegeSubjectId === subject.collegeSubjectId;
            }) || [];
            const rawEarned = subjectQuizzes.reduce((acc, curr) => acc + (curr.totalMarksObtained || 0), 0);
            const rawTotal = subjectQuizzes.reduce((acc, curr) => {
                const quiz = getFirst(curr.quizzes);
                return acc + (quiz?.totalMarks || 0);
            }, 0);

            return {
                subject: subject.subjectKey || subject.subjectName,
                value: rawTotal > 0 ? Math.round((rawEarned / rawTotal) * 100) : 0,
                full: 100,
            };
        }

        const weights = weightsByConfigId.get(configId);

        if (!weights || weights.length === 0) {
            return { subject: subject.subjectKey || subject.subjectName, value: 0, full: 100 };
        }

        let totalWeightedScore = 0;

        for (const item of weights) {
            const label = item.label.toLowerCase();
            let earned = 0;
            let possible = 0;

            if (label.includes("quiz")) {
                const subjectQuizData = quizData?.filter(q => {
                    const quiz = getFirst(q.quizzes);
                    return quiz?.collegeSubjectId === subject.collegeSubjectId;
                }) || [];
                if (subjectQuizData.length > 0) {
                    const bestAttempts = subjectQuizData.reduce((acc: any, curr: any) => {
                        const id = curr.quizId;
                        if (!acc[id] || curr.totalMarksObtained > acc[id].earned) {
                            const quiz = getFirst(curr.quizzes);
                            acc[id] = { earned: curr.totalMarksObtained || 0, possible: quiz?.totalMarks || 0 };
                        }
                        return acc;
                    }, {});
                    const res = Object.values(bestAttempts) as any[];
                    earned = res.reduce((s, r) => s + r.earned, 0);
                    possible = res.reduce((s, r) => s + r.possible, 0);
                }
            }
            else if (label.includes("discussion")) {
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
            else if (label.includes("assignment")) {
                const subjectAssignData = assignData?.filter(a => {
                    const assign = getFirst(a.assignments);
                    return assign?.subjectId === subject.collegeSubjectId;
                }) || [];
                if (subjectAssignData.length > 0) {
                    const uniqueAssign = subjectAssignData.reduce((acc: any, curr: any) => {
                        const assign = getFirst(curr.assignments);
                        const id = assign?.assignmentId;
                        if (id) {
                            const s = Number(curr.marksScored) || 0;
                            const m = Number(assign?.marks) || 0;
                            if (!acc[id] || s > acc[id].earned) {
                                acc[id] = { earned: Math.min(s, m), possible: m };
                            }
                        }
                        return acc;
                    }, {});
                    const res = Object.values(uniqueAssign) as any[];
                    earned = res.reduce((s, r) => s + r.earned, 0);
                    possible = res.reduce((s, r) => s + r.possible, 0);
                }
            }
            else if (label.includes("attendance")) {
                const validAttendance = (attendanceRecords || []).filter((record: any) => {
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
    });

    return performanceData;
}