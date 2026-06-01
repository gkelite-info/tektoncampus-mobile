import { supabase } from "@/lib/supabaseClient";

export type CampusBuzzPostRow = {
  campusBuzzPostId: number;
  collegeId: number;
  title: string;
  category: "achievements" | "announcements" | "clubactivities";
  description: string;
  tags?: string[] | null;
  imageUrl?: string | null;
  createdBy: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

const normalizeTags = (tags?: string[]) => {
  if (!tags || tags.length === 0) return null;

  return [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
};

export async function fetchCampusBuzzFeed(
  collegeId: number,
  page: number = 0,
  limit: number = 10,
  searchQuery: string = "",
) {
  const from = page * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("campus_buzz_post")
    .select(
      `
            campusBuzzPostId, title, category, description, tags, imageUrl, createdBy, createdAt,
            users!campus_buzz_post_createdBy_fkey (
                userId, fullName, role,
                user_profile ( profileUrl )
            )
        `,
    )
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .eq("is_deleted", false)
    .is("deletedAt", null)
    .order("createdAt", { ascending: false })
    .range(from, to);

  if (searchQuery) {
    query = query.or(
      `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchCampusBuzzByCategory(
  collegeId: number,
  category: "achievements" | "announcements" | "clubactivities",
) {
  const { data, error } = await supabase
    .from("campus_buzz_post")
    .select(
      `
      campusBuzzPostId,
      title,
      description,
      imageUrl,
      createdAt
    `,
    )
    .eq("collegeId", collegeId)
    .eq("category", category)
    .eq("isActive", true)
    .eq("is_deleted", false)
    .is("deletedAt", null)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("fetchCampusBuzzByCategory error:", error);
    throw error;
  }

  return data ?? [];
}

export async function fetchCampusBuzzPostById(postId: number) {
  const { data, error } = await supabase
    .from("campus_buzz_post")
    .select("*")
    .eq("campusBuzzPostId", postId)
    .eq("isActive", true)
    .eq("is_deleted", false)
    .is("deletedAt", null)
    .single();

  if (error) {
    console.error("fetchCampusBuzzPostById error:", error);
    throw error;
  }

  return data;
}

export async function checkExistingCampusBuzzPost(
  collegeId: number,
  title: string,
) {
  const { data, error } = await supabase
    .from("campus_buzz_post")
    .select("campusBuzzPostId")
    .eq("collegeId", collegeId)
    .eq("title", title.trim())
    .is("deletedAt", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: true, data: null };
    }
    throw error;
  }

  return { success: true, data };
}

export async function saveCampusBuzzPost(
  payload: {
    campusBuzzPostId?: number;
    collegeId: number;
    title: string;
    category: "achievements" | "announcements" | "clubactivities";
    description: string;
    tags?: string[];
    imageUrl?: string;
  },
  userId: number,
) {
  const now = new Date().toISOString();

  const normalizedArray = normalizeTags(payload.tags);

  const basePayload: any = {
    collegeId: payload.collegeId,
    title: payload.title.trim(),
    category: payload.category,
    description: payload.description.trim(),
    tags: normalizedArray ? normalizedArray.join(", ") : null,
    imageUrl: payload.imageUrl ?? null,
    updatedAt: now,
  };

  if (!payload.campusBuzzPostId) {
    basePayload.createdBy = userId;
    basePayload.createdAt = now;

    const { data, error } = await supabase
      .from("campus_buzz_post")
      .insert([basePayload])
      .select("campusBuzzPostId")
      .single();

    if (error) {
      console.error("saveCampusBuzzPost error:", error);
      return { success: false, error };
    }

    return {
      success: true,
      campusBuzzPostId: data.campusBuzzPostId,
    };
  }

  const { error } = await supabase
    .from("campus_buzz_post")
    .update(basePayload)
    .eq("campusBuzzPostId", payload.campusBuzzPostId);

  if (error) {
    console.error("saveCampusBuzzPost error:", error);
    return { success: false, error };
  }

  return {
    success: true,
    campusBuzzPostId: payload.campusBuzzPostId,
  };
}

export async function deactivateCampusBuzzPost(postId: number) {
  const { error } = await supabase
    .from("campus_buzz_post")
    .update({
      isActive: false,
      is_deleted: true,
      deletedAt: new Date().toISOString(),
    })
    .eq("campusBuzzPostId", postId);

  if (error) {
    console.error("deactivateCampusBuzzPost error:", error);
    return { success: false };
  }

  return { success: true };
}

export async function fetchCampusBuzzByUser(userId: number) {
  const { data, error } = await supabase
    .from("campus_buzz_post")
    .select(
      `
      campusBuzzPostId,
      title,
      category,
      createdAt
    `,
    )
    .eq("createdBy", userId)
    .eq("isActive", true)
    .eq("is_deleted", false)
    .is("deletedAt", null)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("fetchCampusBuzzByUser error:", error);
    throw error;
  }

  return data ?? [];
}

export async function fetchCampusBuzzByTag(collegeId: number, tag: string) {
  const { data, error } = await supabase
    .from("campus_buzz_post")
    .select("*")
    .eq("collegeId", collegeId)
    .contains("tags", [tag.toLowerCase()])
    .eq("isActive", true)
    .eq("is_deleted", false)
    .is("deletedAt", null)
    .order("createdAt", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
