import { supabase } from "@/lib/supabaseClient";

export type QuizRow = {
  quizId: number;
  facultyId?: number | null;
  adminId?: number | null;
  collegeSubjectId: number;
  collegeAcademicYearId: number;
  collegeSectionsId: number;
  collegeSubjectUnitId: number;
  collegeSubjectUnitTopicId: number;
  quizTitle: string;
  totalMarks: number;
  questionsCount: number;
  marksPerQuestion: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  maxAttempts: number;
  status: "Draft" | "Active" | "Completed";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export async function fetchQuizzesByFacultyId(facultyId: number) {
  const { data, error } = await supabase
    .from("quizzes")
    .select(`
      quizId,
      facultyId,
      adminId,
      collegeSubjectId,
      collegeAcademicYearId,
      collegeSectionsId,
      collegeSubjectUnitId,
      collegeSubjectUnitTopicId,
      quizTitle,
      totalMarks,
      questionsCount,
      marksPerQuestion,
      startTime,
      endTime,
      durationMinutes,
      startDate,
      endDate,
      maxAttempts,
      status,
      isActive,
      createdAt,
      updatedAt,
      deletedAt
    `)
    .eq("facultyId", facultyId)
    .eq("isActive", true)
    .is("deletedAt", null)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("fetchQuizzesByFacultyId error:", error);
    throw error;
  }

  return data ?? [];
}

export async function fetchQuizzesByStatus(
  facultyId: number,
  status: "Draft" | "Active" | "Completed",
  page: number = 1,
  limit: number = 10,
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("quizzes")
    .select(
      `
            quizId,
            quizTitle,
            totalMarks,
            questionsCount,
            durationMinutes,
            startDate,
            endDate,
            startTime,
            endTime,
            status,
            college_subjects (
                subjectName
            ),
            college_sections (
                collegeSections
            ),
            quiz_questions (
                questionId
            )
        `,
      { count: "exact" },
    )
    .eq("facultyId", facultyId)
    .eq("status", status)
    .eq("isActive", true)
    .is("deletedAt", null)
    .order("createdAt", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("fetchQuizzesByStatus error:", error);
    throw error;
  }

  return { data: data ?? [], totalCount: count ?? 0 };
}

export async function saveQuiz(payload: {
  quizId?: number;
  facultyId?: number | null;
  adminId?: number | null;
  collegeSubjectId: number;
  collegeAcademicYearId: number;
  collegeSectionsId: number;
  collegeSubjectUnitId: number;
  collegeSubjectUnitTopicId: number;
  quizTitle: string;
  totalMarks: number;
  questionsCount: number;
  marksPerQuestion: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  maxAttempts?: number;
  status?: "Draft" | "Active" | "Completed";
}) {
  const now = new Date().toISOString();

  const upsertPayload: any = {
    facultyId: payload.facultyId,
    adminId: payload.adminId,
    collegeSubjectId: payload.collegeSubjectId,
    collegeAcademicYearId: payload.collegeAcademicYearId,
    collegeSectionsId: payload.collegeSectionsId,
    collegeSubjectUnitId: payload.collegeSubjectUnitId,
    collegeSubjectUnitTopicId: payload.collegeSubjectUnitTopicId,
    quizTitle: payload.quizTitle.trim(),
    totalMarks: payload.totalMarks,
    questionsCount: payload.questionsCount,
    marksPerQuestion: payload.marksPerQuestion,
    startTime: payload.startTime,
    endTime: payload.endTime,
    durationMinutes: payload.durationMinutes,
    startDate: payload.startDate,
    endDate: payload.endDate,
    maxAttempts: payload.maxAttempts ?? 1,
    status: payload.status ?? "Draft",
    updatedAt: now,
  };

  if (!payload.quizId) {
    upsertPayload.createdAt = now;
    const { data, error } = await supabase
      .from("quizzes")
      .insert([upsertPayload])
      .select("quizId")
      .single();

    if (error) return { success: false, error };
    return { success: true, quizId: data.quizId };
  }

  const { error } = await supabase
    .from("quizzes")
    .update(upsertPayload)
    .eq("quizId", payload.quizId);

  if (error) return { success: false, error };
  return { success: true, quizId: payload.quizId };
}

export async function updateQuizStatus(
  quizId: number,
  status: "Draft" | "Active" | "Completed",
) {
  const { error } = await supabase
    .from("quizzes")
    .update({ status, updatedAt: new Date().toISOString() })
    .eq("quizId", quizId);

  if (error) {
    console.error("updateQuizStatus error:", error);
    return { success: false, error };
  }

  return { success: true };
}

export async function deactivateQuiz(quizId: number) {
  const { error } = await supabase
    .from("quizzes")
    .update({
      isActive: false,
      deletedAt: new Date().toISOString(),
    })
    .eq("quizId", quizId);

  if (error) {
    console.error("deactivateQuiz error:", error);
    return { success: false };
  }

  return { success: true };
}

export async function autoCompleteExpiredQuizzes(facultyId: number) {
  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("quizzes")
    .update({
      status: "Completed",
      updatedAt: new Date().toISOString(),
    })
    .lt("endDate", today)
    .eq("facultyId", facultyId)
    .eq("isActive", true)
    .neq("status", "Completed");

  if (error) {
    console.error("autoCompleteExpiredQuizzes error:", error);
  }
}

export async function fetchIncompleteQuizzesByFacultyId(facultyId: number) {
  const { data: quizzesWithQuestions } = await supabase
    .from("quiz_questions")
    .select("quizId")
    .eq("isActive", true)
    .is("deletedAt", null);

  const quizIdsWithQuestions =
    quizzesWithQuestions?.map((q: any) => q.quizId) ?? [];

  let query = supabase
    .from("quizzes")
    .select(`
            quizId,
            quizTitle,
            totalMarks,
            questionsCount,
            durationMinutes,
            startDate,
            endDate,
            status
        `)
    .eq("facultyId", facultyId)
    .in("status", ["Draft", "Active"])
    .eq("isActive", true)
    .is("deletedAt", null)
    .order("createdAt", { ascending: false });

  if (quizIdsWithQuestions.length > 0) {
    query = query.not("quizId", "in", `(${quizIdsWithQuestions.join(",")})`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetchIncompleteQuizzesByFacultyId error:", error);
    throw error;
  }

  return data ?? [];
}

export async function fetchAttemptedQuizzesForStudent(
  studentId: number,
  page: number = 1,
  limit: number = 10,
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("quiz_submissions")
    .select(
      `
            submissionId,
            totalMarksObtained,
            submittedAt,
            attemptNumber,
            quizId
        `,
      { count: "exact" },
    )
    .eq("studentId", studentId)
    .eq("isActive", true)
    .is("deletedAt", null)
    .order("submittedAt", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("fetchAttemptedQuizzesForStudent error:", error);
    throw error;
  }

  const enriched = await Promise.all(
    (data ?? []).map(async (submission: any) => {
      const { data: quizData } = await supabase
        .from("quizzes")
        .select(
          `
                    quizId,
                    quizTitle,
                    totalMarks,
                    maxAttempts,
                    startDate,
                    endDate,
                    college_subjects (
                        subjectName
                    ),
                    faculty (
                        fullName
                    )
                `,
        )
        .eq("quizId", submission.quizId)
        .single();

      const { count: answersCount } = await supabase
        .from("quiz_submission_answers")
        .select("answerId", { count: "exact", head: true })
        .eq("submissionId", submission.submissionId);

      const { count: questionsCount } = await supabase
        .from("quiz_questions")
        .select("questionId", { count: "exact", head: true })
        .eq("quizId", submission.quizId)
        .eq("isActive", true)
        .is("deletedAt", null);

      return {
        ...submission,
        quizzes: quizData,
        answersCount: answersCount ?? 0,
        totalQuestionsCount: questionsCount ?? 0,
      };
    }),
  );

  return { data: enriched, totalCount: count ?? 0 };
}

export async function fetchActiveQuizzesForStudent(
  collegeSectionsId: number,
  page: number = 1,
  limit: number = 10,
) {
  const today = new Date().toISOString().split("T")[0];
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("quizzes")
    .select(
      `
            quizId,
            quizTitle,
            totalMarks,
            questionsCount,
            durationMinutes,
            startDate,
            endDate,
            startTime,
            endTime,
            maxAttempts,
            status,
            facultyId,
            college_subjects (
                subjectName
            ),
            faculty (
                fullName
            )
        `,
      { count: "exact" },
    )
    .eq("collegeSectionsId", collegeSectionsId)
    .eq("status", "Active")
    .eq("isActive", true)
    .is("deletedAt", null)
    .lte("startDate", today)
    .gte("endDate", today)
    .order("createdAt", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("fetchActiveQuizzesForStudent error:", error);
    throw error;
  }

  return { data: data ?? [], totalCount: count ?? 0 };
}

export async function fetchQuizById(quizId: number) {
  const { data, error } = await supabase
    .from("quizzes")
    .select(`
      *,
      college_subject_unit_topics (
        topicTitle
      )
    `)
    .eq("quizId", quizId)
    .eq("isActive", true)
    .is("deletedAt", null)
    .single();

  if (error) {
    console.error("fetchQuizById error:", error);
    throw error;
  }

  return data;
}

export async function fetchSubmissionsWithStudentsByQuizId(quizId: number) {
  const { data, error } = await supabase
    .from("quiz_submissions")
    .select(
      `
            submissionId,
            quizId,
            studentId,
            totalMarksObtained,
            submittedAt,
            students!inner (
                student_pins(pinNumber),
                users!inner (
                    fullName,
                    user_profile (
                        profileUrl
                    )
                ),
                student_academic_history (
                    isCurrent,
                    college_sections (
                        collegeSections
                    )
                )
            )
        `,
    )
    .eq("quizId", quizId)
    .eq("isActive", true)
    .is("deletedAt", null)
    .order("submittedAt", { ascending: false });

  if (error) {
    console.error("fetchSubmissionsWithStudentsByQuizId error:", error);
    throw error;
  }

  return (data ?? []).map((sub: any) => {
    const studentData = sub.students;
    const activeHistory = studentData?.student_academic_history?.find(
      (h: any) => h.isCurrent,
    );
    const section = activeHistory?.college_sections?.collegeSections || "-";
    const profileData = studentData?.users?.user_profile;
    const profileUrl = Array.isArray(profileData)
      ? profileData[0]?.profileUrl
      : profileData?.profileUrl;

    const pinNumber = Array.isArray(studentData?.student_pins)
      ? studentData?.student_pins[0]?.pinNumber
      : studentData?.student_pins?.pinNumber;

    return {
      ...sub,
      students: {
        fullName: studentData?.users?.fullName,
        rollNumber: pinNumber || null,
        section: section,
        profileImage: profileUrl || null,
      },
    };
  });
}