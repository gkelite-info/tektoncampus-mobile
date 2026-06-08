import { supabase } from "@/lib/supabaseClient";

export interface ClubPayload {
  studentId: number;
  clubName: string;
  role: string;
  fromDate: string; // ISO string for timestamptz
  toDate: string;
  description: string;
}

export async function getClubs(studentId: number) {
  const { data, error } = await supabase
    .from("resume_club_committees")
    .select("resumeClubCommitteeId, clubName, role, fromDate, toDate, description")
    .eq("studentId", studentId)
    .eq("is_deleted", false)
    .order("resumeClubCommitteeId", { ascending: true });

  if (error) {
    console.error("getClubs error:", error.message);
    throw error;
  }
  return data ?? [];
}

export async function insertClub(payload: ClubPayload): Promise<{ resumeClubCommitteeId: number }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("resume_club_committees")
    .insert({
      studentId: payload.studentId,
      clubName: payload.clubName,
      role: payload.role,
      fromDate: payload.fromDate,
      toDate: payload.toDate,
      description: payload.description,
      is_deleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .select("resumeClubCommitteeId")
    .single();

  if (error) {
    console.error("insertClub error:", error.message);
    throw error;
  }
  return data;
}

export async function updateClub(resumeClubCommitteeId: number, payload: Partial<ClubPayload>) {
  const { error } = await supabase
    .from("resume_club_committees")
    .update({ ...payload, updatedAt: new Date().toISOString() })
    .eq("resumeClubCommitteeId", resumeClubCommitteeId)
    .eq("is_deleted", false);

  if (error) {
    console.error("updateClub error:", error.message);
    throw error;
  }
}

export async function deleteClub(resumeClubCommitteeId: number) {
  const { error } = await supabase
    .from("resume_club_committees")
    .update({ is_deleted: true, deletedAt: new Date().toISOString() })
    .eq("resumeClubCommitteeId", resumeClubCommitteeId);

  if (error) {
    console.error("deleteClub error:", error.message);
    throw error;
  }
}