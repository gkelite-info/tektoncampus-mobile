import { supabase } from "@/lib/supabaseClient";

export async function saveBulkCalendarEvent(payload: {
  bulkCalendarEventId?: number;
  facultyId: number;
  subjectId: number | null;
  eventTitle?: string | null;
  type: "class" | "meeting" | "exam";
  fromDate: string;
  toDate: string;
  collegeRoomId: number | null;
  fromTime: string;
  toTime: string;
  meetingLink?: string | null;
  meetingId?: string | null;
  meetingPassword?: string | null;
}) {
  const now = new Date().toISOString();

  if (payload.bulkCalendarEventId) {
    const { error } = await supabase
      .from("bulk_calendar_events")
      .update({
        subject: payload.subjectId,
        type: payload.type,
        fromDate: payload.fromDate,
        toDate: payload.toDate,
        collegeRoomId: payload.collegeRoomId,
        fromTime: payload.fromTime,
        toTime: payload.toTime,
        meetingTitle: payload.type === "meeting" ? payload.eventTitle : null,
        meetingLink: payload.meetingLink ?? null,
        meetingId: payload.meetingId ?? null,
        meetingPassword: payload.meetingPassword ?? null,
        updatedAt: now,
      })
      .eq("bulkCalendarEventId", payload.bulkCalendarEventId);

    if (error) {
      console.error("updateBulkCalendarEvent error:", error);
      return { success: false, error };
    }

    return {
      success: true,
      bulkCalendarEventId: payload.bulkCalendarEventId,
    };
  }

  const { data, error } = await supabase
    .from("bulk_calendar_events")
    .insert({
      facultyId: payload.facultyId,
      subject: payload.subjectId,
      type: payload.type,
      fromDate: payload.fromDate,
      toDate: payload.toDate,
      collegeRoomId: payload.collegeRoomId,
      fromTime: payload.fromTime,
      toTime: payload.toTime,
      meetingTitle: payload.type === "meeting" ? payload.eventTitle : null,
      meetingLink: payload.meetingLink ?? null,
      meetingId: payload.meetingId ?? null,
      meetingPassword: payload.meetingPassword ?? null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .select("bulkCalendarEventId")
    .single();

  if (error) {
    console.error("insertBulkCalendarEvent error:", error);
    return { success: false, error };
  }

  return {
    success: true,
    bulkCalendarEventId: data.bulkCalendarEventId,
  };
}

export async function saveBulkCalendarEventSections(
  bulkCalendarEventId: number,
  payload: {
    collegeEducationId: number;
    collegeBranchId: number;
    collegeAcademicYearId: number;
    collegeSemesterId: number;
    sectionIds: number[];
  }
) {
  const now = new Date().toISOString();

  // 1. Fetch existing active sections
  const { data: existingSections, error: fetchError } = await supabase
    .from("bulk_calendar_event_sections")
    .select("collegeSectionId")
    .eq("bulkCalendarEventId", bulkCalendarEventId)
    .is("deletedAt", null);

  if (fetchError) {
    console.error("fetch existing sections error:", fetchError);
    return { success: false, error: fetchError };
  }

  const existingIds = existingSections.map((s) => s.collegeSectionId);
  const targetIds = payload.sectionIds || [];

  const toDelete = existingIds.filter((id) => !targetIds.includes(id));
  const toInsert = targetIds.filter((id) => !existingIds.includes(id));

  // 2. Soft delete removed sections
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("bulk_calendar_event_sections")
      .update({ deletedAt: now, isActive: false })
      .eq("bulkCalendarEventId", bulkCalendarEventId)
      .in("collegeSectionId", toDelete)
      .is("deletedAt", null);

    if (deleteError) {
      console.error("deleteBulkCalendarEventSections error:", deleteError);
      return { success: false, error: deleteError };
    }
  }

  // 3. Insert new sections
  if (toInsert.length > 0) {
    const inserts = toInsert.map((secId) => ({
      bulkCalendarEventId,
      collegeEducationId: payload.collegeEducationId,
      collegeBranchId: payload.collegeBranchId,
      collegeAcademicYearId: payload.collegeAcademicYearId,
      collegeSemesterId: payload.collegeSemesterId,
      collegeSectionId: secId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }));

    const { error: insertError } = await supabase
      .from("bulk_calendar_event_sections")
      .insert(inserts);

    if (insertError) {
      console.error("insertBulkCalendarEventSections error:", insertError);
      return { success: false, error: insertError };
    }
  }

  return { success: true };
}

export async function saveBulkCalendarEventUnits(
  bulkCalendarEventId: number,
  unitIds: number[]
) {
  const now = new Date().toISOString();

  // 1. Fetch existing active units
  const { data: existingUnits, error: fetchError } = await supabase
    .from("bulk_calendar_event_units")
    .select("collegeSubjectUnitId")
    .eq("bulkCalendarEventId", bulkCalendarEventId)
    .is("deletedAt", null);

  if (fetchError) {
    console.error("fetch existing units error:", fetchError);
    return { success: false, error: fetchError };
  }

  const existingIds = existingUnits.map((u) => u.collegeSubjectUnitId);
  const targetIds = unitIds || [];

  const toDelete = existingIds.filter((id) => !targetIds.includes(id));
  const toInsert = targetIds.filter((id) => !existingIds.includes(id));

  // 2. Soft delete removed units
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("bulk_calendar_event_units")
      .update({ deletedAt: now })
      .eq("bulkCalendarEventId", bulkCalendarEventId)
      .in("collegeSubjectUnitId", toDelete)
      .is("deletedAt", null);

    if (deleteError) {
      console.error("deleteBulkCalendarEventUnits error:", deleteError);
      return { success: false, error: deleteError };
    }
  }

  // 3. Insert new units
  if (toInsert.length > 0) {
    const inserts = toInsert.map((unitId) => ({
      bulkCalendarEventId,
      collegeSubjectUnitId: unitId,
      createdAt: now,
      updatedAt: now,
    }));

    const { error: insertError } = await supabase
      .from("bulk_calendar_event_units")
      .insert(inserts);

    if (insertError) {
      console.error("insertBulkCalendarEventUnits error:", insertError);
      return { success: false, error: insertError };
    }
  }

  return { success: true };
}

export async function fetchBulkCalendarEvents(
  filters: {
    facultyId?: number;
    startDate?: string;
    endDate?: string;
  } = {}
) {
  let query = supabase
    .from("bulk_calendar_events")
    .select(
      `
  bulkCalendarEventId,
  facultyId,
  subject,
  type,
  fromDate,
  toDate,
  collegeRoomId,
  fromTime,
  toTime,
  meetingLink,
  meetingTitle,
  meetingId,
  meetingPassword,
  is_deleted,
  createdAt,
  updatedAt,
  deletedAt,

  college_subjects:subject (
    collegeSubjectId,
    subjectName,
    subjectKey
  ),

  bulk_calendar_event_units (
    collegeSubjectUnitId,
    college_subject_units (
      unitTitle,
      unitNumber
    )
  ),
  
  college_rooms (
    collegeRoomId,
    roomNo
  )
`
    )
    .is("deletedAt", null)
    .eq("is_deleted", false);

  if (filters.facultyId) {
    query = query.eq("facultyId", filters.facultyId);
  }

  if (filters.startDate) {
    query = query.gte("toDate", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("fromDate", filters.endDate);
  }

  const { data, error } = await query.order("fromTime", { ascending: true });

  if (error) {
    console.error("fetchBulkCalendarEvents error:", error);
    throw error;
  }

  return data ?? [];
}

export async function fetchBulkCalendarEventSections(bulkCalendarEventId: number) {
  const { data, error } = await supabase
    .from("bulk_calendar_event_sections")
    .select(
      `
      bulkCalendarEventSectionId,
      collegeEducationId,
      collegeBranchId,
      collegeAcademicYearId,
      collegeSemesterId,
      collegeSectionId
    `
    )
    .eq("bulkCalendarEventId", bulkCalendarEventId)
    .is("deletedAt", null);

  if (error) {
    console.error("fetchBulkCalendarEventSections error:", error);
    throw error;
  }

  return data ?? [];
}

export async function fetchBulkCalendarEventUnits(bulkCalendarEventId: number) {
  const { data, error } = await supabase
    .from("bulk_calendar_event_units")
    .select(
      `
      bulkCalendarEventUnitId,
      collegeSubjectUnitId
    `
    )
    .eq("bulkCalendarEventId", bulkCalendarEventId)
    .is("deletedAt", null);

  if (error) {
    console.error("fetchBulkCalendarEventUnits error:", error);
    throw error;
  }

  return data ?? [];
}

export async function softDeleteBulkCalendarEventSection(
  bulkCalendarEventId: number,
  sectionId: number
) {
  const { error } = await supabase
    .from("bulk_calendar_event_sections")
    .update({ deletedAt: new Date().toISOString(), isActive: false })
    .eq("bulkCalendarEventId", bulkCalendarEventId)
    .eq("collegeSectionId", sectionId)
    .is("deletedAt", null);

  if (error) throw error;
}

export async function deleteBulkCalendarEvent(bulkCalendarEventId: number) {
  const now = new Date().toISOString();

  // Soft delete sections
  await supabase
    .from("bulk_calendar_event_sections")
    .update({ deletedAt: now, isActive: false })
    .eq("bulkCalendarEventId", bulkCalendarEventId)
    .is("deletedAt", null);

  // Soft delete units
  await supabase
    .from("bulk_calendar_event_units")
    .update({ deletedAt: now })
    .eq("bulkCalendarEventId", bulkCalendarEventId)
    .is("deletedAt", null);

  // Soft delete main event
  const { error } = await supabase
    .from("bulk_calendar_events")
    .update({ is_deleted: true, deletedAt: now })
    .eq("bulkCalendarEventId", bulkCalendarEventId)
    .is("deletedAt", null);

  if (error) throw error;
}
