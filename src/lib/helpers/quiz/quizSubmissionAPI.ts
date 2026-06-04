import { supabase } from "@/lib/supabaseClient";

export type QuizSubmissionRow = {
  submissionId: number;
  quizId: number;
  studentId: number;
  totalMarksObtained: number;
  submittedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export async function fetchSubmissionsByQuizId(quizId: number) {
  const { data, error } = await supabase
    .from("quiz_submissions")
    .select(
      `
      submissionId,
      quizId,
      studentId,
      totalMarksObtained,
      submittedAt,
      isActive,
      createdAt,
      updatedAt,
      deletedAt
    `,
    )
    .eq("quizId", quizId)
    .eq("isActive", true)
    .is("deletedAt", null)
    .order("submittedAt", { ascending: false });

  if (error) {
    console.error("fetchSubmissionsByQuizId error:", error);
    throw error;
  }

  return data ?? [];
}

export async function fetchSubmissionByStudentAndQuiz(
  studentId: number,
  quizId: number,
) {
  const { data, error } = await supabase
    .from("quiz_submissions")
    .select("submissionId, totalMarksObtained, submittedAt")
    .eq("studentId", studentId)
    .eq("quizId", quizId)
    .is("deletedAt", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") return { success: true, data: null };
    throw error;
  }

  return { success: true, data };
}

export async function saveQuizSubmission(payload: {
  quizId: number;
  studentId: number;
  totalMarksObtained: number;
  attemptNumber: number;
}) {
  const now = new Date().toISOString();

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 3000]; // 1s, 2s, 3s

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await supabase
        .from("quiz_submissions")
        .upsert(
          [
            {
              quizId: payload.quizId,
              studentId: payload.studentId,
              totalMarksObtained: payload.totalMarksObtained,
              attemptNumber: payload.attemptNumber,
              submittedAt: now,
              createdAt: now,
              updatedAt: now,
              isActive: true,
            },
          ],
          {
            onConflict: "quizId,studentId,attemptNumber",
          },
        )
        .select("submissionId")
        .single();

      if (error) {
        console.error(`saveQuizSubmission attempt ${attempt + 1} error:`, error);

        if (
          attempt < MAX_RETRIES - 1 &&
          (error.message?.includes("503") ||
            error.message?.includes("Failed to fetch") ||
            error.message?.includes("NetworkError") ||
            (error as any)?.status === 503)
        ) {
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAYS[attempt]),
          );
          continue;
        }

        return { success: false, error };
      }

      return { success: true, submissionId: data.submissionId };
    } catch (err: any) {
      console.error(`saveQuizSubmission catch attempt ${attempt + 1}:`, err);

      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAYS[attempt]),
        );
        continue;
      }

      return { success: false, error: err };
    }
  }

  return { success: false, error: new Error("Max retries exceeded") };
}

export async function deactivateQuizSubmission(submissionId: number) {
  const { error } = await supabase
    .from("quiz_submissions")
    .update({
      isActive: false,
      deletedAt: new Date().toISOString(),
    })
    .eq("submissionId", submissionId);

  if (error) {
    console.error("deactivateQuizSubmission error:", error);
    return { success: false };
  }

  return { success: true };
}

// export async function fetchSubmissionsWithStudentsByQuizId(quizId: number) {
//   const { data, error } = await supabase
//     .from("quiz_submissions")
//     .select(
//       `
//             submissionId,
//             quizId,
//             studentId,
//             totalMarksObtained,
//             submittedAt
//         `,
//     )
//     .eq("quizId", quizId)
//     .eq("isActive", true)
//     .is("deletedAt", null)
//     .order("submittedAt", { ascending: false });

//   if (error) {
//     console.error("fetchSubmissionsWithStudentsByQuizId error:", error);
//     throw error;
//   }

//   return data ?? [];
// }

export async function getStudentAttemptCount(
  quizId: number,
  studentId: number,
): Promise<number> {
  const { data, error } = await supabase
    .from("quiz_submissions")
    .select("submissionId")
    .eq("quizId", quizId)
    .eq("studentId", studentId)
    .is("deletedAt", null);

  if (error) {
    if (error.code === "PGRST116") return 0;
    throw error;
  }

  return data?.length ?? 0;
}

export async function fetchSubmissionDetails(submissionId: number) {
  const { data, error } = await supabase
    .from("quiz_submission_answers")
    .select(
      `
            answerId,
            questionId,
            selectedOptionId,
            writtenAnswer,
            isCorrect,
            marksObtained
        `,
    )
    .eq("submissionId", submissionId)
    .eq("isActive", true)
    .is("deletedAt", null);

  if (error) {
    console.error("fetchSubmissionDetails error:", error);
    throw error;
  }

  return data ?? [];
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
                        profileUrl,
                        is_deleted
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
    const profiles = Array.isArray(profileData) ? profileData : [profileData];
    const activeProfile = profiles.find((profile: any) => profile && !profile.is_deleted);
    const pinData = studentData?.student_pins;
    const pinNumber = Array.isArray(pinData)
      ? pinData[0]?.pinNumber
      : pinData?.pinNumber;

    return {
      ...sub,
      students: {
        fullName: studentData?.users?.fullName,
        rollNumber: pinNumber || null,
        section: section,
        profileImage: activeProfile?.profileUrl || null,
      },
    };
  });
}
