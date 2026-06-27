// ─── Wellbeing Categories & Sub-Categories ────────────────────────
// Matches: public.wellbeing_categories  &  public.wellbeing_sub_categories

export type AppliesToEnum = "college" | "hostel" | "both";

// ── Row types ──────────────────────────────────────────────────────

export type WellbeingCategoryRow = {
  categoryId: number;
  categoryName: string;
  appliesTo: AppliesToEnum;
  collegeId: number;
  createdBy: number;
  isActive: boolean | null;
  is_deleted: boolean | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type WellbeingSubCategoryRow = {
  subCategoryId: number;
  categoryId: number;
  subCategoryName: string;
  isActive: boolean | null;
  is_deleted: boolean | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

// ── Joined type returned by fetch ──────────────────────────────────

export type WellbeingCategoryWithSubs = WellbeingCategoryRow & {
  wellbeing_sub_categories: WellbeingSubCategoryRow[];
};

// ── Payload types for create / update ──────────────────────────────

export type CreateCategoryPayload = {
  categoryName: string;
  appliesTo: AppliesToEnum;
  collegeId: number;
  createdBy: number;
  subCategories: string[];
};

export type UpdateCategoryPayload = {
  categoryId: number;
  categoryName: string;
  appliesTo: AppliesToEnum;
  /** Current sub-category names to keep / add */
  subCategories: string[];
};
