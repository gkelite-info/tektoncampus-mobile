import { supabase } from "@/lib/supabaseClient";

export type StudentProjectSubmissionRow = {
    studentProjectSubmissionId: number;
    projectId: number | null;
    studentId: number;
    fileUrl: string;
    createdAt: string;
    updatedAt: string;
};


export async function fetchProjectSubmissions(projectId: number) {
    const { data, error } = await supabase
        .from("student_project_submissions")
        .select(`
      studentProjectSubmissionId,
      projectId,
      studentId,
      fileUrl,
      createdAt,
      updatedAt
    `)
        .eq("projectId", projectId)
        .order("updatedAt", { ascending: false });

    if (error) {
        console.error("fetchProjectSubmissions error:", error);
        throw error;
    }

    return data ?? [];
}

export async function fetchStudentSubmission(
    projectId: number,
    studentId: number
) {
    const { data, error } = await supabase
        .from("student_project_submissions")
        .select(`
      studentProjectSubmissionId,
      fileUrl,
      createdAt,
      updatedAt
    `)
        .eq("projectId", projectId)
        .eq("studentId", studentId)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return { success: true, data: null };
        }
        throw error;
    }

    return { success: true, data };
}

export async function submitProject(
    payload: {
        projectId?: number;
        studentId: number;
        fileUrl: string;
    }
) {
    const now = new Date().toISOString();

    const upsertPayload = {
        projectId: payload.projectId,
        studentId: payload.studentId,
        fileUrl: payload.fileUrl,
        updatedAt: now,
        createdAt: now,
    };

    const { data, error } = await supabase
        .from("student_project_submissions")
        .upsert([upsertPayload], {
            onConflict: "projectId,studentId",
        })
        .select("studentProjectSubmissionId")
        .single();

    if (error) {
        console.error("submitProject error:", error);
        return { success: false, error };
    }

    return {
        success: true,
        studentProjectSubmissionId: data.studentProjectSubmissionId,
    };
}

export async function deleteSubmission(
    studentProjectSubmissionId: number
) {
    const { error } = await supabase
        .from("student_project_submissions")
        .delete()
        .eq("studentProjectSubmissionId", studentProjectSubmissionId);

    if (error) {
        console.error("deleteSubmission error:", error);
        return { success: false };
    }

    return { success: true };
}

export async function fetchProjectSubmissionsWithStudents(projectId: number) {
    const { data, error } = await supabase
        .from("student_project_submissions")
        .select(`
            studentProjectSubmissionId,
            fileUrl,
            updatedAt,
            students (
                studentId,
                userId,
                student_pins (
                    pinNumber
                ),
                users (
                    fullName,
                    email,
                    user_profile (
                        profileUrl,
                        is_deleted
                    )
                )
            )
        `)
        .eq("projectId", projectId);

    if (error) {
        console.error("fetchProjectSubmissionsWithStudents error:", error);
        throw error;
    }

    return data ?? [];
}

export async function uploadFileToStorage(file: File, projectId: number, studentId: number) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}_${Date.now()}.${fileExt}`;
    const filePath = `project_${projectId}/${fileName}`;

    const { data, error } = await supabase.storage
        .from('project_submissions')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (error) {
        console.error("Storage upload error:", error);
        return { success: false, error };
    }

    const { data: urlData } = supabase.storage
        .from('project_submissions')
        .getPublicUrl(filePath);

    return { success: true, url: urlData.publicUrl };
}
