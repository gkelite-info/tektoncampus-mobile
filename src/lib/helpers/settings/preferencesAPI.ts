import { supabase } from "@/lib/supabaseClient";

export async function getUserPreferences(userId: number) {
  const { data, error } = await supabase
    .from("user_preferences")
    .select(
      "email_alerts, assignment_reminders, event_reminders, class_reminders, font_scale",
    )
    .eq("userId", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching preferences:", error);
    return null;
  }

  return data;
}

export async function updateUserPreferences(
  userId: number,
  updates: {
    email_alerts?: boolean;
    assignment_reminders?: boolean;
    event_reminders?: boolean;
    class_reminders?: boolean;
    font_scale?: number;
  },
) {
  const now = new Date().toISOString();

  const { data: existingPref } = await supabase
    .from("user_preferences")
    .select("userId")
    .eq("userId", userId)
    .single();

  if (existingPref) {
    const { error } = await supabase
      .from("user_preferences")
      .update({
        ...updates,
        updatedAt: now,
      })
      .eq("userId", userId);

    if (error) {
      console.error("Error updating preferences:", error);
      return { success: false, error };
    }
  } else {
    const { error } = await supabase.from("user_preferences").insert({
      userId: userId,
      ...updates,
      createdAt: now,
      updatedAt: now,
    });

    if (error) {
      console.error("Error inserting preferences:", error);
      return { success: false, error };
    }
  }

  return { success: true };
}
