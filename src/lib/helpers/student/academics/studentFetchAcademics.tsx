import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/utils/context/UserContext";
import { CardProps } from "@/(screens)/student/academics/components/subjectCard";

export type StudentProfile = {
    studentId: number;
    department: string;
    degree: string;
    year: string;
    semester: string;
    collegeBranchId: number;
    collegeEducationId: number;
    collegeId: number;
};

type FetchResult = {
    profile: StudentProfile;
    subjects: CardProps[];
} | null;

type StudentContextType = {
    studentProfile: StudentProfile | null;
    subjects: CardProps[];
    loading: boolean;
    studentId: number | null;
    refreshData: () => Promise<void>;
};

const fetchStudentAcademicData = async (userId: number): Promise<FetchResult> => {
    try {
        const { data: studentData, error: studentError } = await supabase
            .from("students")
            .select(`
        studentId,
        collegeBranchId,
        collegeEducationId,
        collegeId,
        college_branch ( collegeBranchCode ),
        college_education ( collegeEducationType )
      `)
            .eq("userId", userId)
            .single();

        if (studentError || !studentData) {
            console.error("Student Fetch Error:", studentError);
            return null;
        }

        const { data: historyData, error: historyError } = await supabase
            .from("student_academic_history")
            .select(`
        collegeAcademicYearId,
        collegeSemesterId,
        college_academic_year ( collegeAcademicYear ),
        college_semester ( collegeSemester )
      `)
            .eq("studentId", studentData.studentId)
            .eq("isCurrent", true)
            .maybeSingle();

        if (historyError) {
            console.error("Student_academic_history error", historyError);
        }

        const educationData = studentData.college_education as any;
        const educationType = Array.isArray(educationData)
            ? educationData[0]?.collegeEducationType
            : educationData?.collegeEducationType;

        const currentYearId = historyData?.collegeAcademicYearId ?? null;
        const currentSemesterId = historyData?.collegeSemesterId ?? null;

        const isInter = currentSemesterId === null;

        const branchData = studentData.college_branch as any;
        const branchCode = Array.isArray(branchData)
            ? branchData[0]?.collegeBranchCode
            : branchData?.collegeBranchCode;

        const yearObj = Array.isArray(historyData?.college_academic_year)
            ? historyData?.college_academic_year[0]
            : historyData?.college_academic_year;

        const semObj = Array.isArray(historyData?.college_semester)
            ? historyData?.college_semester[0]
            : historyData?.college_semester;

        const currentYearStr = yearObj?.collegeAcademicYear || "N/A";
        const semesterNumber = semObj?.collegeSemester || null;
        const currentSemStr = semesterNumber ? `${semesterNumber}` : "Yearly";

        const profile: StudentProfile = {
            studentId: studentData.studentId,
            department: branchCode || "N/A",
            degree: educationType || "N/A",
            year: currentYearStr,
            semester: isInter ? "Yearly" : currentSemStr,
            collegeBranchId: studentData.collegeBranchId,
            collegeEducationId: studentData.collegeEducationId,
            collegeId: studentData.collegeId,
        };

        if (!currentYearId) return { profile, subjects: [] };

        let query = supabase
            .from("college_subjects")
            .select(`
        *,
        college_semester ( collegeSemester ),
        college_academic_year ( collegeAcademicYear ),
        college_subject_units (
          *,
          college_subject_unit_topics ( * )
        )
    `)
            .eq("collegeBranchId", studentData.collegeBranchId)
            .eq("collegeEducationId", studentData.collegeEducationId)
            .eq("collegeAcademicYearId", currentYearId)
            .is("deletedAt", null);

        if (currentSemesterId && currentSemesterId !== null) {
            query = query.eq("collegeSemesterId", Number(currentSemesterId));
        }

        let { data: subjectData, error: subjectError } = await query;

        if (!subjectError && (!subjectData || subjectData.length === 0) && currentSemesterId) {
            const fallbackQuery = supabase
                .from("college_subjects")
                .select(`
            *,
            college_semester ( collegeSemester ),
            college_academic_year ( collegeAcademicYear ),
            college_subject_units (
              *,
              college_subject_unit_topics ( * )
            )
        `)
                .eq("collegeBranchId", studentData.collegeBranchId)
                .eq("collegeEducationId", studentData.collegeEducationId)
                .eq("collegeAcademicYearId", currentYearId)
                .is("deletedAt", null);

            const fallbackResult = await fallbackQuery;
            if (!fallbackResult.error) {
                subjectData = fallbackResult.data;
            }
        }

        const subjectsArray = subjectData || [];

        const facultyIds = new Set<number>();
        subjectsArray.forEach((sub: any) => {
            sub.college_subject_units?.forEach((unit: any) => {
                if (unit.createdBy) facultyIds.add(unit.createdBy);
            });
        });

        const facultyMap: Record<number, { fullName: string; gender: string; profileUrl: string | null }> = {};

        if (facultyIds.size > 0) {
            const { data: facultyData, error: facultyDataError } = await supabase
                .from("faculty")
                .select("facultyId, fullName, gender, users (user_profile (profileUrl))")
                .in("facultyId", Array.from(facultyIds));

            facultyData?.forEach((f: any) => {
                const profileData = f.users?.user_profile;
                const profileUrl = Array.isArray(profileData)
                    ? profileData[0]?.profileUrl
                    : profileData?.profileUrl;
                facultyMap[f.facultyId] = {
                    fullName: f.fullName,
                    gender: f.gender,
                    profileUrl: profileUrl || null,
                };
            });

            if (facultyDataError) {
                console.error("Failed to load facultyData", facultyDataError);
                throw facultyDataError;
            }
        }

        const mappedSubjects: CardProps[] = subjectsArray.map((subject: any) => {
            const units = subject.college_subject_units || [];

            units.sort((a: any, b: any) => (a.unitNumber || 0) - (b.unitNumber || 0));

            const totalUnits = units.length;

            let subjectTotalTopics = 0;
            let subjectCompletedTopics = 0;

            let nextLessonName: string | null = null;
            let hasFoundNext = false;
            let hasAnyTopics = false;

            const avgPercentage =
                totalUnits > 0
                    ? Math.round(
                        units.reduce(
                            (acc: number, curr: any) => acc + (curr.completionPercentage || 0),
                            0
                        ) / totalUnits
                    )
                    : 0;

            const formatDate = (date: Date) => {
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const dd = String(date.getDate()).padStart(2, "0");
                const yyyy = date.getFullYear();
                return `${mm}-${dd}-${yyyy}`;
            };

            const startDates = units
                .map((u: any) => new Date(u.startDate).getTime())
                .filter((d: number) => !isNaN(d));

            const endDates = units
                .map((u: any) => new Date(u.endDate).getTime())
                .filter((d: number) => !isNaN(d));

            const fromDate = startDates.length
                ? formatDate(new Date(Math.min(...startDates)))
                : "TBD";

            const toDate = endDates.length
                ? formatDate(new Date(Math.max(...endDates)))
                : "TBD";

            const unitsData = units.map((u: any) => {
                const rawTopics = u.college_subject_unit_topics || [];
                const activeTopics = rawTopics.filter((t: any) => t.isActive !== false);

                activeTopics.sort(
                    (a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0)
                );

                if (activeTopics.length > 0) hasAnyTopics = true;

                const formattedTopics = activeTopics.map((t: any) => {
                    subjectTotalTopics++;

                    if (t.isCompleted) subjectCompletedTopics++;
                    else if (!hasFoundNext) {
                        nextLessonName = t.topicTitle;
                        hasFoundNext = true;
                    }

                    return {
                        topicId: t.collegeSubjectUnitTopicId,
                        name: t.topicTitle,
                        isCompleted: !!t.isCompleted,
                        displayOrder: t.displayOrder || 0,
                    };
                });

                return {
                    id: u.collegeSubjectUnitId,
                    unitLabel: `Unit - ${u.unitNumber}`,
                    title: u.unitTitle,
                    color:
                        u.unitNumber % 3 === 0
                            ? "blue"
                            : u.unitNumber % 2 === 0
                                ? "orange"
                                : "purple",
                    dateRange: `${fromDate} - ${toDate}`,
                    percentage: u.completionPercentage,
                    topics: formattedTopics,
                };
            });

            const finalNextLesson = hasFoundNext
                ? nextLessonName!
                : hasAnyTopics
                    ? "Completed"
                    : "No Classes";

            const firstUnit = units[0];
            const lecturerInfo = firstUnit ? facultyMap[firstUnit.createdBy] : null;

            return {
                profileIcon: lecturerInfo?.profileUrl || "",
                subjectTitle: subject.subjectName,
                subjectCredits: subject.credits,
                lecturer: lecturerInfo?.fullName || "Not Assigned",
                units: totalUnits,
                topicsCovered: subjectCompletedTopics,
                topicsTotal: subjectTotalTopics,
                nextLesson: finalNextLesson,
                fromDate,
                toDate,
                percentage: avgPercentage,
                semester: subject.college_semester?.collegeSemester || semesterNumber,
                academicYear: subject.college_academic_year?.collegeAcademicYear,
                unitsData,
            };
        });

        return { profile, subjects: mappedSubjects };
    } catch (error) {
        console.error("Error in fetchStudentAcademicData:", error);
        return null;
    }
};

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider = ({ children }: { children: ReactNode }) => {
    const { userId, loading: userLoading } = useUser();
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
    const [studentId, setStudentId] = useState<number | null>(null);
    const [subjects, setSubjects] = useState<CardProps[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const data = await fetchStudentAcademicData(userId);

            if (data) {
                setStudentProfile(data.profile);
                setSubjects(data.subjects);
                setStudentId(data.profile.studentId);
            }
        } catch (err) {
            console.error("Academics Load Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userLoading && userId) {
            loadData();
        } else if (!userLoading && !userId) {
            setLoading(false);
        }
    }, [userId, userLoading]);

    return (
        <StudentContext.Provider
            value={{ studentProfile, subjects, loading, refreshData: loadData, studentId }}
        >
            {children}
        </StudentContext.Provider>
    );
};

export const useStudent = () => {
    const context = useContext(StudentContext);
    if (!context) {
        throw new Error("useStudent must be used within StudentProvider");
    }
    return context;
};