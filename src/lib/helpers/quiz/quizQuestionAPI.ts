import { supabase } from "@/lib/supabaseClient";

export type QuizQuestionRow = {
    questionId: number;
    quizId: number;
    questionText: string;
    questionType: "Multiple Choice" | "Fill in the Blanks";
    marks: number;
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

export async function fetchQuestionsByQuizId(quizId: number) {
    const { data, error } = await supabase
        .from("quiz_questions")
        .select(`
      questionId,
      quizId,
      questionText,
      questionType,
      marks,
      displayOrder,
      isActive,
      createdAt,
      updatedAt,
      deletedAt
    `)
        .eq("quizId", quizId)
        .eq("isActive", true)
        .is("deletedAt", null)
        .order("displayOrder", { ascending: true });

    if (error) {
        console.error("fetchQuestionsByQuizId error:", error);
        throw error;
    }

    return data ?? [];
}

export async function saveQuizQuestion(
    payload: {
        questionId?: number;
        quizId: number;
        questionText: string;
        questionType: "Multiple Choice" | "Fill in the Blanks";
        marks?: number;
        displayOrder?: number;
    }
) {
    const now = new Date().toISOString();

    const upsertPayload: any = {
        quizId: payload.quizId,
        questionText: payload.questionText.trim(),
        questionType: payload.questionType,
        marks: payload.marks ?? 1,
        displayOrder: payload.displayOrder ?? 0,
        updatedAt: now,
    };

    if (!payload.questionId) {
        upsertPayload.createdAt = now;

        const { data, error } = await supabase
            .from("quiz_questions")
            .insert([upsertPayload])
            .select("questionId")
            .single();

        if (error) {
            console.error("saveQuizQuestion insert error:", error);
            return { success: false, error };
        }

        return { success: true, questionId: data.questionId };
    }

    const { error } = await supabase
        .from("quiz_questions")
        .update(upsertPayload)
        .eq("questionId", payload.questionId);

    if (error) {
        console.error("saveQuizQuestion update error:", error);
        return { success: false, error };
    }

    return { success: true, questionId: payload.questionId };
}

export async function deactivateQuizQuestion(questionId: number) {
    const { error } = await supabase
        .from("quiz_questions")
        .update({
            isActive: false,
            deletedAt: new Date().toISOString(),
        })
        .eq("questionId", questionId);

    if (error) {
        console.error("deactivateQuizQuestion error:", error);
        return { success: false };
    }

    return { success: true };
}

export async function fetchQuestionsWithOptionsByQuizId(quizId: number) {
    const { data, error } = await supabase
        .from("quiz_questions")
        .select(`
            questionId,
            questionText,
            questionType,
            marks,
            displayOrder,
            quiz_question_options (
                optionId,
                optionText,
                isCorrect,
                displayOrder
            )
        `)
        .eq("quizId", quizId)
        .eq("isActive", true)
        .is("deletedAt", null)
        .order("displayOrder", { ascending: true });

    if (error) {
        console.error("fetchQuestionsWithOptionsByQuizId error:", error);
        throw error;
    }

    return data ?? [];
}