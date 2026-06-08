import { supabase } from "@/lib/supabaseClient";

const now = () => new Date().toISOString();

export type EducationLevel = "primary" | "secondary" | "undergraduate" | "masters" | "phd";

async function fetchEducation(studentId: number, level: EducationLevel) {
  const { data, error } = await supabase
    .from("resume_education_details")
    .select("*")
    .eq("studentId", studentId)
    .eq("educationLevel", level)
    .is("deletedAt", null)
    .maybeSingle();

  if (error) {
    console.error(`[fetchEducation] level=${level}`, JSON.stringify(error));
    return { success: false, data: null };
  }
  return { success: true, data };
}

// ONLY THIS PART UPDATED — rest unchanged

async function saveEducation(payload: Record<string, any>, level: EducationLevel) {
  const timestamp = now();
  const id = payload.resumeEducationDetailId;

  // ✅ ADDED LOGIC (DO NOT REMOVE EXISTING)
  const isPrimary = level === "primary";

  const startYear = !isPrimary && payload.startDate
    ? payload.startDate.slice(0, 10)
    : undefined;

  const endYear = !isPrimary && payload.endDate
    ? payload.endDate.slice(0, 10)
    : undefined;


  const yearOfPassing = isPrimary && payload.yearOfPassing
    ? Number(payload.yearOfPassing)   
    : undefined;

  if (id != null) {
    const {
      resumeEducationDetailId,
      studentId,
      collegeId,
      educationLevel,
      startDate,
      endDate,
      ...updatable
    } = payload;

    const { error } = await supabase
      .from("resume_education_details")
      .update({
        ...updatable,
        ...(startYear !== undefined ? { startYear } : {}),
        ...(endYear !== undefined ? { endYear } : {}),
        ...(yearOfPassing !== undefined ? { yearOfPassing } : {}), // ✅ added
        updatedAt: timestamp,
      })
      .eq("resumeEducationDetailId", id);

    if (error) {
      console.error(`[saveEducation/update] level=${level}`, JSON.stringify(error));
      return { success: false };
    }
    return { success: true, id };
  }

  const {
    resumeEducationDetailId,
    startDate,
    endDate,
    ...insertPayload
  } = payload;

  const { data, error } = await supabase
    .from("resume_education_details")
    .insert([{
      ...insertPayload,
      ...(startYear !== undefined ? { startYear } : {}),
      ...(endYear !== undefined ? { endYear } : {}),
      ...(yearOfPassing !== undefined ? { yearOfPassing } : {}), // ✅ added
      educationLevel: level,
      is_deleted: false,
      deletedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }])
    .select("resumeEducationDetailId")
    .single();

  if (error) {
    console.error(`[saveEducation/insert] level=${level}`, JSON.stringify(error));
    return { success: false };
  }
  return { success: true, id: data.resumeEducationDetailId };
}


async function deleteEducation(resumeEducationDetailId: number) {
  const { error } = await supabase
    .from("resume_education_details")
    .update({ is_deleted: true, deletedAt: now(), updatedAt: now() })
    .eq("resumeEducationDetailId", resumeEducationDetailId);

  if (error) {
    console.error("[deleteEducation]", JSON.stringify(error));
    return { success: false };
  }
  return { success: true };
}

export const resumePrimaryEducationAPI = {
  fetch: (studentId: number) => fetchEducation(studentId, "primary"),
  save: (payload: {
    resumeEducationDetailId?: number;
    studentId: number;
    collegeId: number;
    institutionName: string;
    board?: string;
    mediumOfStudy?: string;
    yearOfPassing?: number | string;
    cgpa?: number;
    startDate?: string;
    endDate?: string;
    location?: string;
  }) => saveEducation(payload, "primary"),
  delete: (resumeEducationDetailId: number) => deleteEducation(resumeEducationDetailId),
};

export const resumeSecondaryEducationAPI = {
  fetch: (studentId: number) => fetchEducation(studentId, "secondary"),
  save: (payload: {
    resumeEducationDetailId?: number;
    studentId: number;
    collegeId: number;
    institutionName: string;
    board?: string;
    mediumOfStudy?: string;
    yearOfPassing?: number;
    specialization?: string;
    startDate?: string;
    endDate?: string;
    percentage?: number;
    location?: string;
  }) => saveEducation(payload, "secondary"),
  delete: (resumeEducationDetailId: number) => deleteEducation(resumeEducationDetailId),
};

export const resumeUndergraduateEducationAPI = {
  fetch: (studentId: number) => fetchEducation(studentId, "undergraduate"),
  save: (payload: {
    resumeEducationDetailId?: number;
    studentId: number;
    collegeId: number;
    institutionName: string;
    courseName?: string;
    specialization?: string;
    cgpa?: number;
    courseType?: string;
    startDate?: string;
    endDate?: string;
  }) => saveEducation(payload, "undergraduate"),
  delete: (resumeEducationDetailId: number) => deleteEducation(resumeEducationDetailId),
};

export const resumePhdEducationAPI = {
  fetch: (studentId: number) => fetchEducation(studentId, "phd"),
  save: (payload: {
    resumeEducationDetailId?: number;
    studentId: number;
    collegeId: number;
    institutionName: string;
    researchArea?: string;
    supervisorName?: string;
    startDate?: string;
    endDate?: string;
  }) => saveEducation(payload, "phd"),
  delete: (resumeEducationDetailId: number) => deleteEducation(resumeEducationDetailId),
};

export const resumeMastersEducationAPI = {
  fetch: (studentId: number) => fetchEducation(studentId, "masters"),
  save: (payload: {
    resumeEducationDetailId?: number;
    studentId: number;
    collegeId: number;
    institutionName: string;
    courseName?: string;
    specialization?: string;
    cgpa?: number;
    courseType?: string;
    startDate?: string;
    endDate?: string;
  }) => saveEducation(payload, "masters"),
  delete: (resumeEducationDetailId: number) => deleteEducation(resumeEducationDetailId),
};