import { supabase } from "@/lib/supabaseClient";

export type DiscussionForumRow = {
  discussionId: number;
  title: string;
  description: string;
  deadline: string;
  createdBy: number | null;
  adminId: number | null;
  isActive: boolean;
  is_deleted: boolean | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export async function fetchActiveDiscussions() {
  const today = new Date().toISOString().split("T")[0];

  const { error: deactivateError } = await supabase
    .from("discussion_forum")
    .update({
      isActive: false,
      is_deleted: true,
      deletedAt: new Date().toISOString(),
    })
    .lt("deadline", today)
    .eq("isActive", true);

  if (deactivateError) {
    console.error("auto deactivate discussions error:", deactivateError);
  }

  const { data, error } = await supabase
    .from("discussion_forum")
    .select(
      `
      discussionId,
      title,
      description,
      deadline,
      createdBy,
      adminId,
      isActive,
      createdAt,
      updatedAt,
      deletedAt
    `,
    )
    .eq("isActive", true)
    .is("deletedAt", null)
    .order("deadline", { ascending: true });

  if (error) {
    console.error("fetchActiveDiscussions error:", error);
    throw error;
  }

  return data ?? [];
}

export async function fetchExistingDiscussion(title: string, deadline: string) {
  const { data, error } = await supabase
    .from("discussion_forum")
    .select("discussionId")
    .eq("title", title.trim())
    .eq("deadline", deadline)
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

export async function saveDiscussionForum(
  payload: {
    discussionId?: number;
    title: string;
    description: string;
    deadline: string;
  },
  options: {
    facultyId?: number;
    adminId?: number;
  },
) {
  const now = new Date().toISOString();

  const upsertPayload: any = {
    title: payload.title.trim(),
    description: payload.description.trim(),
    deadline: payload.deadline,
    updatedAt: now,
  };

  if (!payload.discussionId) {
    upsertPayload.createdAt = now;
    upsertPayload.createdBy = options.facultyId ?? null;
    upsertPayload.adminId = options.adminId ?? null;

    const { data, error } = await supabase
      .from("discussion_forum")
      .insert([upsertPayload])
      .select("discussionId")
      .single();

    if (error) {
      console.error("saveDiscussionForum error:", error);
      return { success: false, error };
    }

    return {
      success: true,
      discussionId: data.discussionId,
    };
  }

  const { error } = await supabase
    .from("discussion_forum")
    .update(upsertPayload)
    .eq("discussionId", payload.discussionId);

  if (error) {
    console.error("updateDiscussionForum error:", error);
    return { success: false, error };
  }

  return {
    success: true,
    discussionId: payload.discussionId,
  };
}

export async function deactivateDiscussionForum(discussionId: number) {
  const { error } = await supabase
    .from("discussion_forum")
    .update({
      isActive: false,
      is_deleted: true,
      deletedAt: new Date().toISOString(),
    })
    .eq("discussionId", discussionId);

  if (error) {
    console.error("deactivateDiscussionForum error:", error);
    return { success: false };
  }

  return { success: true };
}

// export async function fetchDiscussionsByFacultyId(facultyId: number) {
//     const today = new Date().toISOString().split("T")[0];
//     await supabase
//         .from("discussion_forum")
//         .update({
//             isActive: false,
//             is_deleted: true,
//             deletedAt: new Date().toISOString(),
//         })
//         .lt("deadline", today)
//         .eq("isActive", true);

//     const { data, error } = await supabase
//         .from("discussion_forum")
//         .select(`
//       discussionId,
//       title,
//       description,
//       deadline,
//       createdAt,
//       discussion_file_uploads (
//             fileUrl,
//             isActive,
//             is_deleted,
//             deletedAt
//      )
//     `)
//         .eq("createdBy", facultyId)
//         .eq("isActive", true)
//         .is("deletedAt", null)
//         .order("deadline", { ascending: true });

//     if (error) {
//         console.error("fetchDiscussionsByFacultyId error:", error);
//         throw error;
//     }

//     // return data ?? [];
//     return (data ?? []).map(d => ({
//         ...d,
//         discussion_file_uploads:
//             (d.discussion_file_uploads ?? [])
//                 .filter(f => f.isActive && !f.is_deleted && !f.deletedAt)
//     }));
// }

// export async function fetchCompletedDiscussionsByFacultyId(facultyId: number) {
//     const { data, error } = await supabase
//         .from("discussion_forum")
//         .select(`
//             discussionId,
//             title,
//             description,
//             deadline,
//             createdAt,
//             discussion_file_uploads (
//                 fileUrl,
//                 isActive,
//                 is_deleted,
//                 deletedAt
//             )
//         `)
//         .eq("createdBy", facultyId)
//         .eq("isActive", false)
//         .order("deadline", { ascending: false });

//     if (error) {
//         console.error("fetchCompletedDiscussionsByFacultyId error:", error);
//         throw error;
//     }

//     // return data ?? [];

//     return (data ?? []).map(d => ({
//         ...d,
//         discussion_file_uploads:
//             (d.discussion_file_uploads ?? [])
//                 .filter(f => f.isActive && !f.is_deleted && !f.deletedAt) // CHANGED
//     }));
// }

// export async function fetchDiscussionsByFacultyId(
//   facultyId: number,
//   page: number = 1,
//   limit: number = 10,
// ) {
//   const today = new Date().toISOString().split("T")[0];
//   const from = (page - 1) * limit;
//   const to = from + limit - 1;

//   await supabase
//     .from("discussion_forum")
//     .update({
//       isActive: false,
//       is_deleted: true,
//       deletedAt: new Date().toISOString(),
//     })
//     .lt("deadline", today)
//     .eq("isActive", true);

//   const { data, error, count } = await supabase
//     .from("discussion_forum")
//     .select(
//       `
//             discussionId,
//             title,
//             description,
//             deadline,
//             createdAt,
//             discussion_file_uploads (
//                 fileUrl,
//                 isActive,
//                 is_deleted,
//                 deletedAt
//             )
//         `,
//       { count: "exact" },
//     )
//     .eq("createdBy", facultyId)
//     .eq("isActive", true)
//     .is("deletedAt", null)
//     .order("deadline", { ascending: true })
//     .range(from, to);

//   if (error) {
//     console.error("fetchDiscussionsByFacultyId error:", error);
//     throw error;
//   }

//   const mappedData = (data ?? []).map((d) => ({
//     ...d,
//     discussion_file_uploads: (d.discussion_file_uploads ?? []).filter(
//       (f: any) => f.isActive && !f.is_deleted && !f.deletedAt,
//     ),
//   }));

//   return { data: mappedData, totalCount: count ?? 0 };
// }

// export async function fetchCompletedDiscussionsByFacultyId(
//   facultyId: number,
//   page: number = 1,
//   limit: number = 10,
// ) {
//   const from = (page - 1) * limit;
//   const to = from + limit - 1;

//   const { data, error, count } = await supabase
//     .from("discussion_forum")
//     .select(
//       `
//             discussionId,
//             title,
//             description,
//             deadline,
//             createdAt,
//             discussion_file_uploads (
//                 fileUrl,
//                 isActive,
//                 is_deleted,
//                 deletedAt
//             )
//         `,
//       { count: "exact" },
//     )
//     .eq("createdBy", facultyId)
//     .eq("isActive", false)
//     .order("deadline", { ascending: false })
//     .range(from, to);

//   if (error) {
//     console.error("fetchCompletedDiscussionsByFacultyId error:", error);
//     throw error;
//   }

//   const mappedData = (data ?? []).map((d) => ({
//     ...d,
//     discussion_file_uploads: (d.discussion_file_uploads ?? []).filter(
//       (f: any) => f.isActive && !f.is_deleted && !f.deletedAt,
//     ),
//   }));

//   return { data: mappedData, totalCount: count ?? 0 };
// }

export async function fetchDiscussionById(discussionId: number) {
  const { data, error } = await supabase
    .from("discussion_forum")
    .select(
      `
            discussionId,
            title,
            description,
            deadline,
            createdAt,
            discussion_forum_sections (
                discussionSectionId,
                collegeSectionsId,
                marks
            ),
            discussion_file_uploads (
                discussionFileUploadId,
                fileUrl,
                isActive,
                is_deleted,
                deletedAt
            )
        `,
    )
    .eq("discussionId", discussionId)
    .eq("isActive", true)
    .is("deletedAt", null)
    .single();

  if (error) {
    console.error("fetchDiscussionById error:", error);
    throw error;
  }

  return data;
}

export async function fetchDiscussionsByFacultyId(
  facultyId: number,
  page: number = 1,
  limit: number = 10,
) {
  const today = new Date().toISOString().split("T")[0];
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  await supabase
    .from("discussion_forum")
    .update({
      isActive: false,
      is_deleted: true,
      deletedAt: new Date().toISOString(),
    })
    .lt("deadline", today)
    .eq("isActive", true);

  const { data, error, count } = await supabase
    .from("discussion_forum")
    .select(
      `
            discussionId,
            title,
            description,
            deadline,
            createdAt,
            discussion_file_uploads (
                fileUrl,
                isActive,
                is_deleted,
                deletedAt
            )
        `,
      { count: "exact" },
    )
    .eq("createdBy", facultyId)
    .eq("isActive", true)
    .eq("is_deleted", false) // 🟢 ADDED: Exclude deleted
    .is("deletedAt", null)
    .order("deadline", { ascending: true })
    .range(from, to);

  if (error) {
    console.error("fetchDiscussionsByFacultyId error:", error);
    throw error;
  }

  const mappedData = (data ?? []).map((d) => ({
    ...d,
    discussion_file_uploads: (d.discussion_file_uploads ?? []).filter(
      (f: any) => f.isActive && !f.is_deleted && !f.deletedAt,
    ),
  }));

  return { data: mappedData, totalCount: count ?? 0 };
}

export async function fetchCompletedDiscussionsByFacultyId(
  facultyId: number,
  page: number = 1,
  limit: number = 10,
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("discussion_forum")
    .select(
      `
            discussionId,
            title,
            description,
            deadline,
            createdAt,
            discussion_file_uploads (
                fileUrl,
                isActive,
                is_deleted,
                deletedAt
            )
        `,
      { count: "exact" },
    )
    .eq("createdBy", facultyId)
    .eq("isActive", false)
    .eq("is_deleted", false) // 🟢 ADDED: Exclude deleted
    .order("deadline", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("fetchCompletedDiscussionsByFacultyId error:", error);
    throw error;
  }

  const mappedData = (data ?? []).map((d) => ({
    ...d,
    discussion_file_uploads: (d.discussion_file_uploads ?? []).filter(
      (f: any) => f.isActive && !f.is_deleted && !f.deletedAt,
    ),
  }));

  return { data: mappedData, totalCount: count ?? 0 };
}
