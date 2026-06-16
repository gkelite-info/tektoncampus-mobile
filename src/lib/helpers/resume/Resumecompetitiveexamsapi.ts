import { supabase } from "@/lib/supabaseClient";

const now = () => new Date().toISOString();

export interface CompetitiveExamPayload {
  studentId: number;
  examName: string;
  score: number;
}


export const getCompetitiveExams = async (studentId: number) => {
  const { data, error } = await supabase
    .from("resume_competitive_exams")
    .select("*")
    .eq("studentId", studentId)
    .eq("is_deleted", false);

  if (error) {
    console.error("[getCompetitiveExams]", JSON.stringify(error));
    throw new Error(error.message);
  }

  return data ?? [];
};


export const upsertCompetitiveExams = async (payload: CompetitiveExamPayload[]) => {
  const timestamp = now();

  const rows = payload.map((exam) => ({
    studentId: exam.studentId,
    examName: exam.examName,
    score: exam.score,
    is_deleted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  const { data, error } = await supabase
    .from("resume_competitive_exams")
    .upsert(rows, {
      onConflict: "studentId,examName",   
      ignoreDuplicates: false,            
    })
    .select();

  if (error) {
    console.error("[upsertCompetitiveExams]", JSON.stringify(error));
    throw new Error(error.message);
  }

  return data;
};


export const softDeleteExam = async (studentId: number, examName: string) => {
  const { error } = await supabase
    .from("resume_competitive_exams")
    .update({
      is_deleted: true,
      deletedAt: now(),
      updatedAt: now(),
    })
    .eq("studentId", studentId)
    .eq("examName", examName);

  if (error) {
    console.error("[softDeleteExam]", JSON.stringify(error));
    throw new Error(error.message);
  }

  return { success: true };
};