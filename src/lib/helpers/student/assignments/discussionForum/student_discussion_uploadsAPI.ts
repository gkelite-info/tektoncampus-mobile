import { supabase } from "@/lib/supabaseClient";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";

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
};

// export async function fetchDiscussionUploads(
//   discussionId: number,
//   discussionSectionId?: number,
// ) {
//   let query = supabase
//     .from("student_discussion_uploads")
//     .select(
//       `
//       studentDiscussionUploadId,
//       studentId,
//       fileUrl,
//       submittedAt,
//       students:studentId (
//         user:userId (
//           fullName,
//           profile:user_profile (
//             profileUrl
//           )
//         ),
//         student_academic_history (
//           isCurrent,
//           college_sections (
//             collegeSections
//           )
//         )
//       )
//     `,
//     )
//     .eq("discussionId", discussionId)
//     .eq("isActive", true)
//     .eq("is_deleted", false);

//   if (discussionSectionId !== undefined) {
//     query = query.eq("discussionSectionId", discussionSectionId);
//   }

//   const { data, error } = await query;

//   if (error) {
//     throw error;
//   }

//   return (data ?? []).map((row: any) => {
//     const currentHistory = row.students?.student_academic_history?.find(
//       (h: any) => h.isCurrent === true,
//     );

//     return {
//       studentDiscussionUploadId: row.studentDiscussionUploadId,
//       studentId: row.studentId,
//       fileUrl: row.fileUrl,
//       submittedAt: row.submittedAt,
//       marksObtained: null,
//       profiles: {
//         full_name: row.students?.user?.fullName ?? "Unknown Student",
//         avatar_url: row.students?.user?.profile?.[0]?.profileUrl ?? null,
//         section: currentHistory?.college_sections?.collegeSections ?? "N/A",
//       },
//     };
//   });
// }

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
        student_pins (
          pinNumber
        ),
        user:userId (
          fullName,
          profile:user_profile (
            profileUrl,
            is_deleted
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

    return (data ?? []).map((row: any) => {
        const currentHistory = row.students?.student_academic_history?.find(
            (h: any) => h.isCurrent === true,
        );
        const pinData = row.students?.student_pins;
        const pinNumber = Array.isArray(pinData)
            ? pinData[0]?.pinNumber
            : pinData?.pinNumber;
        const profileData = row.students?.user?.profile;
        const profiles = Array.isArray(profileData) ? profileData : [profileData];
        const activeProfile = profiles.find(
            (profile: any) => profile && !profile.is_deleted,
        );

        return {
            studentDiscussionUploadId: row.studentDiscussionUploadId,
            studentId: row.studentId,
            fileUrl: row.fileUrl,
            submittedAt: row.submittedAt,
            marksObtained: row.marksObtained,
            totalMarks: row.discussion_forum_sections?.marks ?? 25,
            profiles: {
                full_name: row.students?.user?.fullName ?? "Unknown Student",
                rollNumber: pinNumber || "N/A",
                avatar_url: activeProfile?.profileUrl ?? null,
                section: currentHistory?.college_sections?.collegeSections ?? "N/A",
            },
        };
    });
}

export async function fetchStudentDiscussionUploads(
    studentId: number,
    discussionId: number,
) {
    const { data, error } = await supabase
        .from("student_discussion_uploads")
        .select(
            `
      studentDiscussionUploadId,
      discussionSectionId,
      fileUrl,
      submittedAt,
      createdAt
    `,
        )
        .eq("studentId", studentId)
        .eq("discussionId", discussionId)
        .eq("is_deleted", false)
        .order("createdAt", { ascending: true });

    if (error) {
        console.error("fetchStudentDiscussionUploads error:", error);
        throw error;
    }

    return data ?? [];
}

export async function fetchExistingStudentUpload(
    studentId: number,
    discussionId: number,
    discussionSectionId: number,
) {
    const { data, error } = await supabase
        .from("student_discussion_uploads")
        .select("studentDiscussionUploadId")
        .eq("studentId", studentId)
        .eq("discussionId", discussionId)
        .eq("discussionSectionId", discussionSectionId)
        .eq("is_deleted", false)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return { success: true, data: null };
        }
        throw error;
    }

    return { success: true, data };
}

export async function saveStudentDiscussionUpload(payload: {
    studentDiscussionUploadId?: number;
    studentId: number;
    discussionId: number;
    discussionSectionId: number;
    fileUrl: string;
    submittedAt?: string | null;
}) {
    const now = new Date().toISOString();

    const upsertPayload: any = {
        studentId: payload.studentId,
        discussionId: payload.discussionId,
        discussionSectionId: payload.discussionSectionId,
        fileUrl: payload.fileUrl,
        submittedAt: payload.submittedAt ?? now,
        updatedAt: now,
    };

    if (!payload.studentDiscussionUploadId) {
        upsertPayload.createdAt = now;

        const { data, error } = await supabase
            .from("student_discussion_uploads")
            .insert([upsertPayload])
            .select("studentDiscussionUploadId")
            .single();

        if (error) {
            console.error("saveStudentDiscussionUpload error:", error);
            return { success: false, error };
        }

        return {
            success: true,
            studentDiscussionUploadId: data.studentDiscussionUploadId,
        };
    }

    const { error } = await supabase
        .from("student_discussion_uploads")
        .update(upsertPayload)
        .eq("studentDiscussionUploadId", payload.studentDiscussionUploadId);

    if (error) {
        console.error("saveStudentDiscussionUpload error:", error);
        return { success: false, error };
    }

    return {
        success: true,
        studentDiscussionUploadId: payload.studentDiscussionUploadId,
    };
}

export async function deactivateStudentDiscussionUpload(
    studentDiscussionUploadId: number,
) {
    const { error } = await supabase
        .from("student_discussion_uploads")
        .update({
            isActive: false,
            is_deleted: true,
            deletedAt: new Date().toISOString(),
        })
        .eq("studentDiscussionUploadId", studentDiscussionUploadId);

    if (error) {
        console.error("deactivateStudentDiscussionUpload error:", error);
        return { success: false };
    }

    return { success: true };
}

export async function uploadStudentDiscussionFiles(
    discussionId: number,
    studentId: number,
    files: any[],
): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const file of files) {
        const fileName = `${discussionId}/${studentId}/${Date.now()}_${file.name}`;

        try {
            const base64 = await FileSystem.readAsStringAsync(file.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const arrayBuffer = decode(base64);

            const { error } = await supabase.storage
                .from("student-discussion-files")
                .upload(fileName, arrayBuffer, {
                    contentType: file.mimeType || "application/octet-stream",
                    cacheControl: "3600",
                    upsert: false,
                });

            if (error) {
                console.error("uploadStudentDiscussionFiles upload error:", error);
                throw error;
            }

            const { data: publicUrl } = supabase.storage
                .from("student-discussion-files")
                .getPublicUrl(fileName);

            uploadedUrls.push(publicUrl.publicUrl);
        } catch (err) {
            console.error("uploadStudentDiscussionFiles error:", err);
            throw new Error(`Failed to upload ${file.name}`);
        }
    }

    return uploadedUrls;
}

export async function deleteStudentDiscussionFileFromStorage(fileUrl: string) {
    const urlParts = fileUrl.split("/student-discussion-files/");

    if (urlParts.length < 2) return { success: false };

    const filePath = decodeURIComponent(urlParts[1]);

    const { error } = await supabase.storage
        .from("student-discussion-files")
        .remove([filePath]);

    if (error) {
        console.error("deleteStudentDiscussionFileFromStorage error:", error);
        return { success: false };
    }

    return { success: true };
}

export async function fetchFacultyDiscussionSubmissions(
    discussionId: number,
    page: number = 1,
    limit: number = 10,
) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
        .from("student_discussion_uploads")
        .select(
            `
            studentDiscussionUploadId,
            studentId,
            fileUrl,
            submittedAt,
            marksObtained,
            students!inner (
                student_pins(pinNumber),
                users!inner (
                    fullName,
                    collegePublicId,
                    user_profile (
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
            { count: "exact" },
        )
        .eq("discussionId", discussionId)
        .eq("isActive", true)
        .eq("is_deleted", false)
        .order("studentId", { ascending: true }) // Group student's files together
        .order("submittedAt", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("fetchFacultyDiscussionSubmissions error:", error);
        throw error;
    }

    // 🟢 Group the files by Student ID so each student gets exactly 1 row per page
    const studentMap = new Map<number, any>();

    (data ?? []).forEach((row: any) => {
        const studentData = row.students;
        const currentHistory = studentData?.student_academic_history?.find(
            (h: any) => h.isCurrent === true,
        );

        const pinNumber = Array.isArray(studentData?.student_pins)
            ? studentData?.student_pins[0]?.pinNumber
            : studentData?.student_pins?.pinNumber;

        if (!studentMap.has(row.studentId)) {
            studentMap.set(row.studentId, {
                studentId: row.studentId,
                discussionId: discussionId,
                files: [{ id: row.studentDiscussionUploadId, url: row.fileUrl }],
                submittedAt: row.submittedAt,
                marksObtained: row.marksObtained,
                totalMarks: row.discussion_forum_sections?.marks ?? 0,
                profiles: {
                    full_name: studentData?.users?.fullName ?? "Unknown Student",
                    rollNumber: pinNumber || "N/A",
                    avatar_url: studentData?.users?.user_profile?.[0]?.profileUrl ?? null,
                    section: currentHistory?.college_sections?.collegeSections ?? "N/A",
                },
            });
        } else {
            const existing = studentMap.get(row.studentId);
            existing.files.push({
                id: row.studentDiscussionUploadId,
                url: row.fileUrl,
            });

            if (new Date(row.submittedAt) > new Date(existing.submittedAt)) {
                existing.submittedAt = row.submittedAt;
            }
        }
    });

    return {
        data: Array.from(studentMap.values()),
        totalCount: count ?? 0,
    };
}

export async function fetchStudentDiscussionMarks(
    discussionId: number,
    studentId: number,
) {
    const { data, error } = await supabase
        .from("student_discussion_uploads")
        .select(
            `
        marksObtained,
        discussion_forum_sections (
          marks
        )
      `,
        )
        .eq("discussionId", discussionId)
        .eq("studentId", studentId)
        .eq("isActive", true)
        .eq("is_deleted", false)
        .order("submittedAt", { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== "PGRST116") {
        console.error("fetchStudentDiscussionMarks error:", error);
        throw error;
    }

    return {
        marksObtained: data?.marksObtained ?? null,
        totalMarks:
            data?.discussion_forum_sections?.[0]?.marks ?? null,
    };
}

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
