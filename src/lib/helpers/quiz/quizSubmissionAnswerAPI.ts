import { supabase } from "@/lib/supabaseClient";

export type QuizSubmissionAnswerRow = {
    answerId: number;
    submissionId: number;
    questionId: number;
    selectedOptionId: number | null;
    writtenAnswer: string | null;
    isCorrect: boolean;
    marksObtained: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

export async function fetchAnswersBySubmissionId(submissionId: number) {
    const { data, error } = await supabase
        .from("quiz_submission_answers")
        .select(`
      answerId,
      submissionId,
      questionId,
      selectedOptionId,
      writtenAnswer,
      isCorrect,
      marksObtained,
      isActive,
      createdAt,
      updatedAt,
      deletedAt
    `)
        .eq("submissionId", submissionId)
        .eq("isActive", true)
        .is("deletedAt", null);

    if (error) {
        console.error("fetchAnswersBySubmissionId error:", error);
        throw error;
    }

    return data ?? [];
}

export async function saveBulkSubmissionAnswers(
    submissionId: number,
    answers: {
        questionId: number;
        selectedOptionId?: number | null;
        writtenAnswer?: string | null;
        isCorrect: boolean;
        marksObtained: number;
    }[]
) {
    const now = new Date().toISOString();

    const insertPayload = answers.map((a) => ({
        submissionId,
        questionId: a.questionId,
        selectedOptionId: a.selectedOptionId ?? null,
        writtenAnswer: a.writtenAnswer?.trim() ?? null,
        isCorrect: a.isCorrect,
        marksObtained: a.marksObtained,
        createdAt: now,
        updatedAt: now,
    }));

    const { data, error } = await supabase
        .from("quiz_submission_answers")
        .insert(insertPayload)
        .select("answerId");

    if (error) {
        console.error("saveBulkSubmissionAnswers error:", error);
        return { success: false, error };
    }

    return { success: true, data };
}

export async function deactivateSubmissionAnswer(answerId: number) {
    const { error } = await supabase
        .from("quiz_submission_answers")
        .update({
            isActive: false,
            deletedAt: new Date().toISOString(),
        })
        .eq("answerId", answerId);

    if (error) {
        console.error("deactivateSubmissionAnswer error:", error);
        return { success: false };
    }

    return { success: true };
}