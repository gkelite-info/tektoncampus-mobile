import { supabase } from "@/lib/supabaseClient";

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant"
];

async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 800
): Promise<string> {
  if (!GROQ_API_KEY) {
      console.error("Missing EXPO_PUBLIC_GROQ_API_KEY");
      return "";
  }

  for (const model of GROQ_MODELS) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        })
      });
      
      const res = await response.json();
      const text = res.choices?.[0]?.message?.content?.replace(/```/g, "").trim() ?? "";
      if (text && text.length > 20) return text;
    } catch (err: any) {
      if (err?.status === 429) continue;
    }
  }
  return "";
}

async function fetchStudentData(studentId: number) {
  const [
    { data: personal },
    { data: education },
    { data: skills },
    { data: internships },
    { data: projects },
    { data: employment },
    { data: awards },
    { data: certifications },
    { data: achievements },
    { data: profileSummary },
  ] = await Promise.all([
    supabase
      .from("resume_personal_details")
      .select("fullName, currentCity, workStatus")
      .eq("studentId", studentId)
      .eq("is_deleted", false)
      .maybeSingle(),
    supabase
      .from("resume_education_details")
      .select("educationLevel, institutionName, courseName, specialization, cgpa, percentage, startYear, endYear, yearOfPassing")
      .eq("studentId", studentId)
      .eq("is_deleted", false),
    supabase
      .from("student_resume_skills")
      .select("resume_skills_master ( name )")
      .eq("studentId", studentId),
    supabase
      .from("resume_internships")
      .select("organizationName, role, domain, description, startDate, endDate")
      .eq("studentId", studentId)
      .eq("is_deleted", false),
    supabase
      .from("resume_project_details")
      .select("projectName, domain, toolsAndTechnologies, description")
      .eq("studentId", studentId)
      .eq("isdeleted", false),
    supabase
      .from("resume_employment_details")
      .select("companyName, designation, experienceYears, experienceMonths")
      .eq("studentId", studentId)
      .eq("is_deleted", false),
    supabase
      .from("resume_awards")
      .select("awardName, issuedBy, category")
      .eq("studentId", studentId)
      .eq("is_deleted", false),
    supabase
      .from("resume_certifications")
      .select("certificationName")
      .eq("studentId", studentId)
      .eq("is_deleted", false),
    supabase
      .from("resume_academic_achievements")
      .select("achievementName")
      .eq("studentId", studentId)
      .eq("is_deleted", false),
    supabase
      .from("resume_profile_summary")
      .select("resumeSummaryId, summary")
      .eq("studentId", studentId)
      .eq("is_deleted", false)
      .maybeSingle(),
  ]);

  return {
    name: personal?.fullName,
    city: personal?.currentCity,
    workStatus: personal?.workStatus,
    profileSummary: profileSummary?.summary ?? "",
    resumeSummaryId: profileSummary?.resumeSummaryId ?? null,
    education,
    skills: skills?.map((s: any) => s.resume_skills_master?.name).filter(Boolean),
    internships,
    projects,
    employment,
    awards,
    certifications,
    achievements,
  };
}

const SUMMARY_SYSTEM_PROMPT = `
You are an expert resume writer specializing in ATS-friendly resumes.
Generate exactly 5 distinct professional resume summaries.
Each summary must be 3-4 lines, unique in tone and focus.
Return ONLY a JSON array of 5 strings. No explanation, no markdown, no labels.
Example: ["Summary 1 text...", "Summary 2 text...", ...]
`;

export async function generateFiveProfileSummaries(
  studentId: number,
  jobDescription?: string
): Promise<string[]> {
  if (!studentId) return [];

  try {
    const studentData = await fetchStudentData(studentId);

    const prompt = `
Student Profile:
${JSON.stringify(studentData, null, 2)}

${jobDescription ? `Target Job Description:\n${jobDescription}\n\nGenerate summaries tailored to this JD.` : "Generate general professional summaries."}

Return ONLY a JSON array of exactly 5 resume summary strings.
`;

    const raw = await callGroq(SUMMARY_SYSTEM_PROMPT, prompt, 1000);

    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 5).map((s: string) => s.trim());
      }
    }

    const lines = raw
      .split(/\n+/)
      .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((l) => l.length > 30);

    return lines.slice(0, 5);
  } catch (error) {
    console.error("generateFiveProfileSummaries error:", error);
    return [];
  }
}

export async function suggestSkillsFromJDWithDemand(
    jd: string,
    availableSkills: string[]
  ): Promise<{
    matching: Array<{ name: string; demand: "high" | "medium" }>;
    missing: Array<{ name: string; demand: "high" | "medium" }>;
  }> {
    try {
      const systemPrompt = `You are a senior technical recruiter. Analyze a candidate's skills against a JD.
  Return ONLY a JSON object. No explanation. No markdown.`;
  
      const userPrompt = `=== JOB DESCRIPTION ===
  ${jd}
  
  === CANDIDATE'S AVAILABLE SKILLS ===
  ${availableSkills.join("\n")}
  
  === TASK ===
  Split into two groups:
  1. "matching": Skills from candidate's list relevant to this JD
  2. "missing": Important skills JD needs that are NOT in candidate's list at all
  
  Demand levels: "high" or "medium".
  Return ONLY this exact JSON:
  {
    "matching": [{"name": "Python", "demand": "high"}],
    "missing": [{"name": "Node.js", "demand": "medium"}]
  }`;
  
      const raw = await callGroq(systemPrompt, userPrompt, 1000);
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          matching: Array.isArray(parsed.matching) ? parsed.matching : [],
          missing: Array.isArray(parsed.missing) ? parsed.missing : [],
        };
      }
      return { matching: [], missing: [] };
    } catch (error) {
      console.error("suggestSkillsFromJDWithDemand error:", error);
      return { matching: [], missing: [] };
    }
}
