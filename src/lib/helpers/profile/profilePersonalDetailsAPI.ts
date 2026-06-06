import { supabase } from "@/lib/supabaseClient";

export type PersonalDetailsRow = {
  personalDetailsId: number;
  userId: number;
  workStatus: "experience" | "fresher";
  currentCity: string;
  linkedIn?: string;
  is_deleted: boolean | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export async function updateUserBasic(payload: {
  userId: number;
  fullName: string;
}) {
  const formattedName = payload.fullName.trim();
  const { data: existing } = await supabase
    .from("users")
    .select("fullName")
    .eq("userId", payload.userId)
    .single();

  if (existing?.fullName === payload.fullName.trim()) {
    return { success: true };
  }

  const now = new Date().toISOString();

  const [userUpdate, facultyUpdate, adminUpdate] = await Promise.all([
    supabase
      .from("users")
      .update({
        fullName: formattedName,
        updatedAt: now,
      })
      .eq("userId", payload.userId),
    supabase
      .from("faculty")
      .update({
        fullName: formattedName,
        updatedAt: now,
      })
      .eq("userId", payload.userId),
    supabase
      .from("admins")
      .update({
        fullName: formattedName,
        updatedAt: now,
      })
      .eq("userId", payload.userId),
  ]);

  if (userUpdate.error) {
    console.error("User update error:", userUpdate.error);
    return { success: false };
  }

  if (facultyUpdate.error) console.error("Faculty update error:", facultyUpdate.error);
  if (adminUpdate.error) console.error("Admin update error:", adminUpdate.error);

  return { success: true };
}

export async function fetchCollegeCode(collegeId: number) {
  const { data, error } = await supabase
    .from("colleges")
    .select("collegeCode")
    .eq("collegeId", collegeId)
    .is("deletedAt", null)
    .single();

  if (error) {
    console.error("fetchCollegeCode error:", error);
    return { success: false, data: null };
  }

  return { success: true, data };
}

export async function fetchPersonalDetails(userId: number) {
  const { data, error } = await supabase
    .from("personal_details")
    .select(`
      personalDetailsId,
      userId,
      workStatus,
      currentCity,
      linkedIn,
      is_deleted,
      createdAt,
      updatedAt,
      deletedAt
    `)
    .eq("userId", userId)
    .is("deletedAt", null)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: true, data: null };
    }
    throw error;
  }

  return { success: true, data };
}

export async function fetchExistingPersonalDetails(userId: number) {
  const { data, error } = await supabase
    .from("personal_details")
    .select("personalDetailsId")
    .eq("userId", userId)
    .is("deletedAt", null)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: true, data: null };
    }
    throw error;
  }

  return { success: true, data };
}



export async function savePersonalDetails(
  payload: {
    personalDetailsId?: number;
    userId: number;
    workStatus: "experience" | "fresher";
    currentCity: string;
    linkedIn?: string;
  }
) {
  const now = new Date().toISOString();

  const upsertPayload: any = {
    userId: payload.userId,
    workStatus: payload.workStatus,
    currentCity: payload.currentCity.trim(),
    linkedIn: payload.linkedIn?.trim() ? payload.linkedIn.trim() : null,
    updatedAt: now,
  };

  if (!payload.personalDetailsId) {
    upsertPayload.createdAt = now;

    const { data, error } = await supabase
      .from("personal_details")
      .insert([upsertPayload])
      .select("personalDetailsId")
      .single();

    if (error) {
      console.error("savePersonalDetails create error:", error);
      return { success: false, error };
    }

    return {
      success: true,
      personalDetailsId: data.personalDetailsId,
    };
  }

  const { error } = await supabase
    .from("personal_details")
    .update(upsertPayload)
    .eq("personalDetailsId", payload.personalDetailsId)
    .select()
    .single();

  if (error) {
    console.error("savePersonalDetails update error:", error);
    return { success: false, error };
  }

  return {
    success: true,
    personalDetailsId: payload.personalDetailsId,
  };
}

export async function deletePersonalDetails(personalDetailsId: number) {
  const { error } = await supabase
    .from("personal_details")
    .update({
      is_deleted: true,
      deletedAt: new Date().toISOString(),
    })
    .eq("personalDetailsId", personalDetailsId);

  if (error) {
    console.error("deletePersonalDetails error:", error);
    return { success: false };
  }

  return { success: true };
}

export async function fetchAllPersonalDetails() {
  const { data, error } = await supabase
    .from("personal_details")
    .select(`
      personalDetailsId,
      userId,
      workStatus,
      currentCity,
      createdAt,
      updatedAt
    `)
    .is("deletedAt", null)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("fetchAllPersonalDetails error:", error);
    throw error;
  }

  return data ?? [];
}
