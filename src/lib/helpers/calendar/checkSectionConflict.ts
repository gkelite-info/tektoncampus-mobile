

import { supabase } from "@/lib/supabaseClient";

export interface ConflictingSection {
  facultyName: string;
  subjectName: string;
  sectionName: string;
  fromTime: string;
  toTime: string;
}

export async function checkSectionConflict(params: {
  collegeId: number;
  date: string;
  fromTime: string;
  toTime: string;
  collegeEducationId: number;
  collegeBranchId: number;
  collegeAcademicYearId: number;
  collegeSemesterId: number;
  sectionIds: number[];
  ignoreEventId?: number;
}): Promise<ConflictingSection[]> {
  

  const {
    collegeId,
    date,
    fromTime,
    toTime,
    collegeEducationId,
    collegeBranchId,
    collegeAcademicYearId,
    collegeSemesterId,
    sectionIds,
    ignoreEventId,
  } = params;

  const { data: events, error } = await supabase
    .from("calendar_event")
    .select(`
      calendarEventId,
      fromTime,
      toTime,
      facultyData:faculty!inner (
        fullName,
        collegeId
      ),
      subjectData:college_subjects (subjectName),
      calendar_event_section (
        isActive,
        deletedAt,
        collegeEducationId,
        collegeBranchId,
        collegeAcademicYearId,
        collegeSemesterId,
        collegeSectionId,
        sectionData:college_sections (collegeSections)
      )
    `)
    .eq("date", date)
    .eq("is_deleted", false)
    .is("deletedAt", null)
    .eq("faculty.collegeId", collegeId);

  if (error || !events) return [];

  const conflicts: ConflictingSection[] = [];

  for (const event of events) {
    if (ignoreEventId && event.calendarEventId === ignoreEventId) continue;

    
    const overlaps = fromTime < event.toTime && toTime > event.fromTime;
    if (!overlaps) continue;

    const activeSections = (event.calendar_event_section || []).filter(
      (s: any) =>
        s.isActive === true &&
        s.deletedAt === null &&
        s.collegeEducationId === collegeEducationId &&
        s.collegeBranchId === collegeBranchId &&
        s.collegeAcademicYearId === collegeAcademicYearId &&
        s.collegeSemesterId === collegeSemesterId &&
        sectionIds.includes(s.collegeSectionId),
    );

    for (const s of activeSections) {
      const facultyData = Array.isArray(event.facultyData)
        ? event.facultyData[0]
        : event.facultyData;
      const subjectData = Array.isArray(event.subjectData)
        ? event.subjectData[0]
        : event.subjectData;
      const sectionData = Array.isArray(s.sectionData)
        ? s.sectionData[0]
        : s.sectionData;

      conflicts.push({
        facultyName: facultyData?.fullName ?? "Unknown Faculty",
        subjectName: subjectData?.subjectName ?? "Unknown Subject",
        sectionName: sectionData?.collegeSections ?? "Unknown Section",
        fromTime: event.fromTime,
        toTime: event.toTime,
      });
    }
  }

  return conflicts;
}
