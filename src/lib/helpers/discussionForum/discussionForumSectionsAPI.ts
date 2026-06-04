import { supabase } from "@/lib/supabaseClient";

export type DiscussionForumSectionRow = {
    discussionSectionId: number;
    discussionId: number;
    collegeSectionsId: number;
    marks: number;
    isActive: boolean;
    is_deleted: boolean | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};


export async function fetchDiscussionSections(discussionId: number) {
    const { data, error } = await supabase
        .from("discussion_forum_sections")
        .select(`
      discussionSectionId,
      discussionId,
      collegeSectionsId,
      marks,
      isActive,
      createdAt,
      updatedAt,
      deletedAt
    `)
        .eq("discussionId", discussionId)
        .eq("isActive", true)
        .is("deletedAt", null)
        .order("collegeSectionsId", { ascending: true });

    if (error) {
        console.error("fetchDiscussionSections error:", error);
        throw error;
    }

    return data ?? [];
}


export async function saveDiscussionSections(
    discussionId: number,
    sections: {
        collegeSectionsId: number;
        marks: number;
    }[],
) {
    const now = new Date().toISOString();

    const payload = sections.map((section) => ({
        discussionId,
        collegeSectionsId: section.collegeSectionsId,
        marks: section.marks,
        createdAt: now,
        updatedAt: now,
    }));

    const { error } = await supabase
        .from("discussion_forum_sections")
        .insert(payload);

    if (error) {
        console.error("saveDiscussionSections error:", error);
        return { success: false, error };
    }

    return { success: true };
}

export async function fetchDiscussionSectionByDiscussionId(discussionId: number) {
    const { data, error } = await supabase
        .from("discussion_forum_sections")
        .select("discussionSectionId")
        .eq("discussionId", discussionId)
        .eq("isActive", true)
        .order("createdAt", { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error("fetchDiscussionSectionByDiscussionId error:", error);
        return { success: false, data: null };
    }

    return { success: true, data };
}

export async function updateDiscussionSectionMarks(
    discussionSectionId: number,
    marks: number,
) {
    const { error } = await supabase
        .from("discussion_forum_sections")
        .update({
            marks,
            updatedAt: new Date().toISOString(),
        })
        .eq("discussionSectionId", discussionSectionId)
        .eq("isActive", true)
        .is("deletedAt", null);

    if (error) {
        console.error("updateDiscussionSectionMarks error:", error);
        return { success: false };
    }

    return { success: true };
}


export async function deactivateDiscussionSections(
    discussionId: number,
) {
    const { error } = await supabase
        .from("discussion_forum_sections")
        .update({
            isActive: false,
            is_deleted: true,
            deletedAt: new Date().toISOString(),
        })
        .eq("discussionId", discussionId)
        .eq("isActive", true);

    if (error) {
        console.error("deactivateDiscussionSections error:", error);
        return { success: false };
    }

    return { success: true };
}


export async function replaceDiscussionSections(
    discussionId: number,
    sections: {
        collegeSectionsId: number;
        marks: number;
    }[],
) {
    const deactivate = await deactivateDiscussionSections(discussionId);
    if (!deactivate.success) return { success: false };

    return await saveDiscussionSections(discussionId, sections);
}