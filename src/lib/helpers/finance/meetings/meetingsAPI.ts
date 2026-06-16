import { supabase } from "@/lib/supabaseClient";

export async function fetchFacultyFinanceMeetings(params: {
  role?: string;
  type?: "upcoming" | "previous";
  page?: number;
  limit?: number;
  collegeBranchId?: number;
  sectionIds?: number[];
  academicYearIds?: number[];
}) {
  const {
    role = "Faculty",
    type = "upcoming",
    page = 1,
    limit = 10,
    collegeBranchId,
    sectionIds,
    academicYearIds,
  } = params;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().split(" ")[0];

  let query = supabase
    .from("finance_meetings")
    .select(
      `
            financeMeetingId, title, description, role, date, fromTime, toTime, meetingLink, isActive, deletedAt,
            finance_meetings_sections!inner (
                financeMeetingSectionsId,
                college_education ( collegeEducationType ),
                college_branch ( collegeBranchCode ),
                college_sections ( collegeSectionsId, collegeSections ),
                college_academic_year ( collegeAcademicYear )
            )
        `,
      { count: "exact" },
    )
    .eq("isActive", true)
    .is("deletedAt", null)
    .eq("role", role);

  if (collegeBranchId) {
    query = query.eq(
      "finance_meetings_sections.collegeBranchId",
      collegeBranchId,
    );
  }
  if (sectionIds && sectionIds.length > 0) {
    query = query.in("finance_meetings_sections.collegeSectionsId", sectionIds);
  }
  if (academicYearIds && academicYearIds.length > 0) {
    query = query.in(
      "finance_meetings_sections.collegeAcademicYearId",
      academicYearIds,
    );
  }

  if (type === "upcoming") {
    query = query.or(
      `date.gt.${today},and(date.eq.${today},toTime.gte.${currentTime})`,
    );
  } else {
    query = query.or(
      `date.lt.${today},and(date.eq.${today},toTime.lt.${currentTime})`,
    );
  }

  const isAscending = type === "upcoming";
  const { data, error, count } = await query
    .order("date", { ascending: isAscending })
    .order("fromTime", { ascending: isAscending })
    .range(from, to);

  if (error) throw error;

  const formattedData = (data as any[]).map((row) => {
    const sectionNames =
      row.finance_meetings_sections
        ?.map((s: any) => s.college_sections?.collegeSections)
        .filter(Boolean)
        .join(", ") || "N/A";

    return {
      id: String(row.financeMeetingId),
      financeMeetingId: row.financeMeetingId,
      title: row.title,
      timeRange: `${row.fromTime.slice(0, 5)} - ${row.toTime.slice(0, 5)}`,
      educationType:
        row.finance_meetings_sections?.[0]?.college_education
          ?.collegeEducationType ?? "N/A",
      branch:
        row.finance_meetings_sections?.[0]?.college_branch?.collegeBranchCode ??
        "N/A",
      description: row.description ?? "",
      year:
        row.finance_meetings_sections?.[0]?.college_academic_year
          ?.collegeAcademicYear ?? "",
      date: row.date,
      participants: 0,
      section: sectionNames,
      category: role,
      type: type,
      meetingLink: row.meetingLink ?? "",
    };
  });

  return { data: formattedData, totalPages: Math.ceil((count ?? 0) / limit) };
}

export async function fetchStudentFinanceMeetings(params: {
  role?: string;
  collegeBranchCode: string;
  collegeSectionsId: number;
  type?: "upcoming" | "previous";
  page?: number;
  limit?: number;
}) {
  const {
    role = "Student",
    collegeSectionsId,
    type = "upcoming",
    page = 1,
    limit = 10,
  } = params;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().split(" ")[0];

  let query = supabase
    .from("finance_meetings")
    .select(
      `
            financeMeetingId, title, description, role, date, fromTime, toTime, meetingLink, isActive, deletedAt,
            finance_meetings_sections!inner (
                financeMeetingSectionsId,
                college_education ( collegeEducationType ),
                college_branch ( collegeBranchCode ),
                college_sections ( collegeSectionsId, collegeSections ),
                college_academic_year ( collegeAcademicYear )
            )
        `,
      { count: "exact" },
    )
    .eq("isActive", true)
    .is("deletedAt", null)
    .eq("role", role)
    .eq("finance_meetings_sections.collegeSectionsId", collegeSectionsId);

  if (type === "upcoming") {
    query = query.or(
      `date.gt.${today},and(date.eq.${today},toTime.gte.${currentTime})`,
    );
  } else {
    query = query.or(
      `date.lt.${today},and(date.eq.${today},toTime.lt.${currentTime})`,
    );
  }

  const isAscending = type === "upcoming";
  const { data, error, count } = await query
    .order("date", { ascending: isAscending })
    .order("fromTime", { ascending: isAscending })
    .range(from, to);

  if (error) throw error;
  const formattedData = (data as any[]).map((row) => ({
    id: `${row.financeMeetingId}-${row.finance_meetings_sections[0]?.financeMeetingSectionsId}`,
    financeMeetingId: row.financeMeetingId,
    title: row.title,
    timeRange: `${row.fromTime.slice(0, 5)} - ${row.toTime.slice(0, 5)}`,
    educationType:
      row.finance_meetings_sections[0]?.college_education
        ?.collegeEducationType ?? "",
    branch:
      row.finance_meetings_sections[0]?.college_branch?.collegeBranchCode ?? "",
    description: row.description,
    year:
      row.finance_meetings_sections[0]?.college_academic_year
        ?.collegeAcademicYear ?? "",
    date: row.date,
    participants: 0,
    section:
      row.finance_meetings_sections[0]?.college_sections?.collegeSections ?? "",
    category: role,
    type: type,
    meetingLink: row.meetingLink ?? "",
  }));

  return { data: formattedData, totalPages: Math.ceil((count ?? 0) / limit) };
}
