import { supabase } from "@/lib/supabaseClient";

export type CampusBuzzPostCommentRow = {
  campusBuzzPostCommentId: number;
  campusBuzzPostId: number;
  commentedBy: number;
  comment: string;
  parentCommentId: number | null;
  isActive: boolean;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export async function addCampusBuzzPostComment(
  payload: {
    campusBuzzPostId: number;
    comment: string;
    parentCommentId?: number | null;
  },
  userId: number,
) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("campus_buzz_post_comments")
    .insert([
      {
        campusBuzzPostId: payload.campusBuzzPostId,
        commentedBy: userId,
        comment: payload.comment.trim(),
        parentCommentId: payload.parentCommentId ?? null,
        isActive: true,
        is_deleted: false,
        createdAt: now,
        updatedAt: now,
      },
    ])
    .select("campusBuzzPostCommentId")
    .single();

  if (error) {
    console.error("addCampusBuzzPostComment error:", error);
    return { success: false, error };
  }

  return {
    success: true,
    campusBuzzPostCommentId: data.campusBuzzPostCommentId,
  };
}

export async function fetchCampusBuzzPostComments(campusBuzzPostId: number) {
  const { data, error } = await supabase
    .from("campus_buzz_post_comments")
    .select(
      `
            campusBuzzPostCommentId, campusBuzzPostId, comment, parentCommentId, commentedBy, createdAt,
            users (
                userId, fullName, role,
                user_profile ( profileUrl )
            )
        `,
    )
    .eq("campusBuzzPostId", campusBuzzPostId)
    .eq("isActive", true)
    .eq("is_deleted", false)
    .order("createdAt", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchCampusBuzzPostReplies(parentCommentId: number) {
  const { data, error } = await supabase
    .from("campus_buzz_post_comments")
    .select(
      `
      campusBuzzPostCommentId,
      comment,
      commentedBy,
      createdAt,
      users (
        userId,
        fullName,
        avatarUrl
      )
    `,
    )
    .eq("parentCommentId", parentCommentId)
    .eq("isActive", true)
    .eq("is_deleted", false)
    .order("createdAt", { ascending: true });

  if (error) {
    console.error("fetchCampusBuzzPostReplies error:", error);
    throw error;
  }

  return data ?? [];
}

export async function updateCampusBuzzPostComment(
  campusBuzzPostCommentId: number,
  comment: string,
) {
  const { error } = await supabase
    .from("campus_buzz_post_comments")
    .update({
      comment: comment.trim(),
      updatedAt: new Date().toISOString(),
    })
    .eq("campusBuzzPostCommentId", campusBuzzPostCommentId)
    .eq("is_deleted", false);

  if (error) {
    console.error("updateCampusBuzzPostComment error:", error);
    return { success: false };
  }

  return { success: true };
}

export async function deleteCampusBuzzPostComment(
  campusBuzzPostCommentId: number,
) {
  const { error } = await supabase
    .from("campus_buzz_post_comments")
    .update({
      isActive: false,
      is_deleted: true,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq("campusBuzzPostCommentId", campusBuzzPostCommentId);

  if (error) {
    console.error("deleteCampusBuzzPostComment error:", error);
    return { success: false };
  }

  return { success: true };
}

export async function fetchCampusBuzzPostCommentCount(
  campusBuzzPostId: number,
) {
  const { count, error } = await supabase
    .from("campus_buzz_post_comments")
    .select("*", { count: "exact", head: true })
    .eq("campusBuzzPostId", campusBuzzPostId)
    .eq("isActive", true)
    .eq("is_deleted", false);

  if (error) {
    console.error("fetchCampusBuzzPostCommentCount error:", error);
    throw error;
  }

  return count ?? 0;
}
