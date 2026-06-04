import { supabase } from "@/lib/supabaseClient";

export type CampusBuzzPostLikeRow = {
    campusBuzzPostLikeId: number;
    campusBuzzPostId: number;
    likedBy: number;
    is_deleted: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

export async function checkCampusBuzzPostLiked(
    campusBuzzPostId: number,
    userId: number,
) {
    const { data, error } = await supabase
        .from("campus_buzz_post_likes")
        .select("campusBuzzPostLikeId, is_deleted")
        .eq("campusBuzzPostId", campusBuzzPostId)
        .eq("likedBy", userId)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return { liked: false, data: null };
        }
        throw error;
    }

    return {
        liked: !data.is_deleted,
        data,
    };
}

export async function likeCampusBuzzPost(
    campusBuzzPostId: number,
    userId: number,
) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("campus_buzz_post_likes")
        .upsert(
            {
                campusBuzzPostId,
                likedBy: userId,
                is_deleted: false,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
            },
            {
                onConflict: "campusBuzzPostId,likedBy,is_deleted",
            },
        )
        .select("campusBuzzPostLikeId")
        .single();

    if (error) {
        console.error("likeCampusBuzzPost error:", error);
        return { success: false, error };
    }

    return { success: true, campusBuzzPostLikeId: data.campusBuzzPostLikeId };
}

export async function unlikeCampusBuzzPost(
    campusBuzzPostId: number,
    userId: number,
) {
    const { error } = await supabase
        .from("campus_buzz_post_likes")
        .update({
            is_deleted: true,
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
        .eq("campusBuzzPostId", campusBuzzPostId)
        .eq("likedBy", userId)
        .eq("is_deleted", false);

    if (error) {
        console.error("unlikeCampusBuzzPost error:", error);
        return { success: false };
    }

    return { success: true };
}

export async function fetchCampusBuzzPostLikeCount(
    campusBuzzPostId: number,
) {
    const { count, error } = await supabase
        .from("campus_buzz_post_likes")
        .select("*", { count: "exact", head: true })
        .eq("campusBuzzPostId", campusBuzzPostId)
        .eq("is_deleted", false);

    if (error) {
        console.error("fetchCampusBuzzPostLikeCount error:", error);
        throw error;
    }

    return count ?? 0;
}

export async function toggleCampusBuzzPostLike(
    campusBuzzPostId: number,
    userId: number,
) {
    const { liked } = await checkCampusBuzzPostLiked(
        campusBuzzPostId,
        userId,
    );

    if (liked) {
        return await unlikeCampusBuzzPost(campusBuzzPostId, userId);
    }

    return await likeCampusBuzzPost(campusBuzzPostId, userId);
}

export async function fetchCampusBuzzPostLikes(
    campusBuzzPostId: number,
) {
    const { data, error } = await supabase
        .from("campus_buzz_post_likes")
        .select(`
      campusBuzzPostLikeId,
      likedBy,
      createdAt,
      users (
        userId,
        fullName,
        avatarUrl
      )
    `)
        .eq("campusBuzzPostId", campusBuzzPostId)
        .eq("is_deleted", false)
        .order("createdAt", { ascending: false });

    if (error) {
        console.error("fetchCampusBuzzPostLikes error:", error);
        throw error;
    }

    return data ?? [];
}
