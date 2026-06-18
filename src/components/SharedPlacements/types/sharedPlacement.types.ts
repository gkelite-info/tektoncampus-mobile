export interface SharedPlacementCompany {
  id: number;
  name: string;
  logo: string;
  role: string;
  longDescription: string;
  email: string;
  phone: string;
  website: string;
  skills: string[];
  packageDetails: string;
  driveType: string;
  workMode: string;
  startDate?: string;
  endDate?: string;
  isExpired: boolean;
  eligibilityCriteria: string;
  branchName?: string;
  collegeBranchId?: number | string;
  academicYear?: string;
  collegeAcademicYearId?: number | string;
  attachments: string[];

  // Student specific
  isEligible?: boolean;
  jobType?: string;
  location?: string;

  // Faculty/Admin specific
  educationTypeName?: string;
  collegeEducationId?: number | string;
  tags?: string[];
  locations?: string[];
}

export function mapToSharedPlacement(
  company: any,
  role: "student" | "faculty",
): SharedPlacementCompany {
  if (role === "student") {
    return {
      ...company,
      name: company.companyName || company.name,
      logo: company.logoUrl || company.logo,
    };
  }

  // Faculty role
  return {
    ...company,
    name: company.name,
    logo: company.logo,
    location: company.locations?.join(", ") || "-",
    jobType: company.tags?.[0] || company.jobTypeValue || "-",
  };
}
