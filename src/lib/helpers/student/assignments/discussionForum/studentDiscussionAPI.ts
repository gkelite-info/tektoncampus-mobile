import { supabase } from "@/lib/supabaseClient";

export async function fetchActiveDiscussionsForStudent(collegeSectionsId: number, studentId: number) {
    const today = new Date().toISOString().split("T")[0];

    await supabase
        .from("discussion_forum")
        .update({
            isActive: false,
            is_deleted: true,
            deletedAt: new Date().toISOString(),
        })
        .lt("deadline", today)
        .eq("isActive", true);

    const { data, error } = await supabase
        .from("discussion_forum_sections")
        .select(`
            discussionSectionId,
            collegeSectionsId,
            marks,
            discussion_forum (
                discussionId,
                title,
                description,
                deadline,
                createdAt,
                isActive,
                createdBy,
                discussion_file_uploads (
                    discussionFileUploadId,
                    fileUrl
                ),
                faculty:createdBy (
                    fullName
                )
            )
        `)
        .eq("collegeSectionsId", collegeSectionsId)
        .eq("isActive", true)
        .is("deletedAt", null);

    if (error) {
        console.error("fetchActiveDiscussionsForStudent error:", error);
        throw error;
    }

    return (data ?? [])
        .filter((d: any) => d.discussion_forum?.isActive === true)
        .map((d: any) => ({
            discussionId: d.discussion_forum?.discussionId,
            discussionSectionId: d.discussionSectionId,
            title: d.discussion_forum?.title,
            description: d.discussion_forum?.description,
            deadline: d.discussion_forum?.deadline,
            createdAt: d.discussion_forum?.createdAt,
            marks: d.marks,
            facultyName: d.discussion_forum?.faculty?.fullName ?? "Faculty",
            attachments: d.discussion_forum?.discussion_file_uploads ?? [],
        }));
}

export async function fetchCompletedDiscussionsForStudent(collegeSectionsId: number) {
    const { data, error } = await supabase
        .from("discussion_forum_sections")
        .select(`
            discussionSectionId,
            collegeSectionsId,
            marks,
            discussion_forum (
                discussionId,
                title,
                description,
                deadline,
                createdAt,
                isActive,
                createdBy,
                discussion_file_uploads (
                    discussionFileUploadId,
                    fileUrl
                ),
                faculty:createdBy (
                    fullName
                )
            )
        `)
        .eq("collegeSectionsId", collegeSectionsId)
        .eq("isActive", true)
        .is("deletedAt", null);

    if (error) {
        console.error("fetchCompletedDiscussionsForStudent error:", error);
        throw error;
    }

    return (data ?? [])
        .filter((d: any) => d.discussion_forum?.isActive === false)
        .map((d: any) => ({
            discussionId: d.discussion_forum?.discussionId,
            discussionSectionId: d.discussionSectionId,
            title: d.discussion_forum?.title,
            description: d.discussion_forum?.description,
            deadline: d.discussion_forum?.deadline,
            createdAt: d.discussion_forum?.createdAt,
            marks: d.marks,
            facultyName: d.discussion_forum?.faculty?.fullName ?? "Faculty",
            attachments: d.discussion_forum?.discussion_file_uploads ?? [],
        }));
}