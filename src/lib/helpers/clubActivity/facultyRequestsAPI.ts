import { supabase } from "@/lib/supabaseClient";

export async function getFacultyClubRequestsAPI(
    clubId: number,
    filter: string,
    page: number = 1,
    limit: number = 20,
    searchQuery: string = ""
) {
    const offset = (page - 1) * limit;

    let query = supabase
        .from("club_join_requests")
        .select(`
            clubJoinRequestId,
            status,
            studentId,
            students!inner(
                users!inner(fullName, user_profile(profileUrl)),
                college_education(collegeEducationType),
                college_branch(collegeBranchCode),
                student_academic_history!left(
                    isCurrent,
                    college_academic_year!left(collegeAcademicYear)
                )
            )
        `, { count: "exact" })
        .eq("clubId", Number(clubId))
        .eq("is_deleted", false);

    if (filter === "all") {
        query = query.in("status", ["pending", "accepted"]);
    } else {
        query = query.eq("status", filter);
    }

    if (searchQuery) {
        query = query.ilike("students.users.fullName", `%${searchQuery}%`);
    }

    query = query
        .order("createdAt", { ascending: false })
        .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        throw new Error("Failed to load requests");
    }

    const formattedData = data.map((req: any) => {
        const userNode = req.students?.users;
        const profileData = userNode?.user_profile;
        const avatarUrl = Array.isArray(profileData) ? profileData[0]?.profileUrl : profileData?.profileUrl;

        const edu = req.students?.college_education?.collegeEducationType || "";
        const branch = req.students?.college_branch?.collegeBranchCode || "";
        const academicHistory = req.students?.student_academic_history || [];
        const currentHistory = academicHistory.find((h: any) => h?.isCurrent) || academicHistory[0] || null;
        const year = currentHistory?.college_academic_year?.collegeAcademicYear || "";
        const details = [edu, branch, year].filter(Boolean).join(" - ") || "Student";

        return {
            id: req.clubJoinRequestId.toString(),
            studentId: req.studentId,
            name: userNode?.fullName || "",
            avatar: avatarUrl || null,
            details: details,
            status: req.status
        };
    });

    return {
        requests: formattedData,
        totalCount: count || 0
    };
}

export async function getFacultyClubMembersAPI(
    clubId: number,
    page: number = 1,
    limit: number = 10,
    searchQuery: string = ""
) {
    const offset = (page - 1) * limit;

    let query = supabase
        .from("club_members")
        .select(`
            clubMemberId,
            studentId,
            joinedAt,
            students!inner(
                users!inner(fullName, user_profile(profileUrl)),
                college_education(collegeEducationType),
                college_branch(collegeBranchCode),
                student_academic_history!left(
                    isCurrent,
                    college_academic_year!left(collegeAcademicYear)
                )
            )
        `, { count: "exact" })
        .eq("clubId", Number(clubId))
        .eq("is_deleted", false);

    if (searchQuery) {
        query = query.ilike("students.users.fullName", `%${searchQuery}%`);
    }

    query = query
        .order("joinedAt", { ascending: false })
        .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new Error("Failed to load members");

    const formattedData = data.map((member: any) => {
        const userNode = member.students?.users;
        const profileData = userNode?.user_profile;
        const avatarUrl = Array.isArray(profileData) ? profileData[0]?.profileUrl : profileData?.profileUrl;

        const edu = member.students?.college_education?.collegeEducationType || "";
        const branch = member.students?.college_branch?.collegeBranchCode || "";
        const academicHistory = member.students?.student_academic_history || [];
        const currentHistory = academicHistory.find((h: any) => h?.isCurrent) || academicHistory[0] || null;
        const year = currentHistory?.college_academic_year?.collegeAcademicYear || "";

        return {
            id: member.clubMemberId.toString(),
            studentId: member.studentId,
            name: userNode?.fullName || "",
            avatar: avatarUrl || null,
            details: [edu, branch, year].filter(Boolean).join(" - ") || "Student",
            status: "accepted"
        };
    });

    return { requests: formattedData, totalCount: count || 0 };
}


export async function processClubRequestsAPI(
    action: "accept" | "reject",
    requestIds: number[],
    studentsData: { studentId: number; clubId: number }[],
    facultyId: number
) {
    const timestamp = new Date().toISOString();

    const { error: updateError } = await supabase
        .from("club_join_requests")
        .update({
            status: action === "accept" ? "accepted" : "rejected",
            reviewedByFacultyId: facultyId,
            reviewedAt: timestamp,
            updatedAt: timestamp
        })
        .in("clubJoinRequestId", requestIds);

    if (updateError) throw new Error(`Failed to ${action} requests`);

    if (action === "accept" && studentsData.length > 0) {
        const clubId = studentsData[0].clubId;
        const studentIds = studentsData.map(d => d.studentId);

        const { data: existingMembers, error: fetchError } = await supabase
            .from("club_members")
            .select("studentId, createdAt") 
            .eq("clubId", clubId)
            .in("studentId", studentIds);

        if (fetchError) throw new Error("Failed to verify existing members");

        const upsertPayload = studentsData.map(data => {
            const existing = existingMembers?.find(m => m.studentId === data.studentId);

            return {
                clubId: data.clubId,
                studentId: data.studentId,
                createdAt: existing ? existing.createdAt : timestamp,
                joinedAt: timestamp,
                updatedAt: timestamp,
                is_deleted: false,
                removedAt: null,
                removedBy: null,
                removedByAdminId: null,
                deletedAt: null
            };
        });

        const { error: upsertError } = await supabase
            .from("club_members")
            .upsert(upsertPayload, { onConflict: "clubId,studentId" });

        if (upsertError) throw new Error("Failed to add or update users.");
    }
}

export async function removeClubMembersAPI(
    studentsData: { studentId: number; clubId: number }[],
    facultyId: number
) {
    if (!studentsData || studentsData.length === 0) return;

    const timestamp = new Date().toISOString();
    const clubId = studentsData[0].clubId;
    const studentIds = studentsData.map(data => data.studentId);

    const [memberUpdate, requestUpdate] = await Promise.all([
        supabase.from("club_members").update({
            is_deleted: true,
            removedBy: facultyId,
            removedAt: timestamp,
            deletedAt: timestamp
        }).eq("clubId", clubId).in("studentId", studentIds),

        supabase.from("club_join_requests").update({
            status: "rejected",
            reviewedByFacultyId: facultyId,
            reviewedAt: timestamp,
            updatedAt: timestamp
        }).eq("clubId", clubId).in("studentId", studentIds)
    ]);

    if (memberUpdate.error) throw new Error("Failed to remove members");
    if (requestUpdate.error) throw new Error("Failed to update club request status");
}
