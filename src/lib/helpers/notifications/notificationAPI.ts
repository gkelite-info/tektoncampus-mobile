import { supabase } from "@/lib/supabaseClient";

export async function getUnreadNotificationCount(userId: number) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("userId", userId)
    .eq("isRead", false);

  if (error) {
    console.error("getUnreadNotificationCount error:", error);
    return 0;
  }

  return count ?? 0;
}

export async function getUserNotifications(userId: number) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
    .limit(20);

  if (error) {
    console.error("getUserNotifications error:", error);
    return [];
  }

  return data ?? [];
}

export async function markNotificationRead(notificationId: number) {
  const { error } = await supabase
    .from("notifications")
    .update({ isRead: true })
    .eq("notificationId", notificationId);

  if (error) {
    console.error("markNotificationRead error:", error);
    return { success: false, error };
  }

  return { success: true };
}

export async function sendUniversalNotifications(payload: {
  userIds: number[];
  title: string;
  message: string;
  type: "Meeting" | "Announcement" | "System";
  referenceId?: number | null;
}) {
  if (!payload.userIds || payload.userIds.length === 0)
    return { success: true };

  const now = new Date().toISOString();

  const uniqueUsers = Array.from(new Set(payload.userIds));

  const rows = uniqueUsers.map((uid) => ({
    userId: uid,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    referenceId: payload.referenceId || null,
    isRead: false,
    createdAt: now,
    updatedAt: now,
  }));

  const { error } = await supabase.from("notifications").insert(rows);

  if (error) {
    console.error("Error inserting universal notifications:", error);
    return { success: false, error };
  }

  return { success: true };
}
