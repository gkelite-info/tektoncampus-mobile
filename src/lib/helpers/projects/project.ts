import { supabase } from "@/lib/supabaseClient";

export type ProjectRow = {
    projectId: number;
    title: string;
    description: string | null;
    domain: string[];
    skills: string[];
    marks: number | null;
    startDate: string | null;
    endDate: string | null;
    collegeId: number;
    facultyId: number | null;
    adminId: number | null;
    collegeAcademicYearId: number | null;
    collegeSubjectId: number | null;
    collegeSectionsId: number | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

export type EnrichedProject = {
    projectId: number;
    collegeSubjectId: number | null;
    title: string;
    description: string | null;
    domain: string[];
    marks: number | null;
    startDate: string | null;
    endDate: string | null;
    duration: string;
    mentors: { name: string; image: string }[];
    teamMembers: { name: string; image: string }[];
    fileUrls: string[];
    subjectName?: string;
    status?: string;
};


export async function fetchProjectsByCollege(collegeId: number) {
    const { data, error } = await supabase
        .from("projects")
        .select(`
      projectId,
      title,
      description,
      domain,
      skills,
      marks,
      startDate,
      endDate,
      collegeId,
      facultyId,
      adminId,
      collegeAcademicYearId,
  collegeSubjectId,
  collegeSectionsId,
      createdAt,
      updatedAt,
      deletedAt
    `)
        .eq("collegeId", collegeId)
        .is("deletedAt", null)
        .order("createdAt", { ascending: false });

    if (error) {
        console.error("fetchProjectsByCollege error:", error);
        throw error;
    }

    return data ?? [];
}


export async function fetchExistingProject(
    collegeId: number,
    title: string,
) {
    const { data, error } = await supabase
        .from("projects")
        .select("projectId")
        .eq("collegeId", collegeId)
        .eq("title", title.trim())
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


export async function saveProject(
    payload: {
        projectId?: number;
        title: string;
        description?: string | null;
        domain: string[];
        marks?: number | null;
        startDate?: string | null;
        endDate?: string | null;
        collegeId: number;
        facultyId?: number | null;
        adminId?: number | null;
        collegeAcademicYearId?: number | null;
        collegeSubjectId?: number | null;
        collegeSectionsId?: number | null;
    },
) {
    const now = new Date().toISOString();

    const upsertPayload: any = {
        title: payload.title.trim(),
        description: payload.description?.trim() ?? null,
        domain: payload.domain,
        marks: payload.marks ?? null,
        startDate: payload.startDate ?? null,
        endDate: payload.endDate ?? null,
        collegeId: payload.collegeId,
        facultyId: payload.facultyId ?? null,
        adminId: payload.adminId ?? null,
        collegeAcademicYearId: payload.collegeAcademicYearId ?? null,
        collegeSubjectId: payload.collegeSubjectId ?? null,
        collegeSectionsId: payload.collegeSectionsId ?? null,
        updatedAt: now,
    };

    if (!payload.projectId) {
        upsertPayload.createdAt = now;

        const { data, error } = await supabase
            .from("projects")
            .insert([upsertPayload])
            .select("projectId")
            .single();

        if (error) {
            console.error("saveProject error:", error);
            return { success: false, error };
        }

        return {
            success: true,
            projectId: data.projectId,
        };
    }

    const { error } = await supabase
        .from("projects")
        .update(upsertPayload)
        .eq("projectId", payload.projectId);

    if (error) {
        console.error("saveProject error:", error);
        return { success: false, error };
    }

    return {
        success: true,
        projectId: payload.projectId,
    };
}


export async function deactivateProject(projectId: number) {
    const { error } = await supabase
        .from("projects")
        .update({
            deletedAt: new Date().toISOString(),
        })
        .eq("projectId", projectId);

    if (error) {
        console.error("deactivateProject error:", error);
        return { success: false };
    }

    return { success: true };
}


export async function fetchProjectsByFacultyId(facultyId: number) {
    const { data, error } = await supabase
        .from("projects")
        .select(`
      projectId,
      title,
      description,
      domain,
      skills,
      marks,
      startDate,
      endDate,
      collegeId,
      facultyId,
      adminId,
      createdAt,
      updatedAt
    `)
        .eq("facultyId", facultyId)
        .is("deletedAt", null)
        .order("createdAt", { ascending: false });

    if (error) {
        console.error("fetchProjectsByFacultyId error:", error);
        throw error;
    }

    return data ?? [];
}


export async function fetchProjectsByAdminId(adminId: number) {
    const { data, error } = await supabase
        .from("projects")
        .select(`
      projectId,
      title,
      description,
      domain,
      skills,
      marks,
      startDate,
      endDate,
      collegeId,
      facultyId,
      adminId,
      createdAt,
      updatedAt
    `)
        .eq("adminId", adminId)
        .is("deletedAt", null)
        .order("createdAt", { ascending: false });

    if (error) {
        console.error("fetchProjectsByAdminId error:", error);
        throw error;
    }

    return data ?? [];
}

export async function fetchEnrichedProjectsByFaculty(
    facultyId: number,
    collegeSubjectId?: number
): Promise<EnrichedProject[]> {

    let query = supabase
        .from("projects")
        .select(`
            projectId, 
            title, 
            description, 
            domain, 
            marks, 
            startDate, 
            endDate,
            collegeSubjectId,
            college_subjects (
                subjectName
            )
        `)
        .eq("facultyId", facultyId)
        .is("deletedAt", null)
        .order("createdAt", { ascending: false });

    if (collegeSubjectId !== undefined && collegeSubjectId !== null) {
        query = query.eq("collegeSubjectId", collegeSubjectId);
    }

    const { data: projectData, error: projectsError } = await query;

    if (projectsError || !projectData?.length) return [];

    const projectIds = projectData.map((p) => p.projectId);

    const [mentorsRes, teamRes, filesRes] = await Promise.all([
        supabase
            .from("project_mentors")
            .select("projectId, facultyId")
            .in("projectId", projectIds),

        supabase
            .from("project_team_members")
            .select("projectId, studentId")
            .in("projectId", projectIds),

        supabase
            .from("project_files")
            .select("projectId, fileUrl")
            .in("projectId", projectIds),
    ]);

    const mentorRows = mentorsRes.data ?? [];
    const teamRows = teamRes.data ?? [];
    const fileRows = filesRes.data ?? [];

    const uniqueFacultyIds = [...new Set(mentorRows.map((m) => m.facultyId))];
    const uniqueStudentIds = [...new Set(teamRows.map((t) => t.studentId))];

    const [facultyRes, studentRes] = await Promise.all([
        uniqueFacultyIds.length
            ? supabase
                .from("faculty")
                .select("facultyId, fullName, userId")
                .in("facultyId", uniqueFacultyIds)
            : Promise.resolve({ data: [] }),

        uniqueStudentIds.length
            ? supabase
                .from("students")
                .select("studentId, userId, users(fullName)")
                .in("studentId", uniqueStudentIds)
            : Promise.resolve({ data: [] }),
    ]);

    const facultyList = facultyRes.data ?? [];
    const studentList = studentRes.data ?? [];

    const facultyUserIds = facultyList.map((f) => f.userId).filter(Boolean);
    const studentUserIds = studentList.map((s) => s.userId).filter(Boolean);
    const allUserIds = [...new Set([...facultyUserIds, ...studentUserIds])];

    const profileRes = allUserIds.length
        ? await supabase
            .from("user_profile")
            .select("userId, profileUrl")
            .in("userId", allUserIds)
            .eq("is_deleted", false)
        : { data: [] };

    const profileList = profileRes.data ?? [];

    const userNameRes = allUserIds.length
        ? await supabase
            .from("users")
            .select("userId, fullName")
            .in("userId", allUserIds)
        : { data: [] };

    const userNameMap = new Map<number, string>(
        (userNameRes.data ?? []).map((u) => [u.userId, u.fullName ?? ""])
    );

    const profileMap = new Map<number, string>(
        profileList.map((p) => [p.userId, p.profileUrl ?? ""])
    );

    const facultyMap = new Map(
        facultyList.map((f) => ({
            facultyId: f.facultyId,
            name: f.fullName ?? "",
            image: profileMap.get(Number(f.userId)) ?? "",
        })).map((f) => [f.facultyId, f])
    );

    const studentMap = new Map(
        studentList.map((s) => ({
            studentId: s.studentId,
            name: userNameMap.get(Number(s.userId)) ?? "",
            image: profileMap.get(Number(s.userId)) ?? "",
        })).map((s) => [s.studentId, s])
    );

    return projectData.map((project) => {
        const mentors = mentorRows
            .filter((m) => m.projectId === project.projectId)
            .map((m) => facultyMap.get(m.facultyId))
            .filter(Boolean) as { name: string; image: string }[];

        const teamMembers = teamRows
            .filter((t) => t.projectId === project.projectId)
            .map((t) => studentMap.get(t.studentId))
            .filter(Boolean) as { name: string; image: string }[];

        const fileUrls = fileRows
            .filter((f) => f.projectId === project.projectId)
            .map((f) => f.fileUrl);

        const startDate = project.startDate
            ? new Date(project.startDate).toLocaleDateString("en-GB")
            : "";
        const endDate = project.endDate
            ? new Date(project.endDate).toLocaleDateString("en-GB")
            : "";

        return {
            projectId: project.projectId,
            title: project.title,
            description: project.description,
            domain: project.domain,
            marks: project.marks,
            startDate: project.startDate,
            endDate: project.endDate,
            collegeSubjectId: project.collegeSubjectId,
            duration: startDate && endDate ? `${startDate} - ${endDate}` : "N/A",
            mentors,
            teamMembers,
            fileUrls,
        };
    });
}

export async function fetchEnrichedProjectsByStudent(
    studentId: number
): Promise<EnrichedProject[]> {

    const { data: memberRows, error: memberError } = await supabase
        .from("project_team_members")
        .select("projectId")
        .eq("studentId", studentId);

    if (memberError || !memberRows?.length) return [];

    const projectIds = memberRows.map((r) => r.projectId);

    const { data: projectData, error: projectsError } = await supabase
        .from("projects")
        .select(`
            projectId, 
            title, 
            description, 
            domain, 
            marks, 
            startDate, 
            endDate,
            collegeSubjectId,
            college_subjects (
                subjectName
            )
        `)
        .in("projectId", projectIds)
        .is("deletedAt", null)
        .order("createdAt", { ascending: false });

    if (projectsError || !projectData?.length) return [];

    const [mentorsRes, teamRes, filesRes] = await Promise.all([
        supabase
            .from("project_mentors")
            .select("projectId, facultyId")
            .in("projectId", projectIds),

        supabase
            .from("project_team_members")
            .select("projectId, studentId")
            .in("projectId", projectIds),

        supabase
            .from("project_files")
            .select("projectId, fileUrl")
            .in("projectId", projectIds),
    ]);

    const mentorRows = mentorsRes.data ?? [];
    const teamRows = teamRes.data ?? [];
    const fileRows = filesRes.data ?? [];

    const uniqueFacultyIds = [...new Set(mentorRows.map((m) => m.facultyId))];
    const uniqueStudentIds = [...new Set(teamRows.map((t) => t.studentId))];

    const [facultyRes, studentRes] = await Promise.all([
        uniqueFacultyIds.length
            ? supabase
                .from("faculty")
                .select("facultyId, fullName, userId")
                .in("facultyId", uniqueFacultyIds)
            : Promise.resolve({ data: [] }),

        uniqueStudentIds.length
            ? supabase
                .from("students")
                .select("studentId, userId, users(fullName)")
                .in("studentId", uniqueStudentIds)
            : Promise.resolve({ data: [] }),
    ]);

    const facultyList = facultyRes.data ?? [];
    const studentList = studentRes.data ?? [];

    const facultyUserIds = facultyList.map((f) => f.userId).filter(Boolean);
    const studentUserIds = studentList.map((s) => s.userId).filter(Boolean);
    const allUserIds = [...new Set([...facultyUserIds, ...studentUserIds])];

    const profileRes = allUserIds.length
        ? await supabase
            .from("user_profile")
            .select("userId, profileUrl")
            .in("userId", allUserIds)
            .eq("is_deleted", false)
        : { data: [] };

    const profileList = profileRes.data ?? [];

    const profileMap = new Map<number, string>(
        profileList.map((p) => [p.userId, p.profileUrl ?? ""])
    );

    const facultyMap = new Map(
        facultyList
            .map((f) => ({
                facultyId: f.facultyId,
                name: f.fullName ?? "",
                image: profileMap.get(f.userId) ?? "",
            }))
            .map((f) => [f.facultyId, f])
    );

    const studentMap = new Map(
        studentList
            .map((s: any) => ({
                studentId: s.studentId,
                name: s.users?.fullName ?? "Unknown",
                image: profileMap.get(s.userId) ?? "",
            }))
            .map((s) => [s.studentId, s])
    );

    return projectData.map((project: any) => {
        const mentors = mentorRows
            .filter((m) => m.projectId === project.projectId)
            .map((m) => facultyMap.get(m.facultyId))
            .filter(Boolean) as { name: string; image: string }[];

        const teamMembers = teamRows
            .filter((t) => t.projectId === project.projectId)
            .map((t) => studentMap.get(t.studentId))
            .filter(Boolean) as { name: string; image: string }[];

        const fileUrls = fileRows
            .filter((f) => f.projectId === project.projectId)
            .map((f) => f.fileUrl);

        const startDate = project.startDate
            ? new Date(project.startDate).toLocaleDateString("en-GB")
            : "";
        const endDate = project.endDate
            ? new Date(project.endDate).toLocaleDateString("en-GB")
            : "";

        return {
            projectId: project.projectId,
            title: project.title,
            description: project.description,
            domain: project.domain,
            marks: project.marks,
            startDate: project.startDate,
            endDate: project.endDate,
            collegeSubjectId: project.collegeSubjectId,
            subjectName: project.college_subjects?.subjectName || "General",
            duration: startDate && endDate ? `${startDate} - ${endDate}` : "N/A",
            mentors,
            teamMembers,
            fileUrls,
        };
    });
}


export async function fetchAdminPendingStats(yearId: number, collegeId: number) {
    const { data, error } = await supabase
        .from("projects")
        .select(`
            projectId,
            collegeSubjectId,
            collegeSectionsId,
            facultyId,
            project_team_members (
                studentId
            ),
            student_project_submissions (
                studentId
            )
        `)
        .eq("collegeAcademicYearId", yearId)
        .eq("collegeId", collegeId)
        .is("deletedAt", null);

    if (error) {
        console.error("Fetch stats error:", error);
        return null;
    }

    const sectionIds = [
        ...new Set(
            data?.map((p) => p.collegeSectionsId).filter(Boolean) as number[]
        ),
    ];

    let sectionStudentMap = new Map<number, Set<number>>();

    if (sectionIds.length > 0) {
        const { data: historyData, error: historyError } = await supabase
            .from("student_academic_history")
            .select("studentId, collegeSectionsId")
            .in("collegeSectionsId", sectionIds)
            .eq("collegeAcademicYearId", yearId)
            .eq("isCurrent", true)
            .is("deletedAt", null);

        if (historyError) {
            console.error("Fetch section students error:", historyError);
            return null;
        }

        historyData?.forEach((row) => {
            if (!sectionStudentMap.has(row.collegeSectionsId)) {
                sectionStudentMap.set(row.collegeSectionsId, new Set());
            }
            sectionStudentMap.get(row.collegeSectionsId)!.add(row.studentId);
        });
    }

    const subjectStats: Record<string, { active: number; pending: number }> = {};

    data?.forEach((proj) => {
        const subId = proj.collegeSubjectId;
        const facId = proj.facultyId;
        if (!subId || !facId) return;

        const key = `${subId}_${facId}`;

        if (!subjectStats[key]) {
            subjectStats[key] = { active: 0, pending: 0 };
        }

        const submittedStudentIds = new Set(
            proj.student_project_submissions?.map((s) => s.studentId) ?? []
        );

        const assignedStudentIds = proj.project_team_members?.map((m) => m.studentId) ?? [];

        const sectionStudents = proj.collegeSectionsId
            ? sectionStudentMap.get(proj.collegeSectionsId) ?? new Set<number>()
            : new Set<number>();

        const pendingCount = assignedStudentIds.filter(
            (id) => sectionStudents.has(id) && !submittedStudentIds.has(id)
        ).length;

        subjectStats[key].active += 1;
        subjectStats[key].pending += pendingCount;
    });

    return subjectStats;
}