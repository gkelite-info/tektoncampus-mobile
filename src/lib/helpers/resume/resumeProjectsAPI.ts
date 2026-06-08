import { supabase } from "@/lib/supabaseClient";

export interface ResumeProject {
  resumeProjectId?: number;
  studentId: number;
  projectName: string;
  domain: string;
  startDate: string;
  endDate?: string | null;
  projectUrl?: string | null;
  toolsAndTechnologies?: string[] | null;
  description?: string | null;
  isdeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchResumeProjects(studentId: number): Promise<ResumeProject[]> {
  const { data, error } = await supabase
    .from("resume_project_details")
    .select("*")
    .eq("studentId", studentId)
    .eq("isdeleted", false)
    .order("createdAt", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function upsertResumeProject(
  payload: ResumeProject
): Promise<{ resumeProjectId: number }> {
  const now = new Date().toISOString();

  if (!payload.studentId) throw new Error("studentId is required");

  const startDate = new Date(payload.startDate).toISOString();
  const endDate = payload.endDate ? new Date(payload.endDate).toISOString() : null;

  if (payload.resumeProjectId) {
    const { data, error } = await supabase
      .from("resume_project_details")
      .update({
        projectName: payload.projectName,
        domain: payload.domain,
        startDate,
        endDate,
        projectUrl: payload.projectUrl || null,
        toolsAndTechnologies: payload.toolsAndTechnologies ?? [],
        description: payload.description || null,
        isdeleted: false,
        updatedAt: now,
      })
      .eq("resumeProjectId", payload.resumeProjectId)
      .select("resumeProjectId")
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("resume_project_details")
    .insert({
      studentId: Number(payload.studentId),
      projectName: payload.projectName,
      domain: payload.domain,
      startDate,
      endDate,
      projectUrl: payload.projectUrl || null,
      toolsAndTechnologies: payload.toolsAndTechnologies ?? [],
      description: payload.description || null,
      isdeleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .select("resumeProjectId")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteResumeProject(resumeProjectId: number): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("resume_project_details")
    .update({ isdeleted: true, deletedAt: now, updatedAt: now })
    .eq("resumeProjectId", resumeProjectId);

  if (error) throw error;
}