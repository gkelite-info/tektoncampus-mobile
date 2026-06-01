import { supabase } from "@/lib/supabaseClient";

export type CampusBuzzPostShareRow = {
  campusBuzzPostShareId: number;
  campusBuzzPostId: number;
  sharedBy: number;
  sharedTo: string;
  createdAt: string;
};

export async function shareCampusBuzzPost(
  payload: { campusBuzzPostId: number; sharedTo: string },
  userId: number,
) {
  const now = new Date().toISOString();

  const { data: existingShare } = await supabase
    .from("campus_buzz_post_shares")
    .select("campusBuzzPostShareId")
    .eq("campusBuzzPostId", payload.campusBuzzPostId)
    .eq("sharedBy", userId)
    .single();

  if (existingShare) {
    return {
      success: true,
      isNewShare: false,
      campusBuzzPostShareId: existingShare.campusBuzzPostShareId,
    };
  }

  const { data, error } = await supabase
    .from("campus_buzz_post_shares")
    .insert([
      {
        campusBuzzPostId: payload.campusBuzzPostId,
        sharedBy: userId,
        sharedTo: payload.sharedTo,
        createdAt: now,
      },
    ])
    .select("campusBuzzPostShareId")
    .single();

  if (error) {
    console.error("shareCampusBuzzPost error:", error);
    return { success: false, error };
  }

  return {
    success: true,
    isNewShare: true,
    campusBuzzPostShareId: data.campusBuzzPostShareId,
  };
}

export async function fetchCampusBuzzPostShareCount(campusBuzzPostId: number) {
  const { count, error } = await supabase
    .from("campus_buzz_post_shares")
    .select("*", { count: "exact", head: true })
    .eq("campusBuzzPostId", campusBuzzPostId);

  if (error) {
    console.error("fetchCampusBuzzPostShareCount error:", error);
    throw error;
  }

  return count ?? 0;
}

export async function fetchCampusBuzzPostShares(campusBuzzPostId: number) {
  const { data, error } = await supabase
    .from("campus_buzz_post_shares")
    .select(
      `
      campusBuzzPostShareId,
      sharedTo,
      createdAt,
      users (
        userId,
        fullName
      )
    `,
    )
    .eq("campusBuzzPostId", campusBuzzPostId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("fetchCampusBuzzPostShares error:", error);
    throw error;
  }

  return data ?? [];
}

export async function fetchCampusBuzzPostSharesByUser(userId: number) {
  const { data, error } = await supabase
    .from("campus_buzz_post_shares")
    .select(
      `
      campusBuzzPostShareId,
      campusBuzzPostId,
      sharedTo,
      createdAt
    `,
    )
    .eq("sharedBy", userId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("fetchCampusBuzzPostSharesByUser error:", error);
    throw error;
  }

  return data ?? [];
}
