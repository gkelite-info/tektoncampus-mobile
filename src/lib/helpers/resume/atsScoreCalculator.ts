import { ResumeData } from "./Resumedatafetcher";

export type ATSBreakdown = {
  contact: number;       // 8pts  - contact info completeness
  hardSkills: number;    // 25pts - technical/domain skills
  softSkills: number;    // 8pts  - interpersonal skills
  summary: number;       // 15pts - keyword density + action verbs + length
  experience: number;    // 15pts - internships with descriptions & achievements
  education: number;     // 10pts - completeness of education
  certifications: number;// 7pts  - certs presence
  projects: number;      // 7pts  - projects with tools & descriptions
  extras: number;        // 5pts  - awards + exams + languages
};

export type ATSResult = {
  total: number;
  breakdown: ATSBreakdown;
  label: "Poor" | "Average" | "Good" | "Excellent";
  color: string;
  tips: string[]; // actionable improvement tips
};

// ─── Keyword Banks ────────────────────────────────────────────────────────────

const HARD_SKILL_KEYWORDS = [
  // Programming Languages
  "java","python","c++","c#","javascript","typescript","kotlin","swift","go","rust","php","ruby","scala","r programming",
  // Web
  "react","angular","vue","node.js","next.js","html","css","rest api","graphql","spring boot","django","flask","express",
  // Data & AI
  "machine learning","deep learning","data science","tensorflow","pytorch","numpy","pandas","sql","mongodb","postgresql","mysql",
  "data structures","algorithms","algorithm design","nlp","computer vision",
  // Cloud & DevOps
  "aws","azure","gcp","docker","kubernetes","git","ci/cd","jenkins","linux","microservices","terraform",
  // Engineering/Domain
  "circuit analysis","power systems","control systems","embedded systems","microcontrollers","digital logic design",
  "electrical design","switchgear","matlab","embedded","j2ee","spring","hibernate",
  // Tools
  "vs code","postman","jira","figma","tableau","power bi","excel","servicenow","active directory",
  // Other Tech
  "web development","mobile development","cybersecurity","networking","blockchain",
];

const SOFT_SKILL_KEYWORDS = [
  "communication","teamwork","leadership","problem solving","critical thinking","time management",
  "adaptability","creativity","collaboration","presentation","interpersonal","project management",
  "team management","analytical","attention to detail","multitasking","decision making",
  "conflict resolution","emotional intelligence","networking","negotiation","mentoring",
];

const ACTION_VERBS = [
  "developed","built","designed","implemented","optimized","led","managed","created","achieved",
  "improved","delivered","deployed","engineered","automated","collaborated","solved","analyzed",
  "reduced","increased","launched","spearheaded","executed","established","streamlined",
  "coordinated","mentored","trained","researched","presented","published","awarded",
];

const MEASURABLE_PATTERNS = [
  /\d+\s*%/,           // 30%
  /\d+\s*x\b/i,        // 3x
  /increased by/i,
  /reduced by/i,
  /improved by/i,
  /\$\s*\d+/,          // $500
  /\d+\s*(users|students|clients|projects|teams|members)/i,
  /top\s*\d+/i,        // top 5
  /\d+\s*(hours|days|weeks)/i,
  /saved\s*\d+/i,
  /rank(ed)?\s*\d+/i,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter(k => lower.includes(k.toLowerCase())).length;
}

function hasMeasurableAchievement(text: string): boolean {
  return MEASURABLE_PATTERNS.some(p => p.test(text));
}

function countActionVerbs(text: string): number {
  return matchKeywords(text, ACTION_VERBS);
}

// ─── Main Calculator ──────────────────────────────────────────────────────────

export function calculateATSScore(data: ResumeData): ATSResult {
  const b: ATSBreakdown = {
    contact: 0,
    hardSkills: 0,
    softSkills: 0,
    summary: 0,
    experience: 0,
    education: 0,
    certifications: 0,
    projects: 0,
    extras: 0,
  };

  const tips: string[] = [];

  // ── 1. CONTACT INFO (8pts) ────────────────────────────────────────────────
  // Real ATS: checks name, email, phone, location, LinkedIn as must-haves
  const p = data.personal;
  if (p) {
    if (p.fullName?.trim())     b.contact += 2;
    if (p.email?.trim())        b.contact += 2;
    if (p.mobile?.trim())       b.contact += 2;
    if (p.currentCity?.trim())  b.contact += 1;
    if (p.linkedInId?.trim())   b.contact += 1;
  }
  if (b.contact < 8) tips.push("Complete all contact details including LinkedIn profile.");

  // ── 2. HARD SKILLS (25pts) ────────────────────────────────────────────────
  // Real ATS: hard skills are most heavily weighted, keyword matching against job roles
  const hardSkillsList = data.skillGroups
    .filter(g => {
      const cat = g.categoryName?.toLowerCase() ?? "";
      // exclude soft skills categories
      return !cat.includes("soft") && !cat.includes("personal") && !cat.includes("interpersonal");
    })
    .flatMap(g => g.skills.map(s => s.toLowerCase()));

  const hardSkillsText = hardSkillsList.join(" ");
  const recognizedHardSkills = matchKeywords(hardSkillsText, HARD_SKILL_KEYWORDS);
  const totalHardSkills = hardSkillsList.length;

  // Quantity check (10pts)
  if (totalHardSkills >= 3)  b.hardSkills += 3;
  if (totalHardSkills >= 6)  b.hardSkills += 3;
  if (totalHardSkills >= 10) b.hardSkills += 2;
  if (totalHardSkills >= 15) b.hardSkills += 2;

  // Keyword relevance check (15pts) — this is the real ATS differentiator
  if (recognizedHardSkills >= 2)  b.hardSkills += 3;
  if (recognizedHardSkills >= 5)  b.hardSkills += 3;
  if (recognizedHardSkills >= 8)  b.hardSkills += 3;
  if (recognizedHardSkills >= 12) b.hardSkills += 3;
  if (recognizedHardSkills >= 16) b.hardSkills += 3;

  if (totalHardSkills < 6) tips.push("Add more technical hard skills (aim for 10+).");
  if (recognizedHardSkills < 5) tips.push("Include industry-standard keywords like AWS, Python, Git, Docker.");

  // ── 3. SOFT SKILLS (8pts) ─────────────────────────────────────────────────
  // Real ATS: checks for interpersonal/behavioral keywords
  const softSkillsList = data.skillGroups
    .filter(g => {
      const cat = g.categoryName?.toLowerCase() ?? "";
      return cat.includes("soft") || cat.includes("personal") || cat.includes("interpersonal");
    })
    .flatMap(g => g.skills.map(s => s.toLowerCase()));

  // Also check all skills against soft keyword bank
  const allSkillsText = data.skillGroups.flatMap(g => g.skills).join(" ").toLowerCase();
  const recognizedSoftSkills = matchKeywords(allSkillsText, SOFT_SKILL_KEYWORDS);

  if (recognizedSoftSkills >= 1) b.softSkills += 3;
  if (recognizedSoftSkills >= 3) b.softSkills += 3;
  if (recognizedSoftSkills >= 5) b.softSkills += 2;

  if (recognizedSoftSkills < 2) tips.push("Add soft skills like Communication, Leadership, Problem Solving.");

  // ── 4. SUMMARY (15pts) ───────────────────────────────────────────────────
  // Real ATS: summary must have keywords, action verbs, measurable results, adequate length
  const summaryText = data.summary?.trim() ?? "";
  const wordCount = summaryText.split(/\s+/).filter(Boolean).length;

  // Length (3pts)
  if (wordCount >= 20) b.summary += 1;
  if (wordCount >= 40) b.summary += 1;
  if (wordCount >= 60) b.summary += 1;

  // Hard keywords in summary (5pts) — keyword placement at top = higher ATS weight
  const summaryHardMatches = matchKeywords(summaryText, HARD_SKILL_KEYWORDS);
  if (summaryHardMatches >= 1) b.summary += 2;
  if (summaryHardMatches >= 3) b.summary += 3;

  // Action verbs in summary (4pts)
  const summaryVerbs = countActionVerbs(summaryText);
  if (summaryVerbs >= 1) b.summary += 2;
  if (summaryVerbs >= 3) b.summary += 2;

  // Measurable achievement in summary (3pts)
  if (hasMeasurableAchievement(summaryText)) b.summary += 3;

  if (!summaryText) tips.push("Add a professional summary — it heavily boosts ATS keyword matching.");
  else if (wordCount < 40) tips.push("Expand your summary to 40–80 words with relevant tech keywords.");
  else if (summaryHardMatches < 2) tips.push("Include your key technical skills inside your summary.");
  else if (!hasMeasurableAchievement(summaryText)) tips.push("Add a measurable achievement in your summary (e.g., 'built 3 projects', 'top 5% in class').");

  // ── 5. EXPERIENCE / INTERNSHIPS (15pts) ───────────────────────────────────
  // Real ATS: experience quality matters — descriptions, tools used, measurable outcomes
  const internships = data.internships ?? [];

  if (internships.length >= 1) b.experience += 4;
  if (internships.length >= 2) b.experience += 2;

  const allInternDesc = internships.map(i => i.description ?? "").join(" ");

  // Description quality
  if (allInternDesc.trim().length > 30)  b.experience += 2;
  if (allInternDesc.trim().length > 100) b.experience += 1;

  // Action verbs in descriptions
  const internVerbs = countActionVerbs(allInternDesc);
  if (internVerbs >= 1) b.experience += 2;
  if (internVerbs >= 3) b.experience += 2;

  // Measurable achievements
  if (hasMeasurableAchievement(allInternDesc)) b.experience += 2;

  if (internships.length === 0) tips.push("Add internships or work experience — it's heavily weighted by ATS.");
  else if (!hasMeasurableAchievement(allInternDesc)) tips.push("Add numbers to your internship descriptions (e.g., 'reduced load time by 40%').");
  else if (internVerbs < 2) tips.push("Use strong action verbs in internship descriptions (developed, built, led...).");

  // ── 6. EDUCATION (10pts) ─────────────────────────────────────────────────
  // Real ATS: checks institution, degree, graduation year, GPA/percentage
  const edu = data.education ?? [];

  if (edu.length > 0)                                                     b.education += 3;
  if (edu.length >= 2)                                                     b.education += 1;
  if (edu.some(e => e.institutionName?.trim()))                            b.education += 1;
  if (edu.some(e => e.cgpa != null || e.percentage != null))               b.education += 2;
  if (edu.some(e => e.yearOfPassing != null || e.endYear != null))         b.education += 2;
  if (edu.some(e => e.board?.trim() || e.educationLevel?.trim()))          b.education += 1;

  if (edu.length === 0) tips.push("Add your education details.");
  else if (!edu.some(e => e.cgpa != null || e.percentage != null)) tips.push("Add your CGPA or percentage to education.");

  // ── 7. CERTIFICATIONS (7pts) ─────────────────────────────────────────────
  // Real ATS: certifications signal credibility, especially tech certs
  const certs = data.certifications ?? [];

  if (certs.length >= 1) b.certifications += 4;
  if (certs.length >= 2) b.certifications += 2;
  if (certs.length >= 3) b.certifications += 1;

  if (certs.length === 0) tips.push("Add certifications (e.g., AWS, Google, Coursera) to boost credibility.");

  // ── 8. PROJECTS (7pts) ───────────────────────────────────────────────────
  // Real ATS: projects must have descriptions and tools used
  const projects = data.projects ?? [];

  if (projects.length >= 1) b.projects += 2;
  if (projects.length >= 2) b.projects += 1;

  const allProjectDesc = projects.map(pr => pr.description ?? "").join(" ");
  const projectTools = projects.some(pr => (pr.toolsAndTechnologies?.length ?? 0) > 0);


  if (allProjectDesc.trim().length > 30)       b.projects += 1;
  if (hasMeasurableAchievement(allProjectDesc)) b.projects += 1;
  if (projectTools)                             b.projects += 1;
  if (countActionVerbs(allProjectDesc) >= 2)   b.projects += 1;

  if (projects.length === 0) tips.push("Add at least 2 projects with descriptions and tech stack.");
  else if (!projectTools) tips.push("Mention tools/technologies used in each project.");

  // ── 9. EXTRAS (5pts) ─────────────────────────────────────────────────────
  // Awards, exams, languages — bonus signals
  const awards = data.awards ?? [];
  const exams  = data.exams ?? [];
  const langs  = data.languages ?? [];

  if (awards.length >= 1) b.extras += 2;
  if (exams.length >= 1)  b.extras += 2;
  if (langs.length >= 1)  b.extras += 1;

  // ─── Total & Label ────────────────────────────────────────────────────────
  const total = Math.min(100, Object.values(b).reduce((a, v) => a + v, 0));

  let label: ATSResult["label"] = "Poor";
  let color = "#ef4444";
  if (total >= 40) { label = "Average";   color = "#f97316"; }
  if (total >= 60) { label = "Good";      color = "#eab308"; }
  if (total >= 80) { label = "Excellent"; color = "#22c55e"; }

  return { total, breakdown: b, label, color, tips: tips.slice(0, 3) };
}