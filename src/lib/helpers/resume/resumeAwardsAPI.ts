import { supabase } from "@/lib/supabaseClient";

export interface AwardPayload {
  studentId: number;
  awardName: string;
  issuedBy: string;
  dateReceived: string; // YYYY-MM-DD (date column)
  category: string;
  description: string;
}

export async function getAwards(studentId: number) {
  const { data, error } = await supabase
    .from("resume_awards")
    .select("awardId, awardName, issuedBy, dateReceived, category, description")
    .eq("studentId", studentId)
    .eq("is_deleted", false)
    .order("awardId", { ascending: true });

  if (error) {
    console.error("getAwards error:", error.message);
    throw error;
  }
  return data ?? [];
}

export async function insertAward(payload: AwardPayload): Promise<{ awardId: number }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("resume_awards")
    .insert({
      studentId: payload.studentId,
      awardName: payload.awardName,
      issuedBy: payload.issuedBy,
      dateReceived: payload.dateReceived,
      category: payload.category,
      description: payload.description,
      is_deleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .select("awardId")
    .single();

  if (error) {
    console.error("insertAward error:", error.message);
    throw error;
  }
  return data;
}

export async function updateAward(awardId: number, payload: Partial<AwardPayload>) {
  const { error } = await supabase
    .from("resume_awards")
    .update({ ...payload, updatedAt: new Date().toISOString() })
    .eq("awardId", awardId)
    .eq("is_deleted", false);

  if (error) {
    console.error("updateAward error:", error.message);
    throw error;
  }
}

export async function deleteAward(awardId: number) {
  const { error } = await supabase
    .from("resume_awards")
    .update({ is_deleted: true, deletedAt: new Date().toISOString() })
    .eq("awardId", awardId);

  if (error) {
    console.error("deleteAward error:", error.message);
    throw error;
  }
}