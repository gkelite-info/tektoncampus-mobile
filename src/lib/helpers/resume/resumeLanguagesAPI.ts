import { supabase } from "@/lib/supabaseClient";

export async function fetchResumeLanguages(studentId: number): Promise<string[]> {
  const { data, error } = await supabase
    .from("student_resume_languages")
    .select('"languageNames"')
    .eq("studentId", studentId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error;

  return data?.languageNames ?? [];
}

export async function upsertResumeLanguages(
  studentId: number,
  languages: string[]
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("student_resume_languages")
    .upsert(
      {
        studentId,
        languageNames: languages,
        is_deleted: false,
        createdAt: now,
        updatedAt: now,
      },
      { onConflict: "studentId" }
    );

  if (error) throw error;
}