import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "../UserContext";
import { fetchFacultyContext } from "./facultyContextAPI";

export type FacultySubject = {
    subjectName: string;
};

export type CollegeAcademicYear = {
    collegeAcademicYearId: number;
    collegeAcademicYear: string;
};

export type FacultySection = {
    facultySectionId: number;
    collegeSectionsId: number;
    collegeSubjectId: number;
    collegeAcademicYearId: number;
    faculty_subject: {
        subjectName: string;
    } | null;
    college_sections: {
        collegeSections: string;
    } | null;
};

export type FacultyContextType = {
    loading: boolean;
    facultyId: number | null;
    userId: number | null;
    fullName: string | null;
    email: string | null;
    mobile: string | null;
    role: string | null;
    gender: string | null;
    collegeId: number | null;
    collegeEducationId: number | null;
    faculty_edu_type: string | null;
    collegeBranchId: number | null;
    college_branch: string | null;
    isActive: boolean | null;
    sections: FacultySection[];
    sectionIds: number[];
    subjectIds: number[];
    academicYearIds: number[];
    faculty_subject: FacultySubject[];
    collegeAcademicYears: CollegeAcademicYear[];
    collegeAcademicYear: string | null;
};

const FacultyContext = createContext<FacultyContextType | null>(null);

export const FacultyProvider = ({ children }: { children: React.ReactNode }) => {
    const { userId, role, loading: userLoading } = useUser();

    const [state, setState] = useState<FacultyContextType>({
        loading: true,
        facultyId: null,
        userId: null,
        fullName: null,
        email: null,
        mobile: null,
        role: null,
        gender: null,
        collegeId: null,
        collegeEducationId: null,
        faculty_edu_type: null,
        collegeBranchId: null,
        college_branch: null,
        isActive: null,
        sections: [],
        sectionIds: [],
        subjectIds: [],
        academicYearIds: [],
        faculty_subject: [],
        collegeAcademicYears: [],
        collegeAcademicYear: null,
    });

    useEffect(() => {
        const loadFaculty = async () => {
            if (userLoading) return;

            if (!userId || role !== "Faculty") {
                setState((s) => ({ ...s, loading: false }));
                return;
            }

            try {
                const faculty = await fetchFacultyContext(userId);

                setState({
                    loading: false,
                    facultyId: faculty.facultyId,
                    userId: faculty.userId,
                    fullName: faculty.fullName,
                    email: faculty.email,
                    mobile: faculty.mobile,
                    role: faculty.role,
                    gender: faculty.gender,
                    collegeId: faculty.collegeId,
                    collegeEducationId: faculty.collegeEducationId,
                    collegeBranchId: faculty.collegeBranchId,
                    college_branch: faculty.college_branch,
                    faculty_edu_type: faculty.faculty_edu_type,
                    isActive: faculty.isActive,
                    sections: faculty.sections,
                    sectionIds: faculty.sectionIds,
                    subjectIds: faculty.subjectIds,
                    academicYearIds: faculty.academicYearIds,
                    faculty_subject: faculty.faculty_subject,
                    collegeAcademicYears: faculty.collegeAcademicYears,
                    collegeAcademicYear: faculty.collegeAcademicYear,
                });
            } catch (err) {
                console.error("Failed to load faculty context", err);
                setState((s) => ({ ...s, loading: false }));
            }
        };

        loadFaculty();
    }, [userId, role, userLoading]);

    return (
        <FacultyContext.Provider value={state}>
            {children}
        </FacultyContext.Provider>
    );
};

export function useFaculty() {
    const context = useContext(FacultyContext);
    if (!context) {
        throw new Error("useFaculty must be used inside FacultyProvider");
    }
    return context;
}