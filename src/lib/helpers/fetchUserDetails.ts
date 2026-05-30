import { supabase } from "../supabaseClient";


export const getUserIdFromAuth = async (auth_id: string) => {
    try {
        const { data, error } = await supabase
            .from("users")
            .select("userId")
            .eq("auth_id", auth_id)
            .single();

        if (error) throw error;
        return { success: true, userId: data.userId };
    } catch (err: any) {
        console.error("GET USER ID ERROR:", err.message);
        return { success: false, error: err.message };
    }
};


export const fetchWeeklyClassCounts = async (params: {
    userId: number,
    weekDays: { fullDate: string }[],
    collegeEducationType: string | null,
    fetchStudentContext: any,
    fetchStudentTimetableByDate: any
}) => {
    try {
        const studentContext = await params.fetchStudentContext(params.userId);

        const countPromises = params.weekDays.map(async (day) => {
            const data = await params.fetchStudentTimetableByDate({
                date: day.fullDate,
                collegeEducationId: studentContext.collegeEducationId,
                collegeBranchId: studentContext.collegeBranchId,
                collegeAcademicYearId: studentContext.collegeAcademicYearId,
                collegeSemesterId: studentContext.collegeSemesterId,
                collegeSectionId: studentContext.collegeSectionsId,
                isInter: params.collegeEducationType === "Inter",
            });
            return { date: day.fullDate, count: data.length };
        });

        const results = await Promise.all(countPromises);

        const countsObj = results.reduce((acc, curr) => {
            acc[curr.date] = curr.count;
            return acc;
        }, {} as Record<string, number>);

        return { success: true, counts: countsObj };
    } catch (err: any) {
        console.error("FETCH WEEKLY COUNTS ERROR:", err.message);
        return { success: false, error: err.message };
    }
};