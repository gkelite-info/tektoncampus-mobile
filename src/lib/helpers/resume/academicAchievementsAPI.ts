import { supabase } from "@/lib/supabaseClient";

const now = () => new Date().toISOString();

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface AcademicAchievementPayload {
  studentId: number;
  achievementName: string;
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export const getAcademicAchievements = async (studentId: number) => {
  const { data, error } = await supabase
    .from("resume_academic_achievements")
    .select("*")
    .eq("studentId", studentId)
    .eq("is_deleted", false);

  if (error) {
    console.error("[getAcademicAchievements]", JSON.stringify(error));
    throw new Error(error.message);
  }

  return data ?? [];
};

// ─── UPSERT ───────────────────────────────────────────────────────────────────
export const upsertAcademicAchievements = async (
  payload: AcademicAchievementPayload[]
) => {
  const timestamp = now();

  const rows = payload.map((item) => ({
    studentId: item.studentId,
    achievementName: item.achievementName,
    is_deleted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  const { data, error } = await supabase
    .from("resume_academic_achievements")
    .upsert(rows, {
      onConflict: "studentId,achievementName", // ⚠️ IMPORTANT (add unique constraint)
      ignoreDuplicates: false,
    })
    .select();

  if (error) {
    console.error("[upsertAcademicAchievements]", JSON.stringify(error));
    throw new Error(error.message);
  }

  return data;
};

// ─── SOFT DELETE ──────────────────────────────────────────────────────────────
export const softDeleteAcademicAchievement = async (
  studentId: number,
  achievementName: string
) => {
  const { error } = await supabase
    .from("resume_academic_achievements")
    .update({
      is_deleted: true,
      updatedAt: now(),
    })
    .eq("studentId", studentId)
    .eq("achievementName", achievementName);

  if (error) {
    console.error(
      "[softDeleteAcademicAchievement]",
      JSON.stringify(error)
    );
    throw new Error(error.message);
  }

  return { success: true };
};