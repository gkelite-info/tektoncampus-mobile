import { supabase } from "@/lib/supabaseClient";

export type FacultyTaskRow = {
    facultyTaskId: number;
    collegeSubjectId: number;
    taskTitle: string;
    description: string;
    date: string;
    time: string;
    createdBy: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

export async function fetchFacultyTasks(collegeSubjectId: number) {

    const today = new Date().toISOString().split("T")[0];

    const { error: deactivateError } = await supabase
        .from("faculty_tasks")
        .update({
            isActive: false,
            is_deleted: true,
            deletedAt: new Date().toISOString(),
        })
        .lt("date", today)
        .eq("collegeSubjectId", collegeSubjectId)
        .eq("isActive", true);

    if (deactivateError) {
        console.error("auto deactivate tasks error:", deactivateError);
    }

    const { data, error } = await supabase
        .from("faculty_tasks")
        .select(`
      facultyTaskId,
      collegeSubjectId,
      taskTitle,
      description,
      date,
      time,
      createdBy,
      isActive,
      createdAt,
      updatedAt,
      deletedAt
    `)
        .eq("collegeSubjectId", collegeSubjectId)
        .eq("date", today)
        .eq("isActive", true)
        .is("deletedAt", null)
        .order("time", { ascending: true });

    if (error) {
        console.error("fetchFacultyTasks error:", error);
        throw error;
    }

    return data ?? [];
}


export async function fetchExistingFacultyTask(
    collegeSubjectId: number,
    taskTitle: string,
    date: string,
) {
    const { data, error } = await supabase
        .from("faculty_tasks")
        .select("facultyTaskId")
        .eq("collegeSubjectId", collegeSubjectId)
        .eq("taskTitle", taskTitle.trim())
        .eq("date", date)
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


export async function saveFacultyTask(
    payload: {
        facultyTaskId?: number;
        collegeSubjectId: number;
        taskTitle: string;
        description: string;
        date: string;
        time: string;
    },
    facultyId: number,
) {
    const now = new Date().toISOString();
    const today = new Date().toISOString().split("T")[0];
    const taskDate = payload.date;
    const shouldBeActive = taskDate >= today;

    const upsertPayload: any = {
        collegeSubjectId: payload.collegeSubjectId,
        taskTitle: payload.taskTitle.trim(),
        description: payload.description.trim(),
        date: payload.date,
        time: payload.time,
        isActive: shouldBeActive,
        is_deleted: !shouldBeActive,
        updatedAt: now,
    };

    if (!payload.facultyTaskId) {

        upsertPayload.createdBy = facultyId;
        upsertPayload.createdAt = now;

        const { data, error } = await supabase
            .from("faculty_tasks")
            .insert([upsertPayload])
            .select("facultyTaskId")
            .single();

        if (error) {
            console.error("saveFacultyTask error:", error);
            return { success: false, error };
        }

        return {
            success: true,
            facultyTaskId: data.facultyTaskId,
        };

    }

    const { error } = await supabase
        .from("faculty_tasks")
        .update(upsertPayload)
        .eq("facultyTaskId", payload.facultyTaskId);

    if (error) {
        console.error("saveFacultyTask error:", error);
        return { success: false, error };
    }

    return {
        success: true,
        facultyTaskId: payload.facultyTaskId,
    };
}

export async function deactivateFacultyTask(facultyTaskId: number) {

    const { error } = await supabase
        .from("faculty_tasks")
        .update({
            isActive: false,
            is_deleted: true,
            deletedAt: new Date().toISOString(),
        })
        .eq("facultyTaskId", facultyTaskId);

    if (error) {
        console.error("deactivateFacultyTask error:", error);
        return { success: false };
    }

    return { success: true };
}


export async function fetchFacultyTasksForLoggedInFaculty(
    facultyId: number,
    collegeSubjectId: number,
) {
    const { data: facultyTaskData, error: facultyTaskError } = await supabase
        .from("faculty_tasks")
        .select(`
      facultyTaskId,
      taskTitle,
      description,
      date,
      time
    `)
        .eq("createdBy", facultyId)
        .eq("collegeSubjectId", collegeSubjectId)
        .eq("isActive", true)
        .is("deletedAt", null)
        .order("date", { ascending: true });

    if (facultyTaskError) {
        console.error("fetchFacultyTasksForLoggedInFaculty error:", facultyTaskError);
        throw facultyTaskError;
    }

    return facultyTaskData ?? [];
}


export const fetchFacultyTasksByFacultyId = async (facultyId: number) => {
    const today = new Date().toISOString().split("T")[0];

    await supabase
        .from("faculty_tasks")
        .update({
            isActive: false,
            is_deleted: true,
            deletedAt: new Date().toISOString(),
        })
        .lt("date", today)
        .eq("createdBy", facultyId)
        .eq("isActive", true);

    const { data, error } = await supabase
        .from("faculty_tasks")
        .select(`*`)
        .eq("createdBy", facultyId)
        .eq("isActive", true)
        .is("deletedAt", null)
        .order("date", { ascending: true });

    if (error) throw error;
    return data ?? [];
};


export async function fetchFacultyTasksForStudent(params: {
    date: string;
    collegeId: number;
    collegeBranchId: number;
    collegeAcademicYearId: number;
    collegeSemesterId?: number | null;
}) {
    const { data, error } = await supabase
        .from("faculty_tasks")
        .select(`
      *,
      college_subjects!inner (
        subjectName,
        subjectCode,
        collegeId,
        collegeBranchId,
        collegeAcademicYearId,
        collegeSemesterId
      )
    `)
        .eq("date", params.date)
        .eq("isActive", true)
        .is("deletedAt", null)
        .eq("college_subjects.collegeId", params.collegeId)
        .eq("college_subjects.collegeBranchId", params.collegeBranchId)
        .eq("college_subjects.collegeAcademicYearId", params.collegeAcademicYearId)
        .eq("college_subjects.collegeSemesterId", params.collegeSemesterId ?? null);

    if (error) {
        console.error("fetchFacultyTasksForStudent error:", error);
        return [];
    }

    return data ?? [];
}

export async function countActiveFacultyTasks(facultyId: number) {

    const today = new Date().toISOString().split("T")[0];

    const { count, error } = await supabase
        .from("faculty_tasks")
        .select("*", { count: "exact", head: true })
        .eq("createdBy", facultyId)
        .eq("date", today)
        .eq("isActive", true)
        .is("deletedAt", null);

    if (error) {
        console.error("countActiveFacultyTasks error:", error);
        return 0;
    }

    return count ?? 0;
}

export async function cleanupExpiredTasks(collegeSubjectId: number) {
    const today = new Date().toISOString().split("T")[0];

    await supabase
        .from("faculty_tasks")
        .update({
            isActive: false,
            is_deleted: true,
            deletedAt: new Date().toISOString(),
        })
        .lt("date", today)
        .eq("collegeSubjectId", collegeSubjectId)
        .eq("isActive", true);
}