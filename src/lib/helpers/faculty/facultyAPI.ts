import { supabase } from "@/lib/supabaseClient";
import { FacultySectionRow } from "./facultysectionsAPI";

export const getFacultyIdByUserId = async (userId: number | null) => {
    const { data, error } = await supabase
        .from("faculty")
        .select("facultyId")
        .eq("userId", userId)
        .eq("isActive", true)
        .maybeSingle();

    if (error) throw error;

    return data?.facultyId ?? null;
};


export async function fetchFacultyYears(facultyId: number) {
    const { data, error } = await supabase
        .from("faculty_sections")
        .select(`
            collegeAcademicYearId,
            college_academic_year (
                collegeAcademicYearId,
                collegeAcademicYear
            )
        `)
        .eq("facultyId", facultyId)
        .eq("isActive", true)
        .is("deletedAt", null);

    if (error) {
        console.error("fetchFacultyYears error:", error);
        throw error;
    }

    const uniqueYears = Array.from(
        new Map(
            data
                .filter((item: any) => item.college_academic_year)
                .map((item: any) => {
                    const yearData = Array.isArray(item.college_academic_year)
                        ? item.college_academic_year[0]
                        : item.college_academic_year;

                    return [
                        item.collegeAcademicYearId,
                        {
                            id: item.collegeAcademicYearId,
                            label: yearData?.collegeAcademicYear,
                        },
                    ];
                })
        ).values()
    );

    return uniqueYears;
}


export async function fetchFacultySubjects(facultyId: number, academicYearId: number) {
    const { data, error } = await supabase
        .from("faculty_sections")
        .select(`
            collegeSubjectId,
            college_subjects (
                collegeSubjectId,
                subjectName
            )
        `)
        .eq("facultyId", facultyId)
        .eq("collegeAcademicYearId", academicYearId)
        .eq("isActive", true)
        .is("deletedAt", null);

    if (error) {
        console.error("fetchFacultySubjects error:", error);
        throw error;
    }

    const subjects = data
        .filter(item => item.college_subjects)
        .map(item => {
            const subject: any = Array.isArray(item.college_subjects)
                ? item.college_subjects[0]
                : item.college_subjects;

            return {
                id: subject.collegeSubjectId,
                label: subject.subjectName
            };
        });

    return subjects;
}

export async function fetchFacultySections(
    facultyId: number,
    yearId: number,
    subjectId: number
) {
    const { data, error } = await supabase
        .from("faculty_sections")
        .select(`
            facultySectionId,
            collegeSectionsId,
            college_sections (
                collegeSectionsId,
                collegeSections
            )
        `)
        .eq("facultyId", facultyId)
        .eq("collegeAcademicYearId", yearId)
        .eq("collegeSubjectId", subjectId)
        .eq("isActive", true)
        .is("deletedAt", null);

    if (error) {
        console.error("fetchFacultySections error:", error);
        throw error;
    }

    return (data ?? []) as unknown as FacultySectionRow[];
}

export async function fetchSectionsByYear(facultyId: number, yearId: number) {
    const { data, error } = await supabase
        .from("faculty_sections")
        .select(`
            collegeSectionsId,
            college_sections (
                collegeSectionsId,
                collegeSections
            )
        `)
        .eq("facultyId", facultyId)
        .eq("collegeAcademicYearId", yearId)
        .eq("isActive", true)
        .is("deletedAt", null);

    if (error) throw error;

    const uniqueSections = Array.from(
        new Map(
            data
                .filter((item: any) => item.college_sections)
                .map((item: any) => [
                    item.collegeSectionsId,
                    {
                        id: item.collegeSectionsId,
                        label: item.college_sections.collegeSections
                    }
                ])
        ).values()
    );

    return uniqueSections;
}