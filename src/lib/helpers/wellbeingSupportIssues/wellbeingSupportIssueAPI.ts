import { supabase } from "@/lib/supabaseClient";
import type {
  CreateWellbeingSupportIssuePayload,
  GroundStaffIssueRecipient,
  GroundStaffWellbeingIssueCounts,
  GroundStaffWellbeingIssueListItem,
  StudentWellbeingIssueCounts,
  StudentWellbeingIssueListItem,
  StudentWellbeingIssueTab,
  UpdateWellbeingSupportIssuePayload,
  WellbeingExecutiveNewIssueCounts,
  WellbeingIssueJobStatus,
  WellbeingIssuePriority,
  WellbeingIssueRaisedRole,
  WellbeingIssueStatus,
  WellbeingIssueVisibilityRole,
} from "./types";
import type { AppliesToEnum } from "@/lib/helpers/wellbeingCategories/types";

const WELLBEING_ATTACHMENTS_BUCKET = "wellbeing-support-attachments";

type WellbeingSupportIssueAttachmentRow = {
  wellbeingSupportIssueAttachmentId: number;
  wellbeingSupportIssueId?: number;
  attachment: string;
  is_deleted: boolean | null;
  deletedAt: string | null;
};

type WellbeingSupportIssueCategoryLookupRow = {
  categoryId: number;
  categoryName: string;
};

type WellbeingSupportIssueSubCategoryLookupRow = {
  subCategoryId: number;
  subCategoryName: string;
};

type StudentWellbeingIssueRow = {
  wellbeingSupportIssueId: number;
  issueTitle: string;
  categoryId: number;
  subCategoryId: number;
  issueVisibilityRole: WellbeingIssueVisibilityRole;
  priority: WellbeingIssuePriority;
  IssueStatus: WellbeingIssueStatus;
  description: string;
  appliesTo: AppliesToEnum;
  createdAt: string | null;
};

type GroundStaffAssignmentRow = {
  groundStaffId: number;
  userId: number;
  categoryId: number;
  subCategoryId: number;
  registrationType: "college" | "hostel" | "both";
  hostelType?: "boys" | "girls" | "both" | null;
  users?:
    | {
        fullName?: string | null;
        email?: string | null;
        mobile?: string | null;
      }
    | {
        fullName?: string | null;
        email?: string | null;
        mobile?: string | null;
      }[]
    | null;
};

type WellbeingIssueJobLookupRow = {
  wellbeingSupportIssueId: number;
  status: WellbeingIssueJobStatus;
  updatedAt?: string | null;
};

const issueAppliesToMatchesGroundStaff = (
  issueAppliesTo: AppliesToEnum,
  registrationType: GroundStaffAssignmentRow["registrationType"],
) =>
  issueAppliesTo === "both" ||
  registrationType === "both" ||
  issueAppliesTo === registrationType;

const getSingleRelation = <T,>(relation: T | T[] | null | undefined) =>
  Array.isArray(relation) ? relation[0] : relation;

const getLatestIssueJobByIssueId = (jobs: WellbeingIssueJobLookupRow[]) => {
  const latestJobByIssueId = new Map<number, WellbeingIssueJobLookupRow>();

  jobs.forEach((job) => {
    if (!latestJobByIssueId.has(job.wellbeingSupportIssueId)) {
      latestJobByIssueId.set(job.wellbeingSupportIssueId, job);
    }
  });

  return latestJobByIssueId;
};

const toGroundStaffRecipient = (
  row: GroundStaffAssignmentRow,
): GroundStaffIssueRecipient => {
  const user = getSingleRelation(row.users);
  return {
    groundStaffId: row.groundStaffId,
    userId: row.userId,
    categoryId: row.categoryId,
    subCategoryId: row.subCategoryId,
    registrationType: row.registrationType,
    hostelType: row.hostelType ?? null,
    fullName: user?.fullName ?? null,
    email: user?.email ?? null,
    mobile: user?.mobile ?? null,
  };
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

function formatDate(date: string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function getAttachmentName(path: string) {
  const fileName = path.split("/").pop() || path;
  return fileName.replace(/^\d+_\d+_/, "");
}

function toUiStatus(status: WellbeingIssueStatus) {
  const statusMap: Record<WellbeingIssueStatus, "Pending" | "Resolved" | "Rejected"> = {
    pending: "Pending",
    resolved: "Resolved",
    rejected: "Rejected",
  };

  return statusMap[status] ?? "Pending";
}

async function uploadIssueAttachments(issueId: number, files: File[] = []) {
  const uploadedPaths: string[] = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const fileName = sanitizeFileName(file.name);
    const storagePath = `${issueId}/${Date.now()}_${index}_${fileName}`;

    const { data, error } = await supabase.storage
      .from(WELLBEING_ATTACHMENTS_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`Attachment upload failed: ${error.message}`);
    }

    uploadedPaths.push(data.path);
  }

  return uploadedPaths;
}

export async function createWellbeingSupportIssue(
  payload: CreateWellbeingSupportIssuePayload,
) {
  const now = new Date().toISOString();
  const { data: issueData, error: issueError } = await supabase
    .from("wellbeing_support_issues")
    .insert({
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      issueTitle: payload.issueTitle.trim(),
      issueVisibilityRole: payload.issueVisibilityRole,
      categoryId: payload.categoryId,
      subCategoryId: payload.subCategoryId,
      appliesTo: payload.appliesTo,
      priority: payload.priority,
      description: payload.description.trim(),
      IssueStatus: "pending",
      isActive: true,
      createdBy: payload.createdBy,
      collegeId: payload.collegeId,
      is_deleted: false,
      createdAt: now,
      updatedAt: now,
    })
    .select("wellbeingSupportIssueId")
    .single();

  if (issueError || !issueData) {
    if (issueError) {
      console.error("createWellbeingSupportIssue error:", {
        code: issueError.code,
        message: issueError.message,
        details: issueError.details,
        hint: issueError.hint,
      });
    }
    throw issueError ?? new Error("Failed to create wellbeing issue");
  }

  const issueId = issueData.wellbeingSupportIssueId;
  const attachmentPaths = await uploadIssueAttachments(issueId, payload.files);

  if (attachmentPaths.length > 0) {
    const { error: attachmentError } = await supabase
      .from("wellbeing_support_issue_attachments")
      .insert(
        attachmentPaths.map((attachment) => ({
          wellbeingSupportIssueId: issueId,
          attachment,
          is_deleted: false,
          createdAt: now,
          updatedAt: now,
        })),
      );

    if (attachmentError) {
      throw attachmentError;
    }
  }

  const groundStaffRecipients = await fetchGroundStaffRecipientsForIssue({
    collegeId: payload.collegeId,
    categoryId: payload.categoryId,
    subCategoryId: payload.subCategoryId,
    appliesTo: payload.appliesTo,
  }).catch((error) => {
    console.warn("createWellbeingSupportIssue ground staff lookup warning:", error);
    return [];
  });

  return { wellbeingSupportIssueId: issueId, groundStaffRecipients };
}

export async function fetchGroundStaffRecipientsForIssue({
  collegeId,
  categoryId,
  subCategoryId,
  appliesTo,
}: {
  collegeId: number;
  categoryId: number;
  subCategoryId: number;
  appliesTo: AppliesToEnum;
}): Promise<GroundStaffIssueRecipient[]> {
  const { data, error } = await supabase
    .from("ground_staff")
    .select(
      `
      groundStaffId,
      userId,
      categoryId,
      subCategoryId,
      registrationType,
      hostelType,
      users:userId (
        fullName,
        email,
        mobile
      )
    `,
    )
    .eq("collegeId", collegeId)
    .eq("categoryId", categoryId)
    .eq("subCategoryId", subCategoryId)
    .eq("isActive", true)
    .eq("is_deleted", false)
    .is("deletedAt", null);

  if (error) {
    console.error("fetchGroundStaffRecipientsForIssue error:", error);
    throw error;
  }

  return ((data ?? []) as GroundStaffAssignmentRow[])
    .filter((row) =>
      issueAppliesToMatchesGroundStaff(appliesTo, row.registrationType),
    )
    .map(toGroundStaffRecipient);
}

export async function updateWellbeingSupportIssue(
  payload: UpdateWellbeingSupportIssuePayload,
) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("wellbeing_support_issues")
    .update({
      issueTitle: payload.issueTitle.trim(),
      issueVisibilityRole: payload.issueVisibilityRole,
      categoryId: payload.categoryId,
      subCategoryId: payload.subCategoryId,
      appliesTo: payload.appliesTo,
      priority: payload.priority,
      description: payload.description.trim(),
      updatedAt: now,
    })
    .eq("wellbeingSupportIssueId", payload.wellbeingSupportIssueId)
    .eq("createdBy", payload.createdBy)
    .eq("collegeId", payload.collegeId)
    .eq("isActive", true)
    .eq("is_deleted", false);

  if (error) {
    console.error("updateWellbeingSupportIssue error:", error);
    throw error;
  }

  if (payload.attachmentIdsToRemove?.length) {
    const { error: attachmentRemoveError } = await supabase
      .from("wellbeing_support_issue_attachments")
      .update({
        is_deleted: true,
        deletedAt: now,
        updatedAt: now,
      })
      .eq("wellbeingSupportIssueId", payload.wellbeingSupportIssueId)
      .in("wellbeingSupportIssueAttachmentId", payload.attachmentIdsToRemove)
      .eq("is_deleted", false);

    if (attachmentRemoveError) {
      console.error("updateWellbeingSupportIssue remove attachments error:", attachmentRemoveError);
      throw attachmentRemoveError;
    }
  }

  const attachmentPaths = await uploadIssueAttachments(
    payload.wellbeingSupportIssueId,
    payload.filesToAdd,
  );

  if (attachmentPaths.length > 0) {
    const { error: attachmentInsertError } = await supabase
      .from("wellbeing_support_issue_attachments")
      .insert(
        attachmentPaths.map((attachment) => ({
          wellbeingSupportIssueId: payload.wellbeingSupportIssueId,
          attachment,
          is_deleted: false,
          createdAt: now,
          updatedAt: now,
        })),
      );

    if (attachmentInsertError) {
      console.error("updateWellbeingSupportIssue add attachments error:", attachmentInsertError);
      throw attachmentInsertError;
    }
  }

  return { success: true };
}

export async function deleteWellbeingSupportIssue({
  wellbeingSupportIssueId,
  createdBy,
  collegeId,
}: {
  wellbeingSupportIssueId: number;
  createdBy: number;
  collegeId: number;
}) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("wellbeing_support_issues")
    .update({
      isActive: false,
      is_deleted: true,
      deletedAt: now,
      updatedAt: now,
    })
    .eq("wellbeingSupportIssueId", wellbeingSupportIssueId)
    .eq("createdBy", createdBy)
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .eq("is_deleted", false);

  if (error) {
    console.error("deleteWellbeingSupportIssue error:", error);
    throw error;
  }

  const { error: attachmentError } = await supabase
    .from("wellbeing_support_issue_attachments")
    .update({
      is_deleted: true,
      deletedAt: now,
      updatedAt: now,
    })
    .eq("wellbeingSupportIssueId", wellbeingSupportIssueId)
    .eq("is_deleted", false);

  if (attachmentError) {
    console.error("deleteWellbeingSupportIssue attachments error:", attachmentError);
    throw attachmentError;
  }

  return { success: true };
}

export async function fetchStudentWellbeingIssueCounts(
  userId: number,
  collegeId: number,
): Promise<StudentWellbeingIssueCounts> {
  const { data, error } = await supabase
    .from("wellbeing_support_issues")
    .select("IssueStatus")
    .eq("createdBy", userId)
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .eq("is_deleted", false);

  if (error) {
    console.error("fetchStudentWellbeingIssueCounts error:", error);
    throw error;
  }

  const rows = data ?? [];
  const pending = rows.filter((issue) => issue.IssueStatus === "pending").length;
  const resolved = rows.filter((issue) => issue.IssueStatus === "resolved").length;
  const rejected = rows.filter((issue) => issue.IssueStatus === "rejected").length;
  const raised = rows.length;

  return {
    raised,
    pending,
    resolved,
    rejected,
  };
}

async function fetchActiveGroundStaffAssignments(
  userId: number,
  collegeId: number,
) {
  const { data, error } = await supabase
    .from("ground_staff")
    .select(
      "groundStaffId, userId, categoryId, subCategoryId, registrationType, hostelType",
    )
    .eq("userId", userId)
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .eq("is_deleted", false)
    .is("deletedAt", null);

  if (error) {
    console.error("fetchActiveGroundStaffAssignments error:", error);
    throw error;
  }

  return (data ?? []) as GroundStaffAssignmentRow[];
}

function filterIssuesForGroundStaffAssignments<
  T extends {
    categoryId: number;
    subCategoryId: number;
    appliesTo: AppliesToEnum;
  },
>(issues: T[], assignments: GroundStaffAssignmentRow[]) {
  return issues
    .map((issue) => {
      const matchingAssignment = assignments.find(
        (assignment) =>
          assignment.categoryId === issue.categoryId &&
          assignment.subCategoryId === issue.subCategoryId &&
          issueAppliesToMatchesGroundStaff(
            issue.appliesTo,
            assignment.registrationType,
          ),
      );

      return matchingAssignment
        ? { issue, groundStaffId: matchingAssignment.groundStaffId }
        : null;
    })
    .filter(
      (
        value,
      ): value is {
        issue: T;
        groundStaffId: number;
      } => Boolean(value),
    );
}

export async function fetchGroundStaffWellbeingIssueCounts(
  userId: number,
  collegeId: number,
): Promise<GroundStaffWellbeingIssueCounts> {
  const assignments = await fetchActiveGroundStaffAssignments(userId, collegeId);

  if (!assignments.length) {
    return {
      assigned: 0,
      pending: 0,
      resolved: 0,
      rejected: 0,
    };
  }

  const categoryIds = Array.from(new Set(assignments.map((item) => item.categoryId)));
  const subCategoryIds = Array.from(new Set(assignments.map((item) => item.subCategoryId)));

  const { data, error } = await supabase
    .from("wellbeing_support_issues")
    .select("wellbeingSupportIssueId, categoryId, subCategoryId, appliesTo, IssueStatus")
    .eq("collegeId", collegeId)
    .in("categoryId", categoryIds)
    .in("subCategoryId", subCategoryIds)
    .eq("isActive", true)
    .eq("is_deleted", false);

  if (error) {
    console.error("fetchGroundStaffWellbeingIssueCounts error:", error);
    throw error;
  }

  const matchedIssues = filterIssuesForGroundStaffAssignments(
    (data ?? []) as Array<
      Pick<
        StudentWellbeingIssueRow,
        "categoryId" | "subCategoryId" | "appliesTo" | "IssueStatus"
      >
    >,
    assignments,
  ).map((item) => item.issue);

  return {
    assigned: matchedIssues.length,
    pending: matchedIssues.filter((issue) => issue.IssueStatus === "pending").length,
    resolved: matchedIssues.filter((issue) => issue.IssueStatus === "resolved").length,
    rejected: matchedIssues.filter((issue) => issue.IssueStatus === "rejected").length,
  };
}

export async function fetchGroundStaffWellbeingIssues({
  userId,
  collegeId,
  page,
  limit,
  tab,
}: {
  userId: number;
  collegeId: number;
  page: number;
  limit: number;
  tab: StudentWellbeingIssueTab;
}): Promise<{ data: GroundStaffWellbeingIssueListItem[]; totalCount: number }> {
  const assignments = await fetchActiveGroundStaffAssignments(userId, collegeId);

  if (!assignments.length) {
    return { data: [], totalCount: 0 };
  }

  const categoryIds = Array.from(new Set(assignments.map((item) => item.categoryId)));
  const subCategoryIds = Array.from(new Set(assignments.map((item) => item.subCategoryId)));
  const statusByTab: Partial<Record<StudentWellbeingIssueTab, WellbeingIssueStatus>> = {
    pending: "pending",
    resolved: "resolved",
    rejected: "rejected",
  };

  const status = statusByTab[tab];
  const groundStaffIssueSelect = `
    wellbeingSupportIssueId,
    issueTitle,
    categoryId,
    subCategoryId,
    issueVisibilityRole,
    priority,
    IssueStatus,
    description,
    appliesTo,
    createdAt
  `;
  const buildGroundStaffIssuesQuery = (selectColumns: string) => {
    let query = supabase
      .from("wellbeing_support_issues")
      .select(selectColumns)
      .eq("collegeId", collegeId)
      .in("categoryId", categoryIds)
      .in("subCategoryId", subCategoryIds)
      .eq("isActive", true)
      .eq("is_deleted", false)
      .order("createdAt", { ascending: false });

    if (status) {
      query = query.eq("IssueStatus", status);
    }

    return query;
  };

  const { data, error } = await buildGroundStaffIssuesQuery(groundStaffIssueSelect);

  if (error) {
    console.error("fetchGroundStaffWellbeingIssues error:", error);
    throw error;
  }

  const matchedIssuePairs = filterIssuesForGroundStaffAssignments(
    (data ?? []) as unknown as StudentWellbeingIssueRow[],
    assignments,
  );
  const totalCount = matchedIssuePairs.length;
  const from = (page - 1) * limit;
  const rowsWithGroundStaff = matchedIssuePairs.slice(from, from + limit);
  const rows = rowsWithGroundStaff.map((item) => item.issue);
  const categoryIdsForPage = Array.from(new Set(rows.map((issue) => issue.categoryId)));
  const subCategoryIdsForPage = Array.from(new Set(rows.map((issue) => issue.subCategoryId)));
  const issueIds = rows.map((issue) => issue.wellbeingSupportIssueId);

  const [categoriesRes, subCategoriesRes, attachmentsRes] = await Promise.all([
    categoryIdsForPage.length
      ? supabase
          .from("wellbeing_categories")
          .select("categoryId, categoryName")
          .in("categoryId", categoryIdsForPage)
      : Promise.resolve({ data: [], error: null }),
    subCategoryIdsForPage.length
      ? supabase
          .from("wellbeing_sub_categories")
          .select("subCategoryId, subCategoryName")
          .in("subCategoryId", subCategoryIdsForPage)
      : Promise.resolve({ data: [], error: null }),
    issueIds.length
      ? supabase
          .from("wellbeing_support_issue_attachments")
          .select("wellbeingSupportIssueAttachmentId, wellbeingSupportIssueId, attachment, is_deleted, deletedAt")
          .in("wellbeingSupportIssueId", issueIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (categoriesRes.error) throw categoriesRes.error;
  if (subCategoriesRes.error) throw subCategoriesRes.error;
  if (attachmentsRes.error) throw attachmentsRes.error;

  const categoryById = new Map(
    ((categoriesRes.data ?? []) as WellbeingSupportIssueCategoryLookupRow[]).map((category) => [
      category.categoryId,
      category.categoryName,
    ]),
  );
  const subCategoryById = new Map(
    ((subCategoriesRes.data ?? []) as WellbeingSupportIssueSubCategoryLookupRow[]).map((subCategory) => [
      subCategory.subCategoryId,
      subCategory.subCategoryName,
    ]),
  );
  const attachmentsByIssueId = new Map<number, WellbeingSupportIssueAttachmentRow[]>();
  ((attachmentsRes.data ?? []) as WellbeingSupportIssueAttachmentRow[]).forEach((attachment) => {
    const issueId = attachment.wellbeingSupportIssueId;
    if (!issueId) return;
    const existing = attachmentsByIssueId.get(issueId) ?? [];
    existing.push(attachment);
    attachmentsByIssueId.set(issueId, existing);
  });

  return {
    data: rowsWithGroundStaff.map(({ issue, groundStaffId }) => {
      const attachments = (attachmentsByIssueId.get(issue.wellbeingSupportIssueId) ?? [])
        .filter((attachment) => !attachment.is_deleted && !attachment.deletedAt)
        .map((attachment) => ({
          id: attachment.wellbeingSupportIssueAttachmentId,
          name: getAttachmentName(attachment.attachment),
          size: "File",
        }));

      return {
        id: String(issue.wellbeingSupportIssueId),
        groundStaffId,
        title: issue.issueTitle,
        categoryId: issue.categoryId,
        subCategoryId: issue.subCategoryId,
        issueVisibilityRole: issue.issueVisibilityRole,
        issueRaisedRole: "Student",
        priority: issue.priority,
        appliesTo: issue.appliesTo,
        subCategory: subCategoryById.get(issue.subCategoryId) || "Not specified",
        category: categoryById.get(issue.categoryId) || "Not specified",
        branch: issue.appliesTo || "Not specified",
        description: issue.description,
        dateReported: formatDate(issue.createdAt),
        status: toUiStatus(issue.IssueStatus),
        canModify: false,
        attachments,
      };
    }),
    totalCount,
  };
}

export async function fetchWellbeingExecutiveNewIssueCounts(
  collegeId: number,
  categoryIdOrIds?: number | number[] | null,
  issueRaisedRole?: WellbeingIssueRaisedRole | null,
  wellBeingId?: number | null,
): Promise<WellbeingExecutiveNewIssueCounts> {
  const shouldFilterByCategory =
    categoryIdOrIds !== undefined && categoryIdOrIds !== null;
  const categoryIds = Array.from(
    new Set(
      (Array.isArray(categoryIdOrIds)
        ? categoryIdOrIds
        : categoryIdOrIds
          ? [categoryIdOrIds]
          : []
      )
        .map((categoryId) => Number(categoryId))
        .filter((categoryId) => Number.isFinite(categoryId) && categoryId > 0),
    ),
  );

  if (shouldFilterByCategory && !categoryIds.length) {
    return { all: 0, my: 0, urgent: 0 };
  }

  let query = supabase
    .from("wellbeing_support_issues")
    .select("wellbeingSupportIssueId, categoryId, priority, createdBy")
    .eq("collegeId", collegeId)
    .eq("IssueStatus", "pending")
    .eq("isActive", true)
    .eq("is_deleted", false)
    .is("deletedAt", null)
    .in("issueVisibilityRole", ["wellbeingexecutive", "both"]);

  if (shouldFilterByCategory) {
    query =
      categoryIds.length === 1
        ? query.eq("categoryId", categoryIds[0])
        : query.or(categoryIds.map((categoryId) => `categoryId.eq.${categoryId}`).join(","));
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetchWellbeingExecutiveNewIssueCounts error:", error);
    throw error;
  }

  let rows = data ?? [];

  if (issueRaisedRole) {
    const requesterUserIds = Array.from(
      new Set(rows.map((issue) => issue.createdBy).filter(Boolean)),
    );

    if (!requesterUserIds.length) {
      rows = [];
    } else {
      const { data: requesterUsers, error: requesterUsersError } = await supabase
        .from("users")
        .select("userId, role")
        .in("userId", requesterUserIds);

      if (requesterUsersError) {
        console.error("fetchWellbeingExecutiveNewIssueCounts users error:", requesterUsersError);
        throw requesterUsersError;
      }

      const roleByUserId = new Map(
        ((requesterUsers ?? []) as { userId: number; role: string | null }[]).map(
          (user) => [user.userId, user.role],
        ),
      );

      rows = rows.filter((issue) => roleByUserId.get(issue.createdBy) === issueRaisedRole);
    }
  }

  const issueIds = rows.map((issue) => issue.wellbeingSupportIssueId).filter(Boolean);
  if (issueIds.length) {
    const { data: latestJobs, error: latestJobsError } = await supabase
      .from("wellbeing_issue_jobs")
      .select("wellbeingSupportIssueId, status, updatedAt")
      .in("wellbeingSupportIssueId", issueIds)
      .eq("isActive", true)
      .eq("is_deleted", false)
      .is("deletedAt", null)
      .order("updatedAt", { ascending: false });

    if (latestJobsError) {
      console.error("fetchWellbeingExecutiveNewIssueCounts latest jobs error:", latestJobsError);
      throw latestJobsError;
    }

    const latestJobByIssueId = getLatestIssueJobByIssueId(
      (latestJobs ?? []) as WellbeingIssueJobLookupRow[],
    );

    rows = rows.filter((issue) => {
      const latestJob = latestJobByIssueId.get(issue.wellbeingSupportIssueId);
      return latestJob?.status !== "completed";
    });
  }
  let myCount = 0;

  if (wellBeingId) {
    const issueIds = rows.map((issue) => issue.wellbeingSupportIssueId).filter(Boolean);
    if (issueIds.length) {
      const { data: assignedJobs, error: jobError } = await supabase
        .from("wellbeing_issue_jobs")
        .select("wellbeingSupportIssueId, status, updatedAt")
        .eq("wellBeingId", wellBeingId)
        .in("status", [
          "inprogress" satisfies WellbeingIssueJobStatus,
          "completed" satisfies WellbeingIssueJobStatus,
          "cancelled" satisfies WellbeingIssueJobStatus,
        ])
        .eq("isActive", true)
        .eq("is_deleted", false)
        .is("deletedAt", null);

      if (jobError) {
        console.warn("fetchWellbeingExecutiveNewIssueCounts jobs warning:", {
          code: jobError.code,
          message: jobError.message,
          details: jobError.details,
          hint: jobError.hint,
        });
        myCount = 0;
      } else {
        const issueIdSet = new Set(issueIds);
        const latestAssignedJobByIssueId = getLatestIssueJobByIssueId(
          ((assignedJobs ?? []) as WellbeingIssueJobLookupRow[]).filter((job) =>
            issueIdSet.has(job.wellbeingSupportIssueId),
          ),
        );
        myCount = Array.from(latestAssignedJobByIssueId.values()).filter(
          (job) => job.status !== "completed",
        ).length;
      }
    }
  } else {
    myCount = rows.length;
  }

  return {
    all: rows.length,
    my: myCount,
    urgent: rows.filter((issue) => issue.priority === "high").length,
  };
}

export async function fetchWellbeingManagerNewIssueCount(
  collegeId: number,
): Promise<number> {
  const { data, error } = await supabase
    .from("wellbeing_support_issues")
    .select("wellbeingSupportIssueId")
    .eq("collegeId", collegeId)
    .eq("IssueStatus", "pending")
    .eq("isActive", true)
    .eq("is_deleted", false)
    .is("deletedAt", null)
    .in("issueVisibilityRole", ["wellbeingmanager", "both"]);

  if (error) {
    console.error("fetchWellbeingManagerNewIssueCount error:", error);
    throw error;
  }

  const issueIds = (data ?? [])
    .map((issue) => issue.wellbeingSupportIssueId)
    .filter((issueId): issueId is number => Boolean(issueId));

  if (!issueIds.length) return 0;

  const { data: latestJobs, error: latestJobsError } = await supabase
    .from("wellbeing_issue_jobs")
    .select("wellbeingSupportIssueId, status, updatedAt")
    .in("wellbeingSupportIssueId", issueIds)
    .eq("isActive", true)
    .eq("is_deleted", false)
    .is("deletedAt", null)
    .order("updatedAt", { ascending: false });

  if (latestJobsError) {
    console.error("fetchWellbeingManagerNewIssueCount jobs error:", latestJobsError);
    throw latestJobsError;
  }

  const latestJobByIssueId = getLatestIssueJobByIssueId(
    (latestJobs ?? []) as WellbeingIssueJobLookupRow[],
  );

  return issueIds.filter((issueId) => {
    const latestJob = latestJobByIssueId.get(issueId);
    return latestJob?.status !== "completed";
  }).length;
}

export async function fetchStudentWellbeingIssues({
  userId,
  collegeId,
  page,
  limit,
  tab,
}: {
  userId: number;
  collegeId: number;
  page: number;
  limit: number;
  tab: StudentWellbeingIssueTab;
}): Promise<{ data: StudentWellbeingIssueListItem[]; totalCount: number }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const clientStatusFilterByTab: Partial<Record<StudentWellbeingIssueTab, WellbeingIssueStatus>> = {
    resolved: "resolved",
    rejected: "rejected",
  };

  const studentIssueSelect = `
    wellbeingSupportIssueId,
    issueTitle,
    categoryId,
    subCategoryId,
    issueVisibilityRole,
    priority,
    IssueStatus,
    description,
    appliesTo,
    createdAt
  `;
  const buildStudentIssuesQuery = (selectColumns: string) => {
    let query = supabase
      .from("wellbeing_support_issues")
      .select(selectColumns, { count: "exact" })
      .eq("createdBy", userId)
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .eq("is_deleted", false);

    if (tab === "pending") {
      query = query.eq("IssueStatus", "pending");
    }

    query = query.order("createdAt", { ascending: false });

    if (tab === "raised" || tab === "pending") {
      query = query.range(from, to);
    }

    return query;
  };

  const { data, error, count } = await buildStudentIssuesQuery(studentIssueSelect);

  if (error) {
    console.error("fetchStudentWellbeingIssues error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }

  const rawRows = (data ?? []) as unknown as StudentWellbeingIssueRow[];
  const clientStatusFilter = clientStatusFilterByTab[tab];
  const filteredRows = clientStatusFilter
    ? rawRows.filter((issue) => issue.IssueStatus === clientStatusFilter)
    : rawRows;
  const rows = clientStatusFilter
    ? filteredRows.slice(from, to + 1)
    : filteredRows;
  const categoryIds = Array.from(new Set(rows.map((issue) => issue.categoryId)));
  const subCategoryIds = Array.from(new Set(rows.map((issue) => issue.subCategoryId)));
  const issueIds = rows.map((issue) => issue.wellbeingSupportIssueId);

  const [categoriesRes, subCategoriesRes, attachmentsRes] = await Promise.all([
    categoryIds.length
      ? supabase
          .from("wellbeing_categories")
          .select("categoryId, categoryName")
          .in("categoryId", categoryIds)
      : Promise.resolve({ data: [], error: null }),
    subCategoryIds.length
      ? supabase
          .from("wellbeing_sub_categories")
          .select("subCategoryId, subCategoryName")
          .in("subCategoryId", subCategoryIds)
      : Promise.resolve({ data: [], error: null }),
    issueIds.length
      ? supabase
          .from("wellbeing_support_issue_attachments")
          .select("wellbeingSupportIssueAttachmentId, wellbeingSupportIssueId, attachment, is_deleted, deletedAt")
          .in("wellbeingSupportIssueId", issueIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (categoriesRes.error) {
    console.error("fetchStudentWellbeingIssues categories error:", categoriesRes.error);
    throw categoriesRes.error;
  }
  if (subCategoriesRes.error) {
    console.error("fetchStudentWellbeingIssues subcategories error:", subCategoriesRes.error);
    throw subCategoriesRes.error;
  }
  if (attachmentsRes.error) {
    console.error("fetchStudentWellbeingIssues attachments error:", attachmentsRes.error);
    throw attachmentsRes.error;
  }

  const categoryById = new Map(
    ((categoriesRes.data ?? []) as WellbeingSupportIssueCategoryLookupRow[]).map((category) => [
      category.categoryId,
      category.categoryName,
    ]),
  );
  const subCategoryById = new Map(
    ((subCategoriesRes.data ?? []) as WellbeingSupportIssueSubCategoryLookupRow[]).map((subCategory) => [
      subCategory.subCategoryId,
      subCategory.subCategoryName,
    ]),
  );
  const attachmentsByIssueId = new Map<number, WellbeingSupportIssueAttachmentRow[]>();
  ((attachmentsRes.data ?? []) as WellbeingSupportIssueAttachmentRow[]).forEach((attachment) => {
    const issueId = attachment.wellbeingSupportIssueId;
    if (!issueId) return;
    const existing = attachmentsByIssueId.get(issueId) ?? [];
    existing.push(attachment);
    attachmentsByIssueId.set(issueId, existing);
  });

  const mappedData: StudentWellbeingIssueListItem[] = rows.map((issue) => {
    const attachments = (attachmentsByIssueId.get(issue.wellbeingSupportIssueId) ?? [])
      .filter((attachment) => !attachment.is_deleted && !attachment.deletedAt)
      .map((attachment) => ({
        id: attachment.wellbeingSupportIssueAttachmentId,
        name: getAttachmentName(attachment.attachment),
        size: "File",
      }));

    return {
      id: String(issue.wellbeingSupportIssueId),
      title: issue.issueTitle,
      categoryId: issue.categoryId,
      subCategoryId: issue.subCategoryId,
      issueVisibilityRole: issue.issueVisibilityRole,
      issueRaisedRole: "Student",
      priority: issue.priority,
      appliesTo: issue.appliesTo,
      subCategory: subCategoryById.get(issue.subCategoryId) || "Not specified",
      category: categoryById.get(issue.categoryId) || "Not specified",
      branch: issue.appliesTo || "Not specified",
      description: issue.description,
      dateReported: formatDate(issue.createdAt),
      status: toUiStatus(issue.IssueStatus),
      canModify: issue.IssueStatus === "pending",
      attachments,
    };
  });

  return {
    data: mappedData,
    totalCount: clientStatusFilter ? filteredRows.length : count ?? 0,
  };
}
