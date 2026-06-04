import { supabase } from "@/lib/supabaseClient";

export type LabManualRow = {
    labManualId: number;
    labTitle: string;
    description: string | null;
    pdfUrl: string;
    facultyId: number;
    adminId: number | null;
    collegeSubjectId: number;
    collegeAcademicYearId: number;
    collegeSectionsId: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

function getIndianTimestamp() {
    return new Date()
        .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
        .replace(" ", "T");
}

export async function fetchLabManualsForStudent(
    params: {
        collegeId: number;
        collegeEducationId: number;
        collegeBranchId: number;
        collegeAcademicYearId: number;
        collegeSectionsId: number;
    },
    page = 1,
    pageSize = 8,
) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
        .from("faculty_lab_manuals")
        .select(`
      *,
      college_subjects!inner (
        subjectName,
        subjectCode,
        collegeId,
        collegeEducationId,
        collegeBranchId,
        collegeAcademicYearId
      ),
      college_sections (collegeSections)
    `, { count: "exact" })
        .eq("collegeSectionsId", params.collegeSectionsId)
        .eq("collegeAcademicYearId", params.collegeAcademicYearId)
        .eq("college_subjects.collegeId", params.collegeId)
        .eq("college_subjects.collegeEducationId", params.collegeEducationId)
        .eq("college_subjects.collegeBranchId", params.collegeBranchId)
        .eq("college_subjects.collegeAcademicYearId", params.collegeAcademicYearId)
        .eq("isActive", true)
        .is("deletedAt", null)
        .order("createdAt", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("fetchLabManualsForStudent error:", error);
        return { data: [], totalCount: 0 };
    }

    if (!data) return { data: [], totalCount: 0 };

    const BUCKET = "faculty_lab_manuals";

    const withSizes = await Promise.all(
        data.map(async (lab) => {
            let fileSize = 0;

            try {
                const parts = lab.pdfUrl.split("/");
                const fileName = parts.pop();
                const folderPath = parts.join("/");

                const { data: files, error } = await supabase.storage
                    .from(BUCKET)
                    .list(folderPath);

                if (!error && files) {
                    const match = files.find((f) => f.name === fileName);
                    fileSize = match?.metadata?.size ?? 0;
                }
            } catch (e) {
                console.error("student lab fileSize fetch failed:", e);
            }

            return { ...lab, fileSize };
        })
    );

    return {
        data: withSizes,
        totalCount: count ?? 0,
    };
}


export async function fetchLabManualsForStaff(params: {
    facultyId?: number;
    adminId?: number;
    collegeId?: number;
    collegeEducationId?: number;
    collegeBranchId?: number;
    collegeAcademicYearId?: number;
    collegeSubjectId?: number;
    page?: number;
    pageSize?: number;
}) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from("faculty_lab_manuals")
        .select(`*, college_subjects!inner(subjectName, collegeId, collegeEducationId, collegeBranchId, collegeAcademicYearId), college_sections(collegeSections)`, { count: "exact" })
        .is("deletedAt", null);

    if (params.adminId) {
        query = query.eq("adminId", params.adminId);
    } else if (params.facultyId) {
        query = query.eq("facultyId", params.facultyId);
    }

    if (params.collegeId) {
        query = query.eq("college_subjects.collegeId", params.collegeId);
    }

    if (params.collegeEducationId) {
        query = query.eq("college_subjects.collegeEducationId", params.collegeEducationId);
    }

    if (params.collegeBranchId) {
        query = query.eq("college_subjects.collegeBranchId", params.collegeBranchId);
    }

    if (params.collegeAcademicYearId) {
        query = query.eq("collegeAcademicYearId", params.collegeAcademicYearId);
        query = query.eq("college_subjects.collegeAcademicYearId", params.collegeAcademicYearId);
    }

    if (params.collegeSubjectId) {
        query = query.eq("collegeSubjectId", params.collegeSubjectId);
    }

    const { data: facultyLabManual, error: faculty_lab_manualsError, count } = await query
        .order("createdAt", { ascending: false })
        .range(from, to);

    if (faculty_lab_manualsError) {
        console.error("fetchLabManualsForStaff error:", faculty_lab_manualsError);
        throw faculty_lab_manualsError;
    }

    if (!facultyLabManual) return { data: [], totalCount: 0 };

    const BUCKET = "faculty_lab_manuals";

    const withSizes = await Promise.all(
        facultyLabManual.map(async (lab) => {
            let fileSize = 0;

            try {
                const parts = lab.pdfUrl.split("/");
                const fileName = parts.pop();
                const folderPath = parts.join("/");

                const { data: files, error } = await supabase.storage
                    .from(BUCKET)
                    .list(folderPath);

                if (!error && files) {
                    const match = files.find((f) => f.name === fileName);
                    fileSize = match?.metadata?.size ?? 0;
                }
            } catch (e) {
                console.error("fileSize fetch failed:", e);
            }

            return { ...lab, fileSize };
        })
    );

    return {
        data: withSizes,
        totalCount: count ?? 0,
    };
}

export async function fetchLabManualById(labManualId: number) {
    const { data, error } = await supabase
        .from("faculty_lab_manuals")
        .select(`*, college_subjects!inner(subjectName, collegeId, collegeEducationId, collegeBranchId, collegeAcademicYearId), college_sections(collegeSections)`)
        .eq("labManualId", labManualId)
        .is("deletedAt", null)
        .single();

    if (error) {
        console.error("fetchLabManualById error:", error);
        throw error;
    }

    return data;
}

export async function saveLabManual(
    payload: {
        labManualId?: number;
        labTitle: string;
        description?: string;
        pdfUrl: string;
        collegeSubjectId: number;
        collegeAcademicYearId: number;
        collegeSectionsId: number;
        facultyId?: number;
    },
    actingUser: { id: number; role: 'admin' | 'faculty' }
) {
    const now = getIndianTimestamp();

    const manualData: any = {
        labTitle: payload.labTitle.trim(),
        description: payload.description?.trim(),
        pdfUrl: payload.pdfUrl,
        collegeSubjectId: payload.collegeSubjectId,
        collegeAcademicYearId: payload.collegeAcademicYearId,
        collegeSectionsId: payload.collegeSectionsId,
        updatedAt: now,
    };

    if (payload.facultyId) {
        manualData.facultyId = payload.facultyId;
    }

    if (actingUser.role === 'admin') {
        manualData.adminId = actingUser.id;
    }

    if (payload.labManualId) {
        const { data, error } = await supabase
            .from("faculty_lab_manuals")
            .update(manualData)
            .eq("labManualId", payload.labManualId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } else {
        manualData.createdAt = now;
        const { data, error } = await supabase
            .from("faculty_lab_manuals")
            .insert([manualData])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    }
}


export async function deleteLabManual(labManualId: number) {
    const { error } = await supabase
        .from("faculty_lab_manuals")
        .update({
            isActive: false,
            deletedAt: getIndianTimestamp(),
        })
        .eq("labManualId", labManualId);

    if (error) {
        console.error("deleteLabManual error:", error);
        return { success: false, error };
    }
    return { success: true };
}


export async function getLabManualPublicUrl(path: string) {
    const { data, error } = await supabase.storage
        .from("faculty_lab_manuals")
        .createSignedUrl(path, 30);

    if (error) {
        console.error("Error generating signed URL:", error);
        return null;
    }
    return data.signedUrl;
}


export async function uploadLabManualFile(file: File, folderName: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folderName}/${fileName}`;

    const { data, error } = await supabase.storage
        .from('faculty_lab_manuals')
        .upload(filePath, file);

    if (error) throw error;
    return data.path;
}
