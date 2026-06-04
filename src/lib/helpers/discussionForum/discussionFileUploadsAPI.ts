import { supabase } from "@/lib/supabaseClient";

export type DiscussionFileUploadRow = {
  discussionFileUploadId: number;
  discussionId: number;
  discussionSectionId: number;
  fileUrl: string;
  isActive: boolean;
  is_deleted: boolean | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export async function fetchDiscussionFiles(discussionId: number) {
  const { data, error } = await supabase
    .from("discussion_file_uploads")
    .select(
      `
      discussionFileUploadId,
      discussionId,
      discussionSectionId,
      fileUrl,
      isActive,
      createdAt,
      updatedAt,
      deletedAt
    `,
    )
    .eq("discussionId", discussionId)
    .eq("isActive", true)
    .is("deletedAt", null)
    .order("createdAt", { ascending: true });

  if (error) {
    console.error("fetchDiscussionFiles error:", error);
    throw error;
  }

  return data ?? [];
}

export async function fetchDiscussionFilesBySection(
  discussionSectionId: number,
) {
  const { data, error } = await supabase
    .from("discussion_file_uploads")
    .select(
      `
      discussionFileUploadId,
      discussionId,
      discussionSectionId,
      fileUrl,
      createdAt
    `,
    )
    .eq("discussionSectionId", discussionSectionId)
    .eq("isActive", true)
    .is("deletedAt", null)
    .order("createdAt", { ascending: true });

  if (error) {
    console.error("fetchDiscussionFilesBySection error:", error);
    throw error;
  }

  return data ?? [];
}

export async function saveDiscussionFiles(
  discussionId: number,
  fileUrls: string[],
  discussionSectionId?: number,
) {
  if (!fileUrls.length) return { success: true };

  const now = new Date().toISOString();

  const insertPayload = fileUrls.map((fileUrl) => ({
    discussionId,
    fileUrl,
    ...(discussionSectionId ? { discussionSectionId } : {}),
    createdAt: now,
    updatedAt: now,
  }));

  const { error } = await supabase
    .from("discussion_file_uploads")
    .insert(insertPayload);

  if (error) {
    console.error("saveDiscussionFiles error:", error);
    return { success: false, error };
  }

  return { success: true };
}

export async function deactivateDiscussionFile(discussionFileUploadId: number) {
  const { error } = await supabase
    .from("discussion_file_uploads")
    .update({
      isActive: false,
      is_deleted: true,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq("discussionFileUploadId", discussionFileUploadId)
    .eq("isActive", true);

  if (error) {
    console.error("deactivateDiscussionFile error:", error);
    return { success: false };
  }

  return { success: true };
}

export async function deactivateDiscussionFilesByDiscussion(
  discussionId: number,
) {
  const { error } = await supabase
    .from("discussion_file_uploads")
    .update({
      isActive: false,
      is_deleted: true,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq("discussionId", discussionId)
    .eq("isActive", true);

  if (error) {
    console.error("deactivateDiscussionFilesByDiscussion error:", error);
    return { success: false };
  }

  return { success: true };
}

export async function deactivateDiscussionFilesBySection(
  discussionSectionId: number,
) {
  const { error } = await supabase
    .from("discussion_file_uploads")
    .update({
      isActive: false,
      is_deleted: true,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq("discussionSectionId", discussionSectionId)
    .eq("isActive", true);

  if (error) {
    console.error("deactivateDiscussionFilesBySection error:", error);
    return { success: false };
  }

  return { success: true };
}

export type StudentDiscussionUploadRow = {
  studentDiscussionUploadId: number;
  studentId: number;
  discussionId: number;
  discussionSectionId: number;
  fileUrl: string;
  submittedAt: string | null;
  isActive: boolean;
  is_deleted: boolean | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  marksObtained: number | null; // 🟢 Added marksObtained
};

export async function fetchDiscussionUploads(
  discussionId: number,
  discussionSectionId?: number,
) {
  let query = supabase
    .from("student_discussion_uploads")
    .select(
      `
      studentDiscussionUploadId,
      studentId,
      fileUrl,
      submittedAt,
      marksObtained,
      students:studentId (
        user:userId (
          fullName,
          profile:user_profile (
            profileUrl
          )
        ),
        student_academic_history (
          isCurrent,
          college_sections (
            collegeSections
          )
        )
      ),
      discussion_forum_sections!inner (
          marks
      )
    `,
    )
    .eq("discussionId", discussionId)
    .eq("isActive", true)
    .eq("is_deleted", false);

  if (discussionSectionId !== undefined) {
    query = query.eq("discussionSectionId", discussionSectionId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // 🟢 GROUP UPLOADS BY STUDENT ID
  const studentMap = new Map<number, any>();

  (data ?? []).forEach((row: any) => {
    const currentHistory = row.students?.student_academic_history?.find(
      (h: any) => h.isCurrent === true,
    );

    if (!studentMap.has(row.studentId)) {
      // First time seeing this student, create their base record
      studentMap.set(row.studentId, {
        studentId: row.studentId,
        // We use the array to hold all file URLs for this student
        files: [{ id: row.studentDiscussionUploadId, url: row.fileUrl }],
        submittedAt: row.submittedAt,
        marksObtained: row.marksObtained,
        totalMarks: row.discussion_forum_sections?.marks ?? 0,
        profiles: {
          full_name: row.students?.user?.fullName ?? "Unknown Student",
          avatar_url: row.students?.user?.profile?.[0]?.profileUrl ?? null,
          section: currentHistory?.college_sections?.collegeSections ?? "N/A",
        },
      });
    } else {
      // Student already exists, just push the new file to their array
      const existing = studentMap.get(row.studentId);
      existing.files.push({
        id: row.studentDiscussionUploadId,
        url: row.fileUrl,
      });
      // Ensure we keep the most recent submission time if there are multiple
      if (new Date(row.submittedAt) > new Date(existing.submittedAt)) {
        existing.submittedAt = row.submittedAt;
      }
    }
  });

  return Array.from(studentMap.values());
}

// 🟢 NEW: Update Marks for a Student's Discussion
export async function updateStudentDiscussionMarks(
  studentId: number,
  discussionId: number,
  marksObtained: number,
) {
  const { error } = await supabase
    .from("student_discussion_uploads")
    .update({ marksObtained, updatedAt: new Date().toISOString() })
    .eq("studentId", studentId)
    .eq("discussionId", discussionId)
    .eq("isActive", true)
    .eq("is_deleted", false);

  if (error) {
    console.error("updateStudentDiscussionMarks error:", error);
    return { success: false, error };
  }

  return { success: true };
}

// ... (keep the rest of your student_discussion_uploadsAPI.ts functions exactly the same) ...
