import { supabase } from "@/lib/supabaseClient";

export async function getUserLanguages(userId: number) {
  const { data, error } = await supabase
    .from("language")
    .select('"languageId", "languageName"')
    .eq("userId", userId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;

  return data?.languageName || [];
}

export async function upsertUserLanguages(
  userId: number,
  languages: string[]
) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("language")
    .upsert(
      {
        userId,
        languageName: languages,
        updatedAt: now,
        createdAt: now,
        is_deleted: false,
      },
      {
        onConflict: "userId",
      }
    );

  if (error) throw error;
}

export async function deleteUserLanguages(userId: number) {
  const { error } = await supabase
    .from("language")
    .update({
      is_deleted: true,
      deletedAt: new Date().toISOString(),
    })
    .eq("userId", userId);

  if (error) throw error;
}
