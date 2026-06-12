import { supabase } from "@/lib/supabaseClient";

export async function getAllClubsAPI(collegeId: number, page: number = 1, limit: number = 15) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await supabase
        .from("clubs")
        .select(`
            clubId,
            title,
            imageUrl,
            createdBy,
            president:students!clubs_presidentStudentId_fkey(isActive),
            vicePresident:students!clubs_vicePresidentStudentId_fkey(isActive),
            faculty:faculty!clubs_responsibleFacultyId_fkey(isActive),
            mentors:club_mentors(faculty(isActive)),
            members:club_members(is_deleted, students(isActive))
        `, { count: 'exact' })
        .eq("collegeId", collegeId)
        .eq("is_deleted", false)
        .order("createdAt", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Error fetching clubs:", error);
        throw error;
    }

    const formattedData = data.map((club: any) => {
        let activeCount = 0;
        let inactiveCount = 0;

        const checkStatus = (entity: any) => {
            if (!entity) return;
            if (entity.isActive) activeCount++;
            else inactiveCount++;
        };

        checkStatus(club.president);
        checkStatus(club.vicePresident);
        checkStatus(club.faculty);
        if (club.mentors) {
            club.mentors.forEach((m: any) => checkStatus(m.faculty));
        }

        if (club.members) {
            club.members.forEach((member: any) => {
                if (member.is_deleted === false) {
                    checkStatus(member.students);
                }
            });
        }

        return {
            id: club.clubId.toString(),
            name: club.title,
            logo: club.imageUrl,
            createdBy: club.createdBy,
            active: activeCount,
            inactive: inactiveCount
        };
    });

    return {
        data: formattedData,
        total: count || 0
    };
}
