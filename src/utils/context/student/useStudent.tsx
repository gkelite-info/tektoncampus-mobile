import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { fetchStudentContext } from "./studentContextAPI";

type StudentContextType = {
    loading: boolean;
    studentId: number | null;
    userId: number | null;
    collegeId: number | null;
    collegeEducationId: number | null;
    collegeBranchId: number | null;
    collegeEducationType: string | null;
    collegeBranchCode: string | null;
    collegeAcademicYearId: number | null;
    collegeAcademicYear: string | null;
    collegeSemesterId: number | null;
    collegeSemester: string | number | null;
    collegeSectionsId: number | null;
    college_sections: string | null;
    entryType: string | null;
    status: string | null;
    subjects: any[];
};

const initialContextValue: StudentContextType = {
    loading: true,
    studentId: null,
    userId: null,
    collegeId: null,
    collegeEducationId: null,
    collegeBranchId: null,
    collegeEducationType: null,
    collegeBranchCode: null,
    collegeAcademicYearId: null,
    collegeAcademicYear: null,
    collegeSemesterId: null,
    collegeSemester: null,
    collegeSectionsId: null,
    college_sections: null,
    entryType: null,
    status: null,
    subjects: [],
};

const StudentContext = createContext<StudentContextType>(initialContextValue);

export const StudentProvider = ({ children }: { children: React.ReactNode }) => {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [state, setState] = useState<StudentContextType>({
        ...initialContextValue,
        loading: true,
    });

    useEffect(() => {
        const loadStudent = async () => {
            try {
                const { data: auth } = await supabase.auth.getUser();
                if (!auth.user) {
                    setState(prev => ({ ...prev, loading: false }));
                    return;
                }

                const { data: user } = await supabase
                    .from("users")
                    .select("userId, role")
                    .eq("auth_id", auth.user.id)
                    .single();

                if (!user || user.role !== "Student") {
                    setState(prev => ({ ...prev, loading: false }));
                    return;
                }

                const student = await fetchStudentContext(user.userId);
                if (!student) {
                    setState(prev => ({ ...prev, loading: false }));
                    return;
                }

                let query = supabase
                    .from("college_subjects")
                    .select("*")
                    .eq("collegeId", student.collegeId)
                    .eq("collegeAcademicYearId", student.collegeAcademicYearId)
                    .eq("isActive", true)
                    .is("deletedAt", null);

                if (student.collegeSemesterId !== null && student.collegeSemesterId !== undefined) {
                    query = query.eq("collegeSemesterId", student.collegeSemesterId);
                } else {
                    query = query.is("collegeSemesterId", null);
                }

                const { data: subjectsData, error: subjectsError } = await query;

                if (subjectsError) {
                    console.error("Subjects fetch error:", subjectsError);
                }

                const finalSubjects = subjectsData ?? [];
                setSubjects(finalSubjects);

                setState({
                    loading: false,
                    userId: user.userId,
                    studentId: student.studentId,
                    collegeId: student.collegeId,
                    collegeEducationId: student.collegeEducationId,
                    collegeBranchId: student.collegeBranchId,
                    collegeEducationType: student.collegeEducationType,
                    collegeBranchCode: student.collegeBranchCode,
                    collegeAcademicYearId: student.collegeAcademicYearId,
                    collegeAcademicYear: student.collegeAcademicYear,
                    collegeSemesterId: student.collegeSemesterId,
                    collegeSemester: student.collegeSemester,
                    collegeSectionsId: student.collegeSectionsId,
                    college_sections: student.collegeSections,
                    entryType: student.entryType,
                    status: student.status,
                    subjects: finalSubjects,
                });
            } catch (err) {
                console.error("Student context error:", err);
                setState(prev => ({ ...prev, loading: false }));
            }
        };
        loadStudent();
    }, []);

    return (
        <StudentContext.Provider value={{ ...state, subjects }}>
            {children}
        </StudentContext.Provider>
    );
};

export const useStudent = () => useContext(StudentContext);