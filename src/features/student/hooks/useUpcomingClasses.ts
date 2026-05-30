import { fetchUpcomingClassesForStudent } from "@/lib/helpers/profile/calender/fetchUpcomingClassesForStudent";
import { useStudent } from "@/utils/context/student/useStudent";
import { useQuery } from "@tanstack/react-query";

export function useUpcomingClasses() {
    const {
        collegeEducationId,
        collegeBranchId,
        collegeAcademicYearId,
        collegeSemesterId,
        collegeSectionsId,
    } = useStudent();

    return useQuery({
        queryKey: [
            "student",
            "upcomingClasses",
            collegeEducationId,
            collegeBranchId,
            collegeAcademicYearId,
            collegeSemesterId,
            collegeSectionsId,
        ],

        enabled:
            !!collegeEducationId &&
            !!collegeBranchId &&
            !!collegeAcademicYearId &&
            !!collegeSectionsId,

        staleTime: 5 * 60 * 1000,

        queryFn: () =>
            fetchUpcomingClassesForStudent({
                collegeEducationId,
                collegeBranchId,
                collegeAcademicYearId,
                collegeSemesterId: collegeSemesterId!,
                collegeSectionId: collegeSectionsId,
            }),
    });
}