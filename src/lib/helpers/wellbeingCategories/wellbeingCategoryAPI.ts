import { supabase } from "@/lib/supabaseClient";
import type {
  AppliesToEnum,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  WellbeingCategoryWithSubs,
} from "./types";

export async function fetchWellbeingCategories(
  collegeId: number,
  page: number,
  limit: number,
  appliesTo?: AppliesToEnum | "all",
): Promise<{ categories: WellbeingCategoryWithSubs[]; totalCount: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("wellbeing_categories")
    .select(
      `
      categoryId,
      categoryName,
      appliesTo,
      collegeId,
      createdBy,
      isActive,
      is_deleted,
      createdAt,
      updatedAt,
      deletedAt,
      wellbeing_sub_categories (
        subCategoryId,
        categoryId,
        subCategoryName,
        isActive,
        is_deleted,
        createdAt,
        updatedAt,
        deletedAt
      )
    `,
      { count: "exact" }
    )
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .eq("is_deleted", false)
    .order("createdAt", { ascending: false });

  if (appliesTo && appliesTo !== "all") {
    query = query.or(`appliesTo.eq.${appliesTo},appliesTo.eq.both`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("fetchWellbeingCategories error:", error);
    throw error;
  }

  const categories = (data ?? []).map((cat: any) => ({
    ...cat,
    wellbeing_sub_categories: (cat.wellbeing_sub_categories ?? []).filter(
      (sub: any) => !sub.is_deleted && sub.isActive !== false,
    ),
  }));

  return {
    categories: categories as WellbeingCategoryWithSubs[],
    totalCount: count ?? 0,
  };
}

export async function createWellbeingCategory(payload: CreateCategoryPayload) {
  const now = new Date().toISOString();

  const { data: catData, error: catError } = await supabase
    .from("wellbeing_categories")
    .insert({
      categoryName: payload.categoryName,
      appliesTo: payload.appliesTo,
      collegeId: payload.collegeId,
      createdBy: payload.createdBy,
      isActive: true,
      is_deleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .select("categoryId")
    .single();

  if (catError || !catData) {
    console.error("createWellbeingCategory error:", catError);
    return { success: false, error: catError };
  }

  const categoryId = catData.categoryId;

  if (payload.subCategories.length > 0) {
    const subRows = payload.subCategories.map((name) => ({
      categoryId,
      subCategoryName: name,
      isActive: true,
      is_deleted: false,
      createdAt: now,
      updatedAt: now,
    }));

    const { error: subError } = await supabase
      .from("wellbeing_sub_categories")
      .insert(subRows);

    if (subError) {
      console.error("createWellbeingCategory sub-categories error:", subError);
      return { success: true, categoryId, subError };
    }
  }

  return { success: true, categoryId };
}

export async function updateWellbeingCategory(payload: UpdateCategoryPayload) {
  const now = new Date().toISOString();

  const { error: catError } = await supabase
    .from("wellbeing_categories")
    .update({
      categoryName: payload.categoryName,
      appliesTo: payload.appliesTo,
      updatedAt: now,
    })
    .eq("categoryId", payload.categoryId);

  if (catError) {
    console.error("updateWellbeingCategory error:", catError);
    return { success: false, error: catError };
  }

  const { data: existingSubs, error: fetchSubsError } = await supabase
    .from("wellbeing_sub_categories")
    .select("subCategoryId, subCategoryName")
    .eq("categoryId", payload.categoryId)
    .eq("is_deleted", false);

  if (fetchSubsError) {
    console.error("updateWellbeingCategory fetch subs error:", fetchSubsError);
    return { success: false, error: fetchSubsError };
  }

  const existingNames = new Set(
    (existingSubs ?? []).map((s: any) => s.subCategoryName),
  );
  const newNames = new Set(payload.subCategories);

  const toDelete = (existingSubs ?? []).filter(
    (s: any) => !newNames.has(s.subCategoryName),
  );

  if (toDelete.length > 0) {
    const deleteIds = toDelete.map((s: any) => s.subCategoryId);
    const { error: delError } = await supabase
      .from("wellbeing_sub_categories")
      .update({ is_deleted: true, deletedAt: now, updatedAt: now })
      .in("subCategoryId", deleteIds);

    if (delError) {
      console.error("updateWellbeingCategory delete subs error:", delError);
    }
  }

  const toInsert = payload.subCategories.filter(
    (name) => !existingNames.has(name),
  );

  if (toInsert.length > 0) {
    const subRows = toInsert.map((name) => ({
      categoryId: payload.categoryId,
      subCategoryName: name,
      isActive: true,
      is_deleted: false,
      createdAt: now,
      updatedAt: now,
    }));

    const { error: insError } = await supabase
      .from("wellbeing_sub_categories")
      .insert(subRows);

    if (insError) {
      console.error("updateWellbeingCategory insert subs error:", insError);
    }
  }

  return { success: true, categoryId: payload.categoryId };
}

export async function deleteWellbeingCategory(categoryId: number) {
  const now = new Date().toISOString();

  const { error: catError } = await supabase
    .from("wellbeing_categories")
    .update({
      is_deleted: true,
      isActive: false,
      deletedAt: now,
      updatedAt: now,
    })
    .eq("categoryId", categoryId);

  if (catError) {
    console.error("deleteWellbeingCategory error:", catError);
    return { success: false, error: catError };
  }

  const { error: subError } = await supabase
    .from("wellbeing_sub_categories")
    .update({
      is_deleted: true,
      deletedAt: now,
      updatedAt: now,
    })
    .eq("categoryId", categoryId);

  if (subError) {
    console.error("deleteWellbeingCategory sub-categories error:", subError);
  }

  return { success: true };
}

export async function fetchAllActiveWellbeingCategories(
  collegeId: number
): Promise<WellbeingCategoryWithSubs[]> {
  const { data, error } = await supabase
    .from("wellbeing_categories")
    .select(`
      categoryId,
      categoryName,
      appliesTo,
      collegeId,
      createdBy,
      isActive,
      is_deleted,
      createdAt,
      updatedAt,
      deletedAt,
      wellbeing_sub_categories (
        subCategoryId,
        categoryId,
        subCategoryName,
        isActive,
        is_deleted,
        createdAt,
        updatedAt,
        deletedAt
      )
    `)
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .eq("is_deleted", false);

  if (error) {
    console.error("fetchAllActiveWellbeingCategories error:", error);
    throw error;
  }

  const parsed = (data ?? []).map((cat: any) => ({
    ...cat,
    wellbeing_sub_categories: (cat.wellbeing_sub_categories ?? []).filter(
      (sub: any) => !sub.is_deleted && sub.isActive !== false,
    ),
  }));

  return parsed as WellbeingCategoryWithSubs[];
}

