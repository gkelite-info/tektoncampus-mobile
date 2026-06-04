import { supabase } from "@/lib/supabaseClient";
 
type AcademicDropdownParams = {
    collegeId: number;
 
    educationId?: number;
    branchId?: number;
    academicYearId?: number;
    semester?: number;
 
    type:
    | "education"
    | "branch"
    | "academicYear"
    | "semester"
    | "subject"
    | "section";
};
 
type AcademicDropdownMap = {
    education: {
        collegeEducationId: number;
        collegeEducationType: string;
    };
    branch: {
        collegeBranchId: number;
        collegeBranchType: string;
        collegeBranchCode: string;
    };
    academicYear: {
        collegeAcademicYearId: number;
        collegeAcademicYear: string;
    };
    semester: {
        collegeSemesterId: number;
        collegeSemester: number;
    };
    subject: {
        collegeSubjectId: number;
        subjectName: string;
    };
    section: {
        collegeSectionsId: number;
        collegeSections: string;
    };
};
 
 
export function fetchAcademicDropdowns(params: {
    type: "education";
    collegeId: number;
}): Promise<AcademicDropdownMap["education"][]>;
 
export function fetchAcademicDropdowns(params: {
    type: "branch";
    collegeId: number;
    educationId: number;
}): Promise<AcademicDropdownMap["branch"][]>;
 
export function fetchAcademicDropdowns(params: {
    type: "academicYear";
    collegeId: number;
    educationId: number;
    branchId: number;
}): Promise<AcademicDropdownMap["academicYear"][]>;
 
export function fetchAcademicDropdowns(params: {
    type: "semester";
    collegeId: number;
    educationId: number;
    academicYearId: number;
    branchId?: number; // ✅ allow extra param
}): Promise<AcademicDropdownMap["semester"][]>;
 
export function fetchAcademicDropdowns(params: {
    type: "subject";
    collegeId: number;
    educationId: number;
    branchId: number;
    academicYearId: number;
    semester: number;
}): Promise<AcademicDropdownMap["subject"][]>;
 
export function fetchAcademicDropdowns(params: {
    type: "section";
    collegeId: number;
    educationId: number;
    branchId: number;
    academicYearId: number;
}): Promise<AcademicDropdownMap["section"][]>;
 
export async function fetchAcademicDropdowns(
    params: AcademicDropdownParams
) {
    const {
        type,
        collegeId,
        educationId,
        branchId,
        academicYearId,
        semester,
    } = params;
 
    switch (type) {
 
        case "education": {
            const { data, error } = await supabase
                .from("college_education")
                .select("collegeEducationId, collegeEducationType")
                .eq("collegeId", collegeId)
                .eq("isActive", true)
                .order("collegeEducationType");
 
            if (error) throw error;
            return data;
        }
 
 
        case "branch": {
            if (!educationId) return [];
 
            const { data, error } = await supabase
                .from("college_branch")
                .select("collegeBranchId, collegeBranchType, collegeBranchCode")
                .eq("collegeId", collegeId)
                .eq("collegeEducationId", educationId)
                .eq("isActive", true)
                .order("collegeBranchType");
 
            if (error) throw error;
            return data;
        }
 
 
 
        case "academicYear": {
            if (!educationId || !branchId) return [];
 
            const { data, error } = await supabase
                .from("college_academic_year")
                .select("collegeAcademicYearId, collegeAcademicYear")
                .eq("collegeId", collegeId)
                .eq("collegeEducationId", educationId)
                .eq("collegeBranchId", branchId)
                .order("collegeAcademicYear");
 
            if (error) throw error;
            return data;
        }
 
 
        case "semester": {
            if (!educationId || !academicYearId) return [];
            const { data, error } = await supabase
                .from("college_semester")
                .select("collegeSemesterId, collegeSemester")
                .eq("collegeId", collegeId)
                .eq("collegeEducationId", educationId)
                .eq("collegeAcademicYearId", academicYearId)
                .eq("isActive", true)
                .order("collegeSemester");

 
            if (error) {
                console.error("SEMESTER FETCH ERROR:", error);
                throw error;
            }
 
            return data;
        }
 
 
 
        case "subject": {
            if (
                !educationId ||
                !branchId ||
                !academicYearId ||
                !semester ||
                !collegeId
            )
                return [];
 
            const { data, error } = await supabase
                .from("college_subjects")
                .select("collegeSubjectId, subjectName")
                .eq("collegeId", collegeId)
                .eq("collegeEducationId", educationId)
                .eq("collegeBranchId", branchId)
                .eq("collegeAcademicYearId", academicYearId)
                .eq("collegeSemesterId", semester)
                .eq("isActive", true)
                .order("subjectName");
 
            if (error) throw error;
            return data;
        }
 
        case "section": {
            if (!collegeId || !educationId || !branchId || !academicYearId) return [];
 
            const { data, error } = await supabase
                .from("college_sections")
                .select("collegeSectionsId, collegeSections")
                .eq("collegeId", collegeId)
                .eq("collegeEducationId", educationId)
                .eq("collegeBranchId", branchId)
                .eq("collegeAcademicYearId", academicYearId)
                .eq("isActive", true)
                .order("collegeSections");
 
            if (error) throw error;
            return data;
        }
 
    }
}