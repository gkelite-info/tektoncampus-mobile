import type { AppliesToEnum } from "@/lib/helpers/wellbeingCategories/types";

export type WellbeingIssueVisibilityRole =
  | "wellbeingmanager"
  | "wellbeingexecutive"
  | "both";
export type WellbeingIssuePriority = "high" | "medium" | "low";
export type WellbeingIssueStatus = "pending" | "resolved" | "rejected";
export type WellbeingIssueJobStatus =
  | "inprogress"
  | "completed"
  | "cancelled";
export type WellbeingIssueRaisedRole =
  | "Student"
  | "SuperAdmin"
  | "CollegeAdmin"
  | "Admin"
  | "Faculty"
  | "Finance"
  | "CollegeHr"
  | "PlacementOfficer"
  | "WellbeingExecutive"
  | "WellbeingManager"
  | "FinanceManager";

export type GroundStaffIssueRecipient = {
  groundStaffId: number;
  userId: number;
  categoryId: number;
  subCategoryId: number;
  registrationType: "college" | "hostel" | "both";
  hostelType?: "boys" | "girls" | "both" | null;
  fullName?: string | null;
  email?: string | null;
  mobile?: string | null;
};

export type CreateWellbeingSupportIssuePayload = {
  fullName: string;
  email: string;
  issueTitle: string;
  issueVisibilityRole: WellbeingIssueVisibilityRole;
  categoryId: number;
  subCategoryId: number;
  appliesTo: AppliesToEnum;
  priority: WellbeingIssuePriority;
  description: string;
  issueRaisedRole: WellbeingIssueRaisedRole;
  createdBy: number;
  collegeId: number;
  files?: File[];
};

export type StudentWellbeingIssueCounts = {
  raised: number;
  pending: number;
  resolved: number;
  rejected: number;
};

export type WellbeingExecutiveNewIssueCounts = {
  all: number;
  my: number;
  urgent: number;
};

export type StudentWellbeingIssueStatus = "Pending" | "Resolved" | "Rejected";

export type StudentWellbeingIssueListItem = {
  id: string;
  title: string;
  categoryId: number;
  subCategoryId: number;
  appliesTo: AppliesToEnum;
  priority: WellbeingIssuePriority;
  issueVisibilityRole: WellbeingIssueVisibilityRole;
  issueRaisedRole: WellbeingIssueRaisedRole;
  category: string;
  subCategory: string;
  branch: string;
  description: string;
  dateReported: string;
  status: StudentWellbeingIssueStatus;
  canModify: boolean;
  attachments: {
    id: number;
    name: string;
    size: string;
  }[];
};

export type GroundStaffWellbeingIssueCounts = {
  assigned: number;
  pending: number;
  resolved: number;
  rejected: number;
};

export type GroundStaffWellbeingIssueListItem = StudentWellbeingIssueListItem & {
  groundStaffId: number;
};

export type StudentWellbeingIssueTab =
  | "raised"
  | "pending"
  | "resolved"
  | "rejected";

export type UpdateWellbeingSupportIssuePayload = {
  wellbeingSupportIssueId: number;
  issueTitle: string;
  issueVisibilityRole: WellbeingIssueVisibilityRole;
  categoryId: number;
  subCategoryId: number;
  appliesTo: AppliesToEnum;
  priority: WellbeingIssuePriority;
  description: string;
  createdBy: number;
  collegeId: number;
  filesToAdd?: File[];
  attachmentIdsToRemove?: number[];
};
