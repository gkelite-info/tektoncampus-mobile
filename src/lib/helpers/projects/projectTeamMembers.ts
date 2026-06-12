import { supabase } from "@/lib/supabaseClient";

export type ProjectTeamMemberRow = {
    projectTeamMemberId: number;
    projectId: number;
    studentId: number;
    createdAt: string;
    updatedAt: string;
};


export async function fetchProjectTeamMembers(projectId: number) {
    const { data, error } = await supabase
        .from("project_team_members")
        .select(`
      projectTeamMemberId,
      projectId,
      studentId,
      createdAt,
      updatedAt
    `)
        .eq("projectId", projectId)
        .order("createdAt", { ascending: true });

    if (error) {
        console.error("fetchProjectTeamMembers error:", error);
        throw error;
    }

    return data ?? [];
}


export async function fetchProjectsByStudentId(studentId: number) {
    const { data, error } = await supabase
        .from("project_team_members")
        .select(`
      projectTeamMemberId,
      projectId,
      studentId,
      createdAt,
      updatedAt
    `)
        .eq("studentId", studentId)
        .order("createdAt", { ascending: false });

    if (error) {
        console.error("fetchProjectsByStudentId error:", error);
        throw error;
    }

    return data ?? [];
}


export async function fetchExistingProjectTeamMember(
    projectId: number,
    studentId: number,
) {
    const { data, error } = await supabase
        .from("project_team_members")
        .select("projectTeamMemberId")
        .eq("projectId", projectId)
        .eq("studentId", studentId)
        .single();

    if (error) {
        // no row found
        if (error.code === "PGRST116") {
            return { success: true, data: null };
        }
        throw error;
    }

    return { success: true, data };
}


export async function addStudentToProject(
    projectId: number,
    studentId: number,
) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("project_team_members")
        .insert([
            {
                projectId,
                studentId,
                createdAt: now,
                updatedAt: now,
            },
        ])
        .select("projectTeamMemberId")
        .single();

    if (error) {
        if (error.code === "23505") {
            return { success: false, reason: "ALREADY_EXISTS" };
        }

        console.error("addStudentToProject error:", error);
        return { success: false, error };
    }

    return {
        success: true,
        projectTeamMemberId: data.projectTeamMemberId,
    };
}


export async function addStudentsToProject(
    projectId: number,
    studentIds: number[],
) {
    if (!studentIds.length) return { success: true };

    const now = new Date().toISOString();

    const payload = studentIds.map((studentId) => ({
        projectId,
        studentId,
        createdAt: now,
        updatedAt: now,
    }));

    const { error } = await supabase
        .from("project_team_members")
        .upsert(payload, {
            onConflict: "projectId,studentId",
        });

    if (error) {
        console.error("addStudentsToProject error:", error);
        return { success: false, error };
    }

    return { success: true };
}


export async function removeStudentFromProject(
    projectId: number,
    studentId: number,
) {
    const { error } = await supabase
        .from("project_team_members")
        .delete()
        .eq("projectId", projectId)
        .eq("studentId", studentId);

    if (error) {
        console.error("removeStudentFromProject error:", error);
        return { success: false };
    }

    return { success: true };
}


export async function clearProjectTeam(projectId: number) {
    const { error } = await supabase
        .from("project_team_members")
        .delete()
        .eq("projectId", projectId);

    if (error) {
        console.error("clearProjectTeam error:", error);
        return { success: false };
    }

    return { success: true };
}