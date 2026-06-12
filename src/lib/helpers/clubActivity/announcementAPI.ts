import { supabase } from "@/lib/supabaseClient";

const ANNOUNCEMENT_SELECT_QUERY = `
    announcementId,
    clubId,
    message,
    authorRole,
    authorStudentId,
    authorFacultyId,
    createdAt,
    updatedAt,
    is_deleted,
    authorStudent:students!club_announcements_authorStudentId_fkey(users(fullName, user_profile(profileUrl))),
    authorFaculty:faculty!club_announcements_authorFacultyId_fkey(users(fullName, user_profile(profileUrl)))
`;

export async function fetchAnnouncements(clubId: number, cursor?: string, limit: number = 20) {
    let query = supabase
        .from("club_announcements")
        .select(ANNOUNCEMENT_SELECT_QUERY)
        .eq("clubId", clubId)
        .eq("is_deleted", false)
        .order("createdAt", { ascending: false })
        .limit(limit);

    if (cursor) query = query.lt("createdAt", cursor);

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function postAnnouncement(
    clubId: number, 
    collegeId: number, 
    role: string, 
    message: string,
    authorId: { type: "student" | "faculty"; id: number }
) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("club_announcements")
        .insert({
            clubId,
            collegeId,
            message,
            authorStudentId: authorId.type === "student" ? authorId.id : null,
            authorFacultyId: authorId.type === "faculty" ? authorId.id : null,
            authorRole: role,
            createdAt: now,
            updatedAt: now
        })
        .select(ANNOUNCEMENT_SELECT_QUERY)
        .single();

    if (error) {
        console.error("Post Announcement Error:", error);
        throw error;
    }
    return data;
}

export async function updateAnnouncement(announcementId: number, newMessage: string) {
    const { error } = await supabase
        .from("club_announcements")
        .update({ message: newMessage, updatedAt: new Date().toISOString() })
        .eq("announcementId", announcementId);
    if (error) throw error;
}

export async function deleteAnnouncement(announcementId: number) {
    const { error } = await supabase
        .from("club_announcements")
        .update({ is_deleted: true, deletedAt: new Date().toISOString() })
        .eq("announcementId", announcementId);
    if (error) throw error;
}

export async function fetchSingleAnnouncement(announcementId: number) {
    const { data, error } = await supabase
        .from("club_announcements")
        .select(ANNOUNCEMENT_SELECT_QUERY)
        .eq("announcementId", announcementId)
        .single();

    if (error) throw error;
    return data;
}

export function subscribeToClubAnnouncements(
    clubId: number,
    callbacks: {
        onInsertBroadcast: (payload: any) => void;
        onPostgresFallback: (payload: any) => void; 
        onUpdate: (payload: any) => void;
    }
) {
    const channel = supabase.channel(`club_${clubId}_announcements_sync`, {
        config: { broadcast: { self: false, ack: false } } 
    })
    .on('broadcast', { event: 'new_announcement' }, ({ payload }) => {
        callbacks.onInsertBroadcast(payload);
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'club_announcements', filter: `clubId=eq.${clubId}` }, (payload) => {
        callbacks.onPostgresFallback(payload);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'club_announcements', filter: `clubId=eq.${clubId}` }, (payload) => {
        callbacks.onUpdate(payload.new);
    });

    channel.subscribe();
    return channel;
}

export function broadcastNewAnnouncement(channel: any, messagePayload: any) {
    if (channel) {
        channel.send({
            type: 'broadcast',
            event: 'new_announcement',
            payload: messagePayload,
        });
    }
}
