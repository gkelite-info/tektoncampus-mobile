import { supabase } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResumePersonal = {
  fullName: string;
  mobile: string;
  email: string;
  linkedInId: string | null;
  currentCity: string;
  workStatus: string;
};

export type ResumeEducation = {
  resumeEducationDetailId: number;
  educationLevel: string;
  institutionName: string;
  board: string | null;
  percentage: number | null;
  courseName: string | null;
  specialization: string | null;
  cgpa: number | null;
  startYear: number | null;
  endYear: number | null;
  yearOfPassing: number | null;
};

export type ResumeSkillGroup = {
  categoryName: string;
  skills: string[];
};

export type ResumeInternship = {
  resumeInternshipId: number;
  organizationName: string;
  role: string;
  startDate: string;
  endDate: string | null;
  projectName: string | null;
  projectUrl: string | null;
  location: string | null;
  domain: string | null;
  description: string | null;
};

export type ResumeProject = {
  resumeProjectId: number;
  projectName: string;
  domain: string;
  startDate: string;
  endDate: string | null;
  projectUrl: string | null;
  toolsAndTechnologies: string[] | null;
  description: string | null;
};

export type ResumeCertification = {
  resumeCertificateId: number;
  certificationName: string;
  startDate: string;
  endDate: string | null;
};

export type ResumeAward = {
  awardId: number;
  awardName: string;
  issuedBy: string;
  dateReceived: string;
  category: string | null;
  description: string;
};

export type ResumeClub = {
  resumeClubCommitteeId: number;
  clubName: string;
  role: string;
  fromDate: string;
  toDate: string;
  description: string;
};

export type ResumeExam = {
  competitiveExamsId: number;
  examName: string;
  score: string;
};

export type ResumeEmployment = {
  employmentId: number;
  companyName: string;
  designation: string;
  experienceYears: number;
  experienceMonths: number;
  startDate: string;
  endDate: string | null;
  description: string | null;
};

export type ResumeAchievement = {
  resumeAcademicAchievementId: number;
  achievementName: string;
};

export type ResumeData = {
  personal: ResumePersonal | null;
  education: ResumeEducation[];
  skillGroups: ResumeSkillGroup[];
  internships: ResumeInternship[];
  projects: ResumeProject[];
  summary: string;
  resumeSummaryId: number | null;
  certifications: ResumeCertification[];
  awards: ResumeAward[];
  clubs: ResumeClub[];
  exams: ResumeExam[];
  employment: ResumeEmployment[];
  achievements: ResumeAchievement[];
  languages: string[];
};

const EDUCATION_PRIORITY: Record<string, number> = {
  phd: 5,
  masters: 4,
  postgraduate: 4,
  undergraduate: 3,
  diploma: 2,
  secondary: 1,
  primary: 0,
};

function sortEducationHighToPrimary(items: ResumeEducation[]): ResumeEducation[] {
  return [...items].sort((a, b) => {
    const levelDiff =
      (EDUCATION_PRIORITY[b.educationLevel?.toLowerCase()] ?? -1) -
      (EDUCATION_PRIORITY[a.educationLevel?.toLowerCase()] ?? -1);

    if (levelDiff !== 0) return levelDiff;

    const yearA = a.endYear ?? a.yearOfPassing ?? a.startYear ?? 0;
    const yearB = b.endYear ?? b.yearOfPassing ?? b.startYear ?? 0;
    if (yearB !== yearA) return yearB - yearA;

    return b.resumeEducationDetailId - a.resumeEducationDetailId;
  });
}

// ─── Main Fetcher ─────────────────────────────────────────────────────────────

export async function fetchAllResumeData(studentId: number): Promise<ResumeData> {
  const [
    { data: personal },
    { data: education },
    { data: skillRows },
    { data: internships },
    { data: projects },
    { data: summaryRow },
    { data: certifications },
    { data: awards },
    { data: clubs },
    { data: exams },
    { data: employment },
    { data: achievements },
    { data: langRow },
  ] = await Promise.all([
    supabase
      .from("resume_personal_details")
      .select("fullName, mobile, email, linkedInId, currentCity, workStatus")
      .eq("studentId", studentId)
      .eq("is_deleted", false)
      .maybeSingle(),

    supabase
      .from("resume_education_details")
      .select("resumeEducationDetailId, educationLevel, institutionName, board, percentage, courseName, specialization, cgpa, startYear, endYear, yearOfPassing")
      .eq("studentId", studentId)
      .eq("is_deleted", false)
      .order("resumeEducationDetailId", { ascending: true }),

    supabase
      .from("student_resume_skills")
      .select("resume_skills_master ( name, resume_skill_categories ( name ) )")
      .eq("studentId", studentId),

    supabase
      .from("resume_internships")
      .select("resumeInternshipId, organizationName, role, startDate, endDate, projectName, projectUrl, location, domain, description")
      .eq("studentId", studentId)
      .eq("is_deleted", false)
      .order("startDate", { ascending: false }),

    supabase
      .from("resume_project_details")
      .select("resumeProjectId, projectName, domain, startDate, endDate, projectUrl, toolsAndTechnologies, description")
      .eq("studentId", studentId)
      .eq("isdeleted", false)
      .order("startDate", { ascending: false }),

    supabase
      .from("resume_profile_summary")
      .select("resumeSummaryId, summary")
      .eq("studentId", studentId)
      .eq("is_deleted", false)
      .maybeSingle(),

    supabase
      .from("resume_certifications")
      .select("resumeCertificateId, certificationName, startDate, endDate")
      .eq("studentId", studentId)
      .eq("is_deleted", false)
      .order("startDate", { ascending: false }),

    supabase
      .from("resume_awards")
      .select("awardId, awardName, issuedBy, dateReceived, category, description")
      .eq("studentId", studentId)
      .eq("is_deleted", false),

    supabase
      .from("resume_club_committees")
      .select("resumeClubCommitteeId, clubName, role, fromDate, toDate, description")
      .eq("studentId", studentId)
      .eq("is_deleted", false),

    supabase
      .from("resume_competitive_exams")
      .select("competitiveExamsId, examName, score")
      .eq("studentId", studentId)
      .eq("is_deleted", false),

    supabase
      .from("resume_employment_details")
      .select("employmentId, companyName, designation, experienceYears, experienceMonths, startDate, endDate, description")
      .eq("studentId", studentId)
      .eq("is_deleted", false)
      .order("startDate", { ascending: false }),

    supabase
      .from("resume_academic_achievements")
      .select("resumeAcademicAchievementId, achievementName")
      .eq("studentId", studentId)
      .eq("is_deleted", false),

    supabase
      .from("student_resume_languages")
      .select("languageNames")
      .eq("studentId", studentId)
      .eq("is_deleted", false)
      .maybeSingle(),
  ]);

  // Group skills by category
  const categoryMap = new Map<string, string[]>();
  (skillRows ?? []).forEach((row: any) => {
    const name: string = row.resume_skills_master?.name;
    const cat: string = row.resume_skills_master?.resume_skill_categories?.name ?? "Other";
    if (!name) return;
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(name);
  });
  const skillGroups: ResumeSkillGroup[] = Array.from(categoryMap.entries()).map(
    ([categoryName, skills]) => ({ categoryName, skills })
  );

  return {
    personal: personal ?? null,
    education: sortEducationHighToPrimary(education ?? []),
    skillGroups,
    internships: internships ?? [],
    projects: projects ?? [],
    summary: summaryRow?.summary ?? "",
    resumeSummaryId: summaryRow?.resumeSummaryId ?? null,
    certifications: certifications ?? [],
    awards: awards ?? [],
    clubs: clubs ?? [],
    exams: exams ?? [],
    employment: employment ?? [],
    achievements: achievements ?? [],
    languages: langRow?.languageNames ?? [],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "Present";
  return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
