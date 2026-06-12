import { supabase } from "@/lib/supabaseClient";

export type ProjectMentorRow = {
    projectMentorId: number;
    projectId: number;
    facultyId: number;
    createdAt: string;
    updatedAt: string;
};


export async function fetchProjectMentors(projectId: number) {
    const { data, error } = await supabase
        .from("project_mentors")
        .select(`
      projectMentorId,
      projectId,
      facultyId,
      createdAt,
      updatedAt
    `)
        .eq("projectId", projectId)
        .order("createdAt", { ascending: true });

    if (error) {
        console.error("fetchProjectMentors error:", error);
        throw error;
    }

    return data ?? [];
}


export async function fetchProjectsByMentorId(facultyId: number) {
    const { data, error } = await supabase
        .from("project_mentors")
        .select(`
      projectMentorId,
      projectId,
      facultyId,
      createdAt,
      updatedAt
    `)
        .eq("facultyId", facultyId)
        .order("createdAt", { ascending: false });

    if (error) {
        console.error("fetchProjectsByMentorId error:", error);
        throw error;
    }

    return data ?? [];
}


export async function fetchExistingProjectMentor(
    projectId: number,
    facultyId: number,
) {
    const { data, error } = await supabase
        .from("project_mentors")
        .select("projectMentorId")
        .eq("projectId", projectId)
        .eq("facultyId", facultyId)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return { success: true, data: null };
        }
        throw error;
    }

    return { success: true, data };
}


export async function addMentorToProject(
    projectId: number,
    facultyId: number,
) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("project_mentors")
        .insert([
            {
                projectId,
                facultyId,
                createdAt: now,
                updatedAt: now,
            },
        ])
        .select("projectMentorId")
        .single();

    if (error) {
        if (error.code === "23505") {
            return { success: false, reason: "ALREADY_EXISTS" };
        }

        console.error("addMentorToProject error:", error);
        return { success: false, error };
    }

    return {
        success: true,
        projectMentorId: data.projectMentorId,
    };
}


export async function addMentorsToProject(
    projectId: number,
    facultyIds: number[],
) {
    if (!facultyIds.length) return { success: true };

    const now = new Date().toISOString();

    const payload = facultyIds.map((facultyId) => ({
        projectId,
        facultyId,
        createdAt: now,
        updatedAt: now,
    }));

    const { error } = await supabase
        .from("project_mentors")
        .upsert(payload, {
            onConflict: "projectId,facultyId",
        });

    if (error) {
        console.error("addMentorsToProject error:", error);
        return { success: false, error };
    }

    return { success: true };
}


export async function removeMentorFromProject(
    projectId: number,
    facultyId: number,
) {
    const { error } = await supabase
        .from("project_mentors")
        .delete()
        .eq("projectId", projectId)
        .eq("facultyId", facultyId);

    if (error) {
        console.error("removeMentorFromProject error:", error);
        return { success: false };
    }

    return { success: true };
}


export async function clearProjectMentors(projectId: number) {
    const { error } = await supabase
        .from("project_mentors")
        .delete()
        .eq("projectId", projectId);

    if (error) {
        console.error("clearProjectMentors error:", error);
        return { success: false };
    }

    return { success: true };
}