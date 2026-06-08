import { supabase } from "@/lib/supabaseClient";

export interface ResumeInternship {
  resumeInternshipId?: number;
  studentId: number;
  organizationName: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  projectName?: string | null;
  projectUrl?: string | null;
  location?: string | null;
  domain?: string | null;
  description?: string | null;
}

export async function fetchResumeInternships(studentId: number): Promise<ResumeInternship[]> {
  const { data, error } = await supabase
    .from("resume_internships")
    .select("*")
    .eq("studentId", studentId)
    .eq("is_deleted", false)
    .order("createdAt", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function upsertResumeInternship(
  payload: ResumeInternship
): Promise<{ resumeInternshipId: number }> {
  const now = new Date().toISOString();

  if (!payload.studentId) {
    console.error("❌ studentId is missing or falsy:", payload.studentId);
    throw new Error("studentId is required");
  }

  let startDate: string;
  let endDate: string | null;

  try {
    startDate = new Date(payload.startDate).toISOString();
  } catch (err) {
    console.error("❌ Failed to convert startDate:", payload.startDate, err);
    throw err;
  }

  try {
    endDate = payload.endDate ? new Date(payload.endDate).toISOString() : null;
  } catch (err) {
    console.error("❌ Failed to convert endDate:", payload.endDate, err);
    throw err;
  }

  if (payload.resumeInternshipId) {
    const updatePayload = {
      organizationName: payload.organizationName,
      role: payload.role,
      startDate,
      endDate,
      projectName: payload.projectName || null,
      projectUrl: payload.projectUrl || null,
      location: payload.location || null,
      domain: payload.domain || null,
      description: payload.description || null,
      is_deleted: false,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from("resume_internships")
      .update(updatePayload)
      .eq("resumeInternshipId", payload.resumeInternshipId)
      .select("resumeInternshipId")
      .single();

    if (error) throw error;
    return data;
  }

  const insertPayload = {
    studentId: Number(payload.studentId),
    organizationName: payload.organizationName,
    role: payload.role,
    startDate,
    endDate,
    projectName: payload.projectName || null,
    projectUrl: payload.projectUrl || null,
    location: payload.location || null,
    domain: payload.domain || null,
    description: payload.description || null,
    is_deleted: false,
    createdAt: now,
    updatedAt: now,
  };

  const { data, error } = await supabase
    .from("resume_internships")
    .insert(insertPayload)
    .select("resumeInternshipId")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteResumeInternship(
  resumeInternshipId: number
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("resume_internships")
    .update({ is_deleted: true, deletedAt: now, updatedAt: now })
    .eq("resumeInternshipId", resumeInternshipId);

  if (error) throw error;
}