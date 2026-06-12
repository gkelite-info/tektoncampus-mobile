import { supabase } from "@/lib/supabaseClient";

export type ProjectFileRow = {
    projectFileId: number;
    projectId: number;
    fileUrl: string;
    createdAt: string;
    updatedAt: string;
};


export async function fetchProjectFiles(projectId: number) {
    const { data, error } = await supabase
        .from("project_files")
        .select(`
      projectFileId,
      projectId,
      fileUrl,
      createdAt,
      updatedAt
    `)
        .eq("projectId", projectId)
        .order("createdAt", { ascending: true });

    if (error) {
        console.error("fetchProjectFiles error:", error);
        throw error;
    }

    return data ?? [];
}


export async function fetchExistingProjectFile(
    projectId: number,
    fileUrl: string,
) {
    const { data, error } = await supabase
        .from("project_files")
        .select("projectFileId")
        .eq("projectId", projectId)
        .eq("fileUrl", fileUrl.trim())
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return { success: true, data: null };
        }
        throw error;
    }

    return { success: true, data };
}


export async function addProjectFile(
    projectId: number,
    fileUrl: string,
) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("project_files")
        .insert([
            {
                projectId,
                fileUrl: fileUrl.trim(),
                createdAt: now,
                updatedAt: now,
            },
        ])
        .select("projectFileId")
        .single();

    if (error) {
        if (error.code === "23505") {
            return { success: false, reason: "ALREADY_EXISTS" };
        }

        console.error("addProjectFile error:", error);
        return { success: false, error };
    }

    return {
        success: true,
        projectFileId: data.projectFileId,
    };
}


export async function addProjectFiles(
    projectId: number,
    fileUrls: string[],
) {
    if (!fileUrls.length) return { success: true };

    const now = new Date().toISOString();

    const payload = fileUrls.map((fileUrl) => ({
        projectId,
        fileUrl: fileUrl.trim(),
        createdAt: now,
        updatedAt: now,
    }));

    const { error } = await supabase
        .from("project_files")
        .upsert(payload, {
            onConflict: "projectId,fileUrl",
        });

    if (error) {
        console.error("addProjectFiles error:", error);
        return { success: false, error };
    }

    return { success: true };
}


export async function removeProjectFile(projectFileId: number) {
    const { error } = await supabase
        .from("project_files")
        .delete()
        .eq("projectFileId", projectFileId);

    if (error) {
        console.error("removeProjectFile error:", error);
        return { success: false };
    }

    return { success: true };
}


export async function removeProjectFileByUrl(
    projectId: number,
    fileUrl: string,
) {
    const { error } = await supabase
        .from("project_files")
        .delete()
        .eq("projectId", projectId)
        .eq("fileUrl", fileUrl.trim());

    if (error) {
        console.error("removeProjectFileByUrl error:", error);
        return { success: false };
    }

    return { success: true };
}


export async function clearProjectFiles(projectId: number) {
    const { error } = await supabase
        .from("project_files")
        .delete()
        .eq("projectId", projectId);

    if (error) {
        console.error("clearProjectFiles error:", error);
        return { success: false };
    }

    return { success: true };
}

export async function uploadProjectFile(
    projectId: number,
    file: { uri: string; name: string; type?: string },
): Promise<{ success: true; publicUrl: string } | { success: false; error: any }> {
    const sanitizedName = file.name.replace(/\s+/g, "_");
    const filePath = `${projectId}/${sanitizedName}`;

    try {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const { error: uploadError } = await supabase.storage
            .from("project-files")
            .upload(filePath, arrayBuffer, {
                upsert: true,
                contentType: file.type || "application/octet-stream",
            });

        if (uploadError) {
            console.error("uploadProjectFile error:", uploadError);
            return { success: false, error: uploadError };
        }

        const { data } = supabase.storage
            .from("project-files")
            .getPublicUrl(filePath);

        return { success: true, publicUrl: data.publicUrl };
    } catch (e) {
        console.error("uploadProjectFile fetch/upload error:", e);
        return { success: false, error: e };
    }
}