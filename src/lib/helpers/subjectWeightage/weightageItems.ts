import { supabase } from "@/lib/supabaseClient";


export type FacultyWeightageItemRow = {
    facultyWeightageItemId: number;
    facultyWeightageConfigId: number;
    label: string;
    percentage: number;
    isCustom: boolean;
    createdAt: string;
    updatedAt: string;
};


export async function fetchFacultyWeightageItems(
    facultyWeightageConfigId: number,
) {
    const { data, error } = await supabase
        .from("faculty_weightage_items")
        .select(`
      facultyWeightageItemId,
      facultyWeightageConfigId,
      label,
      percentage,
      isCustom,
      createdAt,
      updatedAt
    `)
        .eq("facultyWeightageConfigId", facultyWeightageConfigId)
        .order("createdAt", { ascending: true });

    if (error) {
        console.error("fetchFacultyWeightageItems error:", error);
        throw error;
    }

    return (data ?? []) as FacultyWeightageItemRow[];
}


export async function fetchExistingFacultyWeightageItem(
    facultyWeightageConfigId: number,
    label: string,
) {
    const { data, error } = await supabase
        .from("faculty_weightage_items")
        .select("facultyWeightageItemId")
        .eq("facultyWeightageConfigId", facultyWeightageConfigId)
        .eq("label", label.trim())
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return { success: true, data: null };
        }
        throw error;
    }

    return { success: true, data };
}


export async function saveFacultyWeightageItem(payload: {
    facultyWeightageItemId?: number;
    facultyWeightageConfigId: number;
    label: string;
    percentage: number;
    isCustom?: boolean;
}) {
    const now = new Date().toISOString();

    if (!payload.facultyWeightageItemId) {
        const { data, error } = await supabase
            .from("faculty_weightage_items")
            .insert([{
                facultyWeightageConfigId: payload.facultyWeightageConfigId,
                label: payload.label.trim(),
                percentage: payload.percentage,
                isCustom: payload.isCustom ?? false,
                createdAt: now,
                updatedAt: now,
            }])
            .select("facultyWeightageItemId")
            .single();

        if (error) {
            console.error("saveFacultyWeightageItem (insert) error:", error);
            return { success: false, error };
        }

        return {
            success: true,
            facultyWeightageItemId: data.facultyWeightageItemId,
        };
    }

    const { error } = await supabase
        .from("faculty_weightage_items")
        .update({
            label: payload.label.trim(),
            percentage: payload.percentage,
            isCustom: payload.isCustom ?? false,
            updatedAt: now,
        })
        .eq("facultyWeightageItemId", payload.facultyWeightageItemId);

    if (error) {
        console.error("saveFacultyWeightageItem (update) error:", error);
        return { success: false, error };
    }

    return {
        success: true,
        facultyWeightageItemId: payload.facultyWeightageItemId,
    };
}


export async function deleteFacultyWeightageItem(
    facultyWeightageItemId: number,
) {
    const { error } = await supabase
        .from("faculty_weightage_items")
        .delete()
        .eq("facultyWeightageItemId", facultyWeightageItemId);

    if (error) {
        console.error("deleteFacultyWeightageItem error:", error);
        return { success: false };
    }

    return { success: true };
}