import { supabase } from "@/lib/supabaseClient";

export type HrCalendarEventRow = {
  hrCalendarEventId: number;
  title: string;
  topic: string;
  eventDate: string;
  fromTime: string;
  toTime: string;
  roomNo: string;
  collegeId: number;
  createdBy: number;
  role: string;
  isActive: boolean;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export async function fetchHrCalendarEvents(collegeId: number) {
  const { data, error } = await supabase
    .from("hr_calendar_events")
    .select(
      `
            hrCalendarEventId,
            title,
            topic,
            eventDate,
            fromTime,
            toTime,
            roomNo,
            collegeId,
            createdBy,
            role,
            isActive,
            is_deleted,
            createdAt,
            updatedAt,
            deletedAt
        `,
    )
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .eq("is_deleted", false)
    .is("deletedAt", null)
    .order("eventDate", { ascending: true });

  if (error) {
    console.error("fetchHrCalendarEvents error:", error);
    throw error;
  }

  return data ?? [];
}



export async function saveHrCalendarEvent(
  payload: {
    hrCalendarEventId?: number;
    title: string;
    topic: string;
    eventDate: string;
    fromTime: string;
    toTime: string;
    roomNo: string;
    collegeId: number;
    role: string;
  },
  collegeHrId: number,
) {
  const now = new Date().toISOString();

  const commonData = {
    title: payload.title.trim(),
    topic: payload.topic.trim(),
    eventDate: payload.eventDate,
    fromTime: payload.fromTime,
    toTime: payload.toTime,
    roomNo: payload.roomNo.trim(),
    collegeId: payload.collegeId,
    role: payload.role,
    isActive: true,
    updatedAt: now,
  };

  if (payload.hrCalendarEventId) {
    const { data, error } = await supabase
      .from("hr_calendar_events")
      .update(commonData)
      .eq("hrCalendarEventId", payload.hrCalendarEventId)
      .select("hrCalendarEventId")
      .single();

    if (error) {
      console.error("saveHrCalendarEvent Update Error:", error);
      return { success: false, error };
    }

    return {
      success: true,
      hrCalendarEventId: data.hrCalendarEventId,
    };
  } else {
    const { data, error } = await supabase
      .from("hr_calendar_events")
      .insert([
        {
          ...commonData,
          createdBy: collegeHrId,
          createdAt: now,
        },
      ])
      .select("hrCalendarEventId")
      .single();

    if (error) {
      console.error("saveHrCalendarEvent Insert Error:", error);
      return { success: false, error };
    }

    return {
      success: true,
      hrCalendarEventId: data.hrCalendarEventId,
    };
  }
}

export async function deactivateHrCalendarEvent(hrCalendarEventId: number) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("hr_calendar_events")
    .update({
      isActive: false,
      is_deleted: true,
      deletedAt: now,
      updatedAt: now,
    })
    .eq("hrCalendarEventId", hrCalendarEventId);

  if (error) {
    console.error("deactivateHrCalendarEvent error:", error);
    return { success: false };
  }

  return { success: true };
}

