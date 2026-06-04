import { supabase } from "@/lib/supabaseClient";

export type CalendarEventSectionRow = {
    calendarEventId: number;
    collegeEducationId: number;
    collegeBranchId: number;
    collegeAcademicYearId: number;
    collegeSemesterId: number;
    collegeSectionId: number;
    createdAt: string;
};

export async function fetchCalendarEventSections(
    calendarEventId: number
) {
    const { data, error } = await supabase
        .from("calendar_event_section")
        .select(`
      calendarEventSectionId,
      calendarEventId,
      collegeEducationId,
      collegeBranchId,
      collegeAcademicYearId,
      collegeSemesterId,
      collegeSectionId,
      createdAt
    `)
        .eq("calendarEventId", calendarEventId)
        .eq("isActive", true);

    if (error) {
        console.error("fetchCalendarEventSections error:", error);
        throw error;
    }

    return data ?? [];
}


export async function saveCalendarEventSections(
    calendarEventId: number,
    payload: {
        collegeEducationId: number;
        collegeBranchId: number;
        collegeAcademicYearId: number;
        collegeSemesterId: number;
        sectionIds: number[];
    }
) {
    const now = new Date().toISOString();

    const rows = payload.sectionIds.map((sectionId) => ({
        calendarEventId,
        collegeEducationId: payload.collegeEducationId,
        collegeBranchId: payload.collegeBranchId,
        collegeAcademicYearId: payload.collegeAcademicYearId,
        collegeSemesterId: payload.collegeSemesterId,
        collegeSectionId: sectionId,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        deletedAt: null
    }));

    const { error } = await supabase
        .from("calendar_event_section")
        .insert(rows);

    if (error) {
        console.error("saveCalendarEventSections error:", error);
        return { success: false, error };
    }

    return { success: true };
}

export async function softDeleteCalendarEventSection(
    calendarEventId: number,
    sectionId: number
) {
    const { error } = await supabase
        .from("calendar_event_section")
        .update({
            isActive: false,
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
        .eq("calendarEventId", calendarEventId)
        .eq("collegeSectionId", sectionId)
        .eq("isActive", true);

    if (error) {
        console.error("softDeleteCalendarEventSection error:", error);
        return { success: false };
    }

    return { success: true };
}