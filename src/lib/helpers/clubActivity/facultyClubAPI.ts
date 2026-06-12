import { supabase } from "@/lib/supabaseClient";

export async function getFacultyClubDetailsAPI(facultyId: number) {
    let targetClubId = null;
    let exactRole = "";

    const [respFacRes, mentorRes] = await Promise.all([
        supabase.from("clubs").select("clubId").eq("responsibleFacultyId", facultyId).eq("is_deleted", false).limit(1).maybeSingle(),
        supabase.from("club_mentors").select("clubId").eq("facultyId", facultyId).eq("is_deleted", false).limit(1).maybeSingle()
    ]);

    if (respFacRes.data) {
        targetClubId = respFacRes.data.clubId;
        exactRole = "responsiblefaculty";
    } else if (mentorRes.data) {
        targetClubId = mentorRes.data.clubId;
        exactRole = "mentor";
    }

    if (!targetClubId) return null;
    const { data: clubData, error } = await supabase
        .from("clubs")
        .select(`
            clubId,
            title,
            imageUrl,
            president:students!clubs_presidentStudentId_fkey(
                users(fullName, user_profile(profileUrl))
            ),
            vicePresident:students!clubs_vicePresidentStudentId_fkey(
                users(fullName, user_profile(profileUrl))
            ),
            responsibleFaculty:faculty!clubs_responsibleFacultyId_fkey(
                facultyId,
                users(fullName, user_profile(profileUrl))
            ),
            mentors:club_mentors(
                is_deleted,
                faculty(facultyId, users(fullName, user_profile(profileUrl)))
            )
        `)
        .eq("clubId", targetClubId)
        .maybeSingle();

    if (error) {
        console.error("Error fetching faculty club details:", error.message || error);
        throw new Error("Failed to load club details");
    }

    if (!clubData) return null;

    const formatUser = (userNode: any, defaultRole: string, id?: string) => {
        const profileData = userNode?.users?.user_profile;
        const avatarUrl = Array.isArray(profileData) ? profileData[0]?.profileUrl : profileData?.profileUrl;

        return {
            id: id || userNode?.facultyId?.toString() || userNode?.studentId?.toString() || "0",
            name: userNode?.users?.fullName || "Not Assigned",
            avatar: avatarUrl || null,
            role: defaultRole
        };
    };

    const respFac = Array.isArray(clubData.responsibleFaculty) ? clubData.responsibleFaculty[0] : clubData.responsibleFaculty;

    return {
        id: clubData.clubId.toString(),
        name: clubData.title,
        logo: clubData.imageUrl,
        president: formatUser(clubData.president, "president"),
        vicePresident: formatUser(clubData.vicePresident, "vicepresident"),
        responsibleFaculty: formatUser(respFac, "responsiblefaculty", respFac?.facultyId?.toString()),
        mentors: (clubData.mentors || [])
            .filter((m: any) => !m.is_deleted && m.faculty)
            .map((m: any) => formatUser(m.faculty, "mentor", m.faculty.facultyId.toString())),
        role: exactRole
    };
}
