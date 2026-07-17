import { supabase } from "@/lib/supabaseClient";

export type HolidayType = "festival" | "weekly_off" | "government" | "emergency" | "custom";

export interface CollegeHoliday {
  holidayId: number;
  collegeId: number;
  holidayDate: string;
  title: string;
  description: string | null;
  holidayType: HolidayType;
  isRecurringWeekly: boolean;
  recurringDay: string | null;
  createdBy: number;
  isActive: boolean;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddCollegeHolidayPayload {
  collegeId: number;
  holidayDate: string;
  title: string;
  description?: string;
  holidayType: HolidayType;
  createdBy: number;
}

export const fetchCollegeHolidays = async (collegeId: number, year?: number) => {
  let query = supabase
    .from("college_holidays")
    .select("*")
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .eq("is_deleted", false)
    .order("holidayDate", { ascending: true });

  if (year) {
    query = query
      .gte("holidayDate", `${year}-01-01`)
      .lte("holidayDate", `${year}-12-31`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching college holidays:", error);
    throw error;
  }

  return data as CollegeHoliday[];
};

export const addCollegeHoliday = async (payload: AddCollegeHolidayPayload) => {
  const { data: existing } = await supabase
    .from("college_holidays")
    .select("holidayId")
    .eq("collegeId", payload.collegeId)
    .eq("holidayDate", payload.holidayDate)
    .eq("is_deleted", false)
    .single();

  if (existing) {
    throw new Error("A holiday already exists for this date.");
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("college_holidays")
    .insert([
      {
        ...payload,
        isRecurringWeekly: false,
        isActive: true,
        is_deleted: false,
        createdAt: now,
        updatedAt: now,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error adding college holiday:", error);
    throw error;
  }

  return data as CollegeHoliday;
};

export const updateCollegeHoliday = async (holidayId: number, payload: Partial<AddCollegeHolidayPayload>) => {
  const { data, error } = await supabase
    .from("college_holidays")
    .update({
      ...payload,
      updatedAt: new Date().toISOString(),
    })
    .eq("holidayId", holidayId)
    .select()
    .single();

  if (error) {
    console.error("Error updating college holiday:", error);
    throw error;
  }

  return data as CollegeHoliday;
};

export const deleteCollegeHoliday = async (holidayId: number) => {
  const { data, error } = await supabase
    .from("college_holidays")
    .update({ 
      is_deleted: true, 
      isActive: false, 
      deletedAt: new Date().toISOString() 
    })
    .eq("holidayId", holidayId)
    .select()
    .single();

  if (error) {
    console.error("Error deleting college holiday:", error);
    throw error;
  }

  return data;
};

export const bulkGenerateSundays = async (collegeId: number, year: number, createdBy: number) => {
  const { data: existing } = await supabase
    .from("college_holidays")
    .select("holidayDate")
    .eq("collegeId", collegeId)
    .eq("holidayType", "weekly_off")
    .gte("holidayDate", `${year}-01-01`)
    .lte("holidayDate", `${year}-12-31`)
    .eq("is_deleted", false);

  const existingDates = new Set((existing || []).map(h => h.holidayDate));

  const sundays: any[] = [];
  const date = new Date(year, 0, 1);
  
  while (date.getDay() !== 0) {
    date.setDate(date.getDate() + 1);
  }
  
  const now = new Date().toISOString();
  while (date.getFullYear() === year) {
    const isoDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    if (!existingDates.has(isoDate)) {
      sundays.push({
        collegeId,
        holidayDate: isoDate,
        title: "Sunday",
        description: "Weekly Off",
        holidayType: "weekly_off",
        isRecurringWeekly: true,
        recurringDay: "sunday",
        createdBy,
        isActive: true,
        is_deleted: false,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    date.setDate(date.getDate() + 7);
  }

  if (sundays.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("college_holidays")
    .insert(sundays)
    .select();

  if (error) {
    console.error("Error bulk generating Sundays:", error);
    throw error;
  }

  return data;
};

export const bulkGenerateSaturdays = async (collegeId: number, year: number, createdBy: number) => {
  const { data: existing } = await supabase
    .from("college_holidays")
    .select("holidayDate")
    .eq("collegeId", collegeId)
    .eq("holidayType", "weekly_off")
    .gte("holidayDate", `${year}-01-01`)
    .lte("holidayDate", `${year}-12-31`)
    .eq("is_deleted", false);

  const existingDates = new Set((existing || []).map(h => h.holidayDate));

  const saturdays: any[] = [];
  const date = new Date(year, 0, 1);
  
  while (date.getDay() !== 6) {
    date.setDate(date.getDate() + 1);
  }
  
  const now = new Date().toISOString();
  while (date.getFullYear() === year) {
    const isoDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    if (!existingDates.has(isoDate)) {
      saturdays.push({
        collegeId,
        holidayDate: isoDate,
        title: "Saturday",
        description: "Weekly Off",
        holidayType: "weekly_off",
        isRecurringWeekly: true,
        recurringDay: "saturday",
        createdBy,
        isActive: true,
        is_deleted: false,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    date.setDate(date.getDate() + 7);
  }

  if (saturdays.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("college_holidays")
    .insert(saturdays)
    .select();

  if (error) {
    console.error("Error bulk generating Saturdays:", error);
    throw error;
  }

  return data;
};

export const bulkRemoveWeeklyOffs = async (collegeId: number, year: number, recurringDay: "sunday" | "saturday") => {
  const { data, error } = await supabase
    .from("college_holidays")
    .update({ 
      is_deleted: true, 
      isActive: false, 
      deletedAt: new Date().toISOString() 
    })
    .eq("collegeId", collegeId)
    .eq("holidayType", "weekly_off")
    .eq("recurringDay", recurringDay)
    .gte("holidayDate", `${year}-01-01`)
    .lte("holidayDate", `${year}-12-31`)
    .eq("is_deleted", false)
    .select();

  if (error) {
    console.error(`Error bulk removing ${recurringDay}s:`, error);
    throw error;
  }

  return data;
};
