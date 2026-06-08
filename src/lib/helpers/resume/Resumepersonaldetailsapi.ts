import { supabase } from "@/lib/supabaseClient";

export type ResumePersonalDetailsRow = {
  resumePersonalDetailsId: number;
  studentId: number;
  collegeId: number;
  fullName: string;
  mobile: string;
  email: string;
  linkedInId?: string | null;
  currentCity: string;
  workStatus: "experienced" | "fresher" | "intern";
  is_deleted: boolean | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

// ─── FETCH ────────────────────────────────────────────────────────────────────

export async function fetchResumePersonalDetails(studentId: number) {
  const { data, error } = await supabase
    .from("resume_personal_details")
    .select(`
      resumePersonalDetailsId,
      studentId,
      collegeId,
      fullName,
      mobile,
      email,
      linkedInId,
      currentCity,
      workStatus,
      is_deleted,
      createdAt,
      updatedAt,
      deletedAt
    `)
    .eq("studentId", studentId)
    .is("deletedAt", null)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: true, data: null };
    }
    throw error;
  }

  return { success: true, data };
}

// ─── SAVE (INSERT or UPDATE) ──────────────────────────────────────────────────

export async function saveResumePersonalDetails(payload: {
  resumePersonalDetailsId?: number;
  studentId: number;
  collegeId: number;
  fullName: string;
  mobile: string;
  email: string;
  linkedInId?: string | null;
  currentCity: string;
  workStatus: "experienced" | "fresher" | "intern";
}) {
  const now = new Date().toISOString();

  // ── INSERT ────────────────────────────────────────────────────────────────
  if (!payload.resumePersonalDetailsId) {
    const insertPayload = {
      studentId: payload.studentId,
      collegeId: payload.collegeId,
      fullName: payload.fullName.trim(),
      mobile: payload.mobile.trim(),
      email: payload.email.trim(),
      linkedInId: payload.linkedInId?.trim() ? payload.linkedInId.trim() : null,
      currentCity: payload.currentCity.trim(),
      workStatus: payload.workStatus,
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from("resume_personal_details")
      .insert([insertPayload])
      .select("resumePersonalDetailsId")
      .single();

    if (error) {
      console.error("saveResumePersonalDetails insert error:", error);

      if (error.code === "23505") {
        if (error.message.includes("email"))
          return { success: false, error: "Email is already registered" };
        if (error.message.includes("linkedInId"))
          return { success: false, error: "LinkedIn profile already exists" };
        return { success: false, error: "Duplicate record already exists" };
      }

      return { success: false, error: error.message };
    }

    return {
      success: true,
      resumePersonalDetailsId: data.resumePersonalDetailsId,
    };
  }

  // ── UPDATE — only updatable fields, never touch studentId/collegeId ────────
  const updatePayload = {
    fullName: payload.fullName.trim(),
    mobile: payload.mobile.trim(),
    email: payload.email.trim(),
    linkedInId: payload.linkedInId?.trim() ? payload.linkedInId.trim() : null,
    currentCity: payload.currentCity.trim(),
    workStatus: payload.workStatus,
    updatedAt: now,
  };

  const { error } = await supabase
    .from("resume_personal_details")
    .update(updatePayload)
    .eq("resumePersonalDetailsId", payload.resumePersonalDetailsId);

  if (error) {
    console.error("saveResumePersonalDetails update error:", error);

    if (error.code === "23505") {
      if (error.message.includes("email"))
        return { success: false, error: "Email is already registered" };
      if (error.message.includes("linkedInId"))
        return { success: false, error: "LinkedIn profile already exists" };
      return { success: false, error: "Duplicate record already exists" };
    }

    return { success: false, error: error.message };
  }

  return {
    success: true,
    resumePersonalDetailsId: payload.resumePersonalDetailsId,
  };
}

// ─── SOFT DELETE ──────────────────────────────────────────────────────────────

export async function deleteResumePersonalDetails(
  resumePersonalDetailsId: number
) {
  const { error } = await supabase
    .from("resume_personal_details")
    .update({
      is_deleted: true,
      deletedAt: new Date().toISOString(),
    })
    .eq("resumePersonalDetailsId", resumePersonalDetailsId);

  if (error) {
    console.error("deleteResumePersonalDetails error:", error);
    return { success: false };
  }

  return { success: true };
}

// ─── FETCH ALL (admin use) ────────────────────────────────────────────────────

export async function fetchAllResumePersonalDetails() {
  const { data, error } = await supabase
    .from("resume_personal_details")
    .select(`
      resumePersonalDetailsId,
      studentId,
      collegeId,
      fullName,
      mobile,
      email,
      currentCity,
      workStatus,
      createdAt,
      updatedAt
    `)
    .is("deletedAt", null)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("fetchAllResumePersonalDetails error:", error);
    throw error;
  }

  return data ?? [];
}