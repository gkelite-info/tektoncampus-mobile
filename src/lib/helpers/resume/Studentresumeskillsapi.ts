import { supabase } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SkillCategory = {
  resumeSkillCategoryId: number;
  name: string;
};

export type SkillMaster = {
  resumeSkillId: number;
  resumeSkillCategoryId: number;
  name: string;
};

export type GroupedSkills = {
  category: SkillCategory;
  skills: SkillMaster[];
};

// ─── Fetch all skill categories ───────────────────────────────────────────────

export async function getSkillCategories(): Promise<SkillCategory[]> {
  const { data, error } = await supabase
    .from("resume_skill_categories")
    .select("resumeSkillCategoryId, name")
    .eq("is_deleted", false)
    .order("resumeSkillCategoryId", { ascending: true });

  if (error) {
    console.error("getSkillCategories error:", error);
    throw error;
  }
  return data ?? [];
}

// ─── Fetch all skills from master ─────────────────────────────────────────────

export async function getAllSkillsMaster(): Promise<SkillMaster[]> {
  const { data, error } = await supabase
    .from("resume_skills_master")
    .select("resumeSkillId, resumeSkillCategoryId, name")
    .eq("is_deleted", false)
    .order("name", { ascending: true });

  if (error) {
    console.error("getAllSkillsMaster error:", error);
    throw error;
  }
  return data ?? [];
}

// ─── Fetch skills grouped by category ────────────────────────────────────────

export async function getGroupedSkills(): Promise<GroupedSkills[]> {
  const [categories, skills] = await Promise.all([
    getSkillCategories(),
    getAllSkillsMaster(),
  ]);

  return categories.map((cat) => ({
    category: cat,
    skills: skills.filter(
      (s) => s.resumeSkillCategoryId === cat.resumeSkillCategoryId
    ),
  }));
}

// ─── Fetch student's saved skill IDs ─────────────────────────────────────────

export async function getStudentResumeSkillIds(
  studentId: number
): Promise<number[]> {
  const { data, error } = await supabase
    .from("student_resume_skills")
    .select("resumeSkillId")
    .eq("studentId", studentId);

  if (error) {
    console.error("getStudentResumeSkillIds error:", error);
    throw error;
  }
  return (data ?? []).map((r: { resumeSkillId: number }) => r.resumeSkillId);
}

// ─── Save student skills (replace all) ───────────────────────────────────────

export async function saveStudentResumeSkills(
  studentId: number,
  skillIds: number[]
): Promise<void> {
  // 1. Delete existing
  const { error: deleteError } = await supabase
    .from("student_resume_skills")
    .delete()
    .eq("studentId", studentId);

  if (deleteError) {
    console.error("saveStudentResumeSkills delete error:", deleteError);
    throw deleteError;
  }

  if (skillIds.length === 0) return;

  // 2. Insert new
  const now = new Date().toISOString();
  const rows = skillIds.map((resumeSkillId) => ({
    studentId,
    resumeSkillId,
    createdAt: now,
    updatedAt: now,
  }));

  const { error: insertError } = await supabase
    .from("student_resume_skills")
    .insert(rows);

  if (insertError) {
    console.error("saveStudentResumeSkills insert error:", insertError);
    throw insertError;
  }
}