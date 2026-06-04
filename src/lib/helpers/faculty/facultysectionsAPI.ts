import { supabase } from "@/lib/supabaseClient";

export type FacultySectionRow = {
    facultySectionId: number;
    facultyId: number;
    collegeSectionsId: number;
    collegeSubjectId: number;
    collegeAcademicYearId: number;
    createdBy: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    college_sections: {
        collegeSectionsId: number;
        collegeSections: string;
    } | null;
};

export async function fetchFacultySections(facultyId: number, subjectId?: number) {
    let query = supabase
        .from("faculty_sections")
        .select(`
      facultySectionId,
      facultyId,
      collegeSectionsId,
      collegeSubjectId,
      collegeAcademicYearId,
      createdBy,
      isActive,
      createdAt,
      updatedAt,
      deletedAt,
    college_sections (
        collegeSectionsId,
        collegeSections
)
    `)
        .eq("facultyId", facultyId)
        .eq("isActive", true)
        .is("deletedAt", null);

    if (subjectId) {
        query = query.eq("collegeSubjectId", subjectId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("fetchFacultySections error:", error);
        throw error;
    }

    return (data ?? []) as unknown as FacultySectionRow[];
}

export async function fetchExistingFacultySection(
    facultyId: number,
    collegeSectionsId: number,
    collegeSubjectId: number,
    collegeAcademicYearId: number,
    createdBy: number
) {
    const { data, error } = await supabase
        .from("faculty_sections")
        .select("facultySectionId")
        .eq("facultyId", facultyId)
        .eq("collegeSectionsId", collegeSectionsId)
        .eq("collegeSubjectId", collegeSubjectId)
        .eq("collegeAcademicYearId", collegeAcademicYearId)
        .eq("createdBy", createdBy)
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

export async function saveFacultySection(
    payload: {
        facultySectionId?: number;
        facultyId: number;
        collegeSectionsId: number;
        collegeSubjectId: number;
        collegeAcademicYearId: number;
    },
    createdBy: number
) {
    const now = new Date().toISOString();

    const upsertPayload: any = {
        facultyId: payload.facultyId,
        collegeSectionsId: payload.collegeSectionsId,
        collegeSubjectId: payload.collegeSubjectId,
        collegeAcademicYearId: payload.collegeAcademicYearId,
        updatedAt: now,
    };

    if (!payload.facultySectionId) {
        upsertPayload.createdBy = createdBy;
        upsertPayload.createdAt = now;

        const { data, error } = await supabase
            .from("faculty_sections")
            .insert([upsertPayload])
            .select("facultySectionId")
            .single();

        if (error) {
            console.error("saveFacultySection error:", error);
            return { success: false, error };
        }

        return {
            success: true,
            facultySectionId: data.facultySectionId,
        };
    }

    const { error } = await supabase
        .from("faculty_sections")
        .update(upsertPayload)
        .eq("facultySectionId", payload.facultySectionId);

    if (error) {
        console.error("saveFacultySection error:", error);
        return { success: false, error };
    }

    return {
        success: true,
        facultySectionId: payload.facultySectionId,
    };
}

export async function deactivateFacultySection(facultySectionId: number) {
    const { error } = await supabase
        .from("faculty_sections")
        .update({
            isActive: false,
            deletedAt: new Date().toISOString(),
        })
        .eq("facultySectionId", facultySectionId);

    if (error) {
        console.error("deactivateFacultySection error:", error);
        return { success: false };
    }

    return { success: true };
}

export async function fetchFacultySectionsByFilters(
    collegeSectionsId: number,
    collegeSubjectId: number
) {
    const { data, error } = await supabase
        .from("faculty_sections")
        .select("*")
        .eq("collegeSectionsId", collegeSectionsId)
        .eq("collegeSubjectId", collegeSubjectId)
        .eq("isActive", true)
        .is("deletedAt", null);

    if (error) {
        console.error("fetchFacultySectionsByFilters error:", error);
        throw error;
    }

    return data ?? [];
}