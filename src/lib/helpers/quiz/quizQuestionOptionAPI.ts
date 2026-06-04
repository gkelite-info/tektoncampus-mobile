import { supabase } from "@/lib/supabaseClient";

export type QuizQuestionOptionRow = {
    optionId: number;
    questionId: number;
    optionText: string;
    isCorrect: boolean;
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

export async function fetchOptionsByQuestionId(questionId: number) {
    const { data, error } = await supabase
        .from("quiz_question_options")
        .select(`
      optionId,
      questionId,
      optionText,
      isCorrect,
      displayOrder,
      isActive,
      createdAt,
      updatedAt,
      deletedAt
    `)
        .eq("questionId", questionId)
        .eq("isActive", true)
        .is("deletedAt", null)
        .order("displayOrder", { ascending: true });

    if (error) {
        console.error("fetchOptionsByQuestionId error:", error);
        throw error;
    }

    return data ?? [];
}

export async function saveQuizQuestionOption(
    payload: {
        optionId?: number;
        questionId: number;
        optionText: string;
        isCorrect?: boolean;
        displayOrder?: number;
    }
) {
    const now = new Date().toISOString();

    const upsertPayload: any = {
        questionId: payload.questionId,
        optionText: payload.optionText.trim(),
        isCorrect: payload.isCorrect ?? false,
        displayOrder: payload.displayOrder ?? 0,
        updatedAt: now,
    };

    if (!payload.optionId) {
        upsertPayload.createdAt = now;

        const { data, error } = await supabase
            .from("quiz_question_options")
            .insert([upsertPayload])
            .select("optionId")
            .single();

        if (error) {
            console.error("saveQuizQuestionOption insert error:", error);
            return { success: false, error };
        }

        return { success: true, optionId: data.optionId };
    }

    const { error } = await supabase
        .from("quiz_question_options")
        .update(upsertPayload)
        .eq("optionId", payload.optionId);

    if (error) {
        console.error("saveQuizQuestionOption update error:", error);
        return { success: false, error };
    }

    return { success: true, optionId: payload.optionId };
}

export async function saveBulkOptions(
    questionId: number,
    options: { optionText: string; isCorrect: boolean; displayOrder: number }[]
) {
    const now = new Date().toISOString();

    await supabase
        .from("quiz_question_options")
        .update({ isActive: false, deletedAt: now })
        .eq("questionId", questionId);

    const insertPayload = options.map((o) => ({
        questionId,
        optionText: o.optionText.trim(),
        isCorrect: o.isCorrect,
        displayOrder: o.displayOrder,
        createdAt: now,
        updatedAt: now,
    }));

    const { data, error } = await supabase
        .from("quiz_question_options")
        .insert(insertPayload)
        .select("optionId");

    if (error) {
        console.error("saveBulkOptions error:", error);
        return { success: false, error };
    }

    return { success: true, data };
}

export async function deactivateQuizQuestionOption(optionId: number) {
    const { error } = await supabase
        .from("quiz_question_options")
        .update({
            isActive: false,
            deletedAt: new Date().toISOString(),
        })
        .eq("optionId", optionId);

    if (error) {
        console.error("deactivateQuizQuestionOption error:", error);
        return { success: false };
    }

    return { success: true };
}