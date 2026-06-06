import { supabase } from "@/lib/supabaseClient";

export async function getUserProfileSummary(userId: number) {
  const { data, error } = await supabase
    .from("profile_summary")
    .select("summaryId, summary")
    .eq("userId", userId)
    .is("deletedAt", null)
    .maybeSingle();

  if (error) {
    console.error("getUserProfileSummary error:", error);
    throw error;
  }

  return data;
}

export async function createProfileSummary(userId: number, summary: string) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("profile_summary")
    .insert([
      {
        userId,
        summary,
        createdAt: now,
        updatedAt: now,
      },
    ])
    .select("summaryId")
    .single();

  if (error) {
    console.error("createProfileSummary error:", error);
    throw error;
  }

  return data;
}

export async function updateProfileSummary(userId: number, summary: string) {
  const { data, error } = await supabase
    .from("profile_summary")
    .update({
      summary,
      updatedAt: new Date().toISOString(),
    })
    .eq("userId", userId)
    .is("deletedAt", null)
    .select()
    .single();

  if (error) {
    console.error("updateProfileSummary error:", error);
    throw error;
  }

  return data;
}
