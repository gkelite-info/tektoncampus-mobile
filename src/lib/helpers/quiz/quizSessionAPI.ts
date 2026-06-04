import { supabase } from "@/lib/supabaseClient";

export async function startOrGetQuizSession(
    quizId: number,
    studentId: number,
    attemptNumber: number,
): Promise<{ startedAt: string }> {
    const now = new Date().toISOString();

    // ✅ Upsert — if row exists for this attempt, ignore (don't overwrite startedAt)
    const { error: upsertError } = await supabase
        .from("quiz_sessions")
        .upsert(
            [
                {
                    quizId,
                    studentId,
                    attemptNumber,
                    startedAt: now,
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                },
            ],
            {
                onConflict: "quizId,studentId,attemptNumber",
                ignoreDuplicates: true, // ✅ never overwrite original startedAt
            },
        );

    if (upsertError) {
        console.error("startOrGetQuizSession upsert error:", upsertError);
        throw upsertError;
    }

    // ✅ Always fetch the real startedAt for this specific attempt
    const { data, error: fetchError } = await supabase
        .from("quiz_sessions")
        .select("startedAt")
        .eq("quizId", quizId)
        .eq("studentId", studentId)
        .eq("attemptNumber", attemptNumber)
        .maybeSingle();

    if (fetchError) {
        console.error("startOrGetQuizSession fetch error:", fetchError);
        throw fetchError;
    }

    if (!data) {
        throw new Error("Failed to get or create quiz session");
    }

    return { startedAt: data.startedAt };
}

export async function endQuizSession(
    quizId: number,
    studentId: number,
    attemptNumber: number,
): Promise<void> {
    const { error } = await supabase
        .from("quiz_sessions")
        .update({
            isActive: false,
            updatedAt: new Date().toISOString(),
        })
        .eq("quizId", quizId)
        .eq("studentId", studentId)
        .eq("attemptNumber", attemptNumber);

    if (error) {
        console.error("endQuizSession error:", error);
    }
}

// ✅ Helper to get attempts left — reads maxAttempts from quiz, counts submissions
export async function getAttemptsLeft(
    quizId: number,
    studentId: number,
): Promise<{ attemptsLeft: number; attemptNumber: number; maxAttempts: number }> {
    const [{ data: quizData }, { count: usedCount }] = await Promise.all([
        supabase
            .from("quizzes")
            .select("maxAttempts")
            .eq("quizId", quizId)
            .single(),
        supabase
            .from("quiz_submissions")
            .select("submissionId", { count: "exact", head: true })
            .eq("quizId", quizId)
            .eq("studentId", studentId)
            .eq("isActive", true)
            .is("deletedAt", null),
    ]);

    const maxAttempts = quizData?.maxAttempts ?? 1;
    const usedAttempts = usedCount ?? 0;
    const attemptsLeft = Math.max(0, maxAttempts - usedAttempts);
    const attemptNumber = usedAttempts + 1; // next attempt number

    return { attemptsLeft, attemptNumber, maxAttempts };
}

export async function getSessionStartTime(
    quizId: number,
    studentId: number,
    attemptNumber: number
): Promise<string | null> {
    const { data, error } = await supabase
        .from("quiz_sessions")
        .select("startedAt")
        .eq("quizId", quizId)
        .eq("studentId", studentId)
        .eq("attemptNumber", attemptNumber)
        .maybeSingle();

    if (error) {
        console.error("Error fetching session start time:", error);
        return null;
    }

    return data?.startedAt ?? null;
}