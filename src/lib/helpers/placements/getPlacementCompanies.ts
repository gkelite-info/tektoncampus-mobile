export type PlacementCompany = {
  id: number;
  name: string;
  role: string;
  description: string;
  longDescription: string;
  skills: string[];
  tags: string[];
  email: string;
  phone: string;
  website: string;
  packageDetails: string;
  driveType: string;
  driveTypeValue: string;
  jobTypeValue: string;
  workMode: string;
  workModeValue: string;
  eligibilityCriteria: string;
  collegeEducationId?: number;
  educationTypeName?: string;
  collegeId: number;
  collegeBranchId: number;
  branchName?: string;
  collegeAcademicYearId: number;
  academicYear?: string;
  createdBy: number;
  createdAt: string;
  placementCompanyIds?: number[];
  studentsPlaced: number;
  locations: string[];
  attachments: string[];
  logo: string;
  startDate?: string;
  endDate?: string;
  isExpired: boolean;
};
import { supabase } from "@/lib/supabaseClient";

type PlacementCompanyRow = {
  placementCompanyId: number;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyJobDescription: string;
  companyWebsite: string;
  jobRoleOffered: string;
  requiredSkills: string[];
  jobType: string;
  workMode: string;
  location: string;
  annualPackage: string | number;
  driveType: string;
  companyLogo: string;
  companyCertificate: string;
  startDate: string;
  endDate: string;
  eligibilityCriteria: string;
  collegeId: number;
  collegeBranchId: number;
  collegeAcademicYearId: number;
  createdBy: number;
  is_deleted: boolean | null;
  createdAt: string;
};

type BranchRow = {
  collegeBranchId: number;
  collegeEducationId: number | null;
  collegeBranchCode: string | null;
  collegeBranchType: string | null;
};

type BranchInfo = {
  name: string;
  collegeEducationId?: number;
};

type EducationRow = {
  collegeEducationId: number;
  collegeEducationType: string | null;
};

type AcademicYearRow = {
  collegeAcademicYearId: number;
  collegeAcademicYear: string | null;
};

type PlacementSortOption =
  | "Recently Uploaded"
  | "Oldest First"
  | "Company Name A-Z"
  | "Company Name Z-A"
  | "CTC (High to Low)"
  | "CTC (Low to High)";

type PlacementStatusOption = "All" | "Open" | "Completed";

type PlacementCompanyFilters = {
  cycle?: string;
  branchName?: string;
  status?: PlacementStatusOption;
  sortBy?: PlacementSortOption;
};

type PlacementCompanyBaseParams = PlacementCompanyFilters & {
  collegeId: number;
  placementOfficerId?: number | null;
  includeExpired?: boolean;
};

type PlacementCompanyPaginatedParams = PlacementCompanyBaseParams & {
  page: number;
  pageSize: number;
};

type PlacementCompanyUnpaginatedParams = PlacementCompanyBaseParams & {
  page?: undefined;
  pageSize?: undefined;
};

type PlacementCompanyPaginatedResult = {
  data: PlacementCompany[];
  totalCount: number;
};

function formatEnumLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatJobType(value: string) {
  const labels: Record<string, string> = {
    fulltime: "Full Time",
    internship: "Internship",
    contract: "Contract",
  };

  return labels[value] ?? formatEnumLabel(value);
}

function formatDriveType(value: string) {
  const labels: Record<string, string> = {
    virtual: "Virtual",
    inperson: "In Person",
  };

  return labels[value] ?? formatEnumLabel(value);
}

function formatWorkMode(value: string) {
  const labels: Record<string, string> = {
    onsite: "Onsite",
    hybrid: "Hybrid",
    remote: "Remote",
  };

  return labels[value] ?? formatEnumLabel(value);
}

function formatPackage(value: string | number) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `${amount.toLocaleString("en-IN")} Lpa`;
}

function splitLocations(location: string) {
  return location
    .split(/[, ]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getStorageUrl(bucket: "placement-logos" | "placement-certificates", path: string) {
  if (path.startsWith("http")) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCompanyGroupKey(row: PlacementCompanyRow) {
  return [
    row.companyName,
    row.companyEmail,
    row.jobRoleOffered,
    row.collegeId,
    row.collegeBranchId,
    row.collegeAcademicYearId,
    row.createdBy,
    row.createdAt,
  ].join("|");
}

async function getBranchInfoMap(branchIds: number[]) {
  if (branchIds.length === 0) return new Map<number, BranchInfo>();

  const { data, error } = await supabase
    .from("college_branch")
    .select("collegeBranchId,collegeEducationId,collegeBranchCode,collegeBranchType")
    .in("collegeBranchId", branchIds);

  if (error) {
    console.error("Failed to fetch placement company branch names:", error);
    return new Map<number, BranchInfo>();
  }

  return new Map(
    ((data ?? []) as BranchRow[]).map((branch) => [
      branch.collegeBranchId,
      {
        name: branch.collegeBranchCode || branch.collegeBranchType || "",
        collegeEducationId: branch.collegeEducationId || undefined,
      },
    ]),
  );
}

async function getEducationMap(educationIds: number[]) {
  if (educationIds.length === 0) return new Map<number, string>();

  const { data, error } = await supabase
    .from("college_education")
    .select("collegeEducationId,collegeEducationType")
    .in("collegeEducationId", educationIds);

  if (error) {
    console.error("Failed to fetch placement company education names:", error);
    return new Map<number, string>();
  }

  return new Map(
    ((data ?? []) as EducationRow[]).map((education) => [
      education.collegeEducationId,
      education.collegeEducationType || "",
    ]),
  );
}

async function getAcademicYearMap(academicYearIds: number[]) {
  if (academicYearIds.length === 0) return new Map<number, string>();

  const { data, error } = await supabase
    .from("college_academic_year")
    .select("collegeAcademicYearId,collegeAcademicYear")
    .in("collegeAcademicYearId", academicYearIds);

  if (error) {
    console.error("Failed to fetch placement company academic years:", error);
    return new Map<number, string>();
  }

  return new Map(
    ((data ?? []) as AcademicYearRow[]).map((academicYear) => [
      academicYear.collegeAcademicYearId,
      academicYear.collegeAcademicYear || "",
    ]),
  );
}

function mapRowsToCompanies(
  rows: PlacementCompanyRow[],
  branchInfoMap: Map<number, BranchInfo>,
  educationMap: Map<number, string>,
  academicYearMap: Map<number, string>,
): PlacementCompany[] {
  const groupedCompanies = new Map<string, PlacementCompany>();

  rows.forEach((row) => {
    const groupKey = getCompanyGroupKey(row);
    const existingCompany = groupedCompanies.get(groupKey);

    if (existingCompany) {
      const certificateUrl = getStorageUrl(
        "placement-certificates",
        row.companyCertificate,
      );

      if (!existingCompany.attachments.includes(certificateUrl)) {
        existingCompany.attachments.push(certificateUrl);
      }
      if (!existingCompany.placementCompanyIds?.includes(row.placementCompanyId)) {
        existingCompany.placementCompanyIds?.push(row.placementCompanyId);
      }
      return;
    }

    const jobType = formatJobType(row.jobType);
    const packageDetails = formatPackage(row.annualPackage);
    const locations = splitLocations(row.location);
    const locationTag = locations.join(", ");
    const companyLogoUrl = getStorageUrl("placement-logos", row.companyLogo);
    const certificateUrl = getStorageUrl(
      "placement-certificates",
      row.companyCertificate,
    );
    const branchInfo = branchInfoMap.get(row.collegeBranchId);
    const collegeEducationId = branchInfo?.collegeEducationId;

    groupedCompanies.set(groupKey, {
      id: row.placementCompanyId,
      name: row.companyName,
      role: row.jobRoleOffered,
      description: row.companyJobDescription,
      longDescription: row.companyJobDescription,
      skills: row.requiredSkills ?? [],
      tags: [jobType, locationTag, packageDetails].filter(Boolean),
      email: row.companyEmail,
      phone: row.companyPhone || "Not provided",
      website: row.companyWebsite,
      packageDetails,
      driveType: formatDriveType(row.driveType),
      driveTypeValue: row.driveType,
      jobTypeValue: row.jobType,
      workMode: formatWorkMode(row.workMode),
      workModeValue: row.workMode,
      eligibilityCriteria: row.eligibilityCriteria,
      collegeEducationId,
      educationTypeName: collegeEducationId
        ? educationMap.get(collegeEducationId)
        : undefined,
      collegeId: row.collegeId,
      collegeBranchId: row.collegeBranchId,
      branchName: branchInfo?.name || undefined,
      collegeAcademicYearId: row.collegeAcademicYearId,
      academicYear: academicYearMap.get(row.collegeAcademicYearId) || undefined,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      placementCompanyIds: [row.placementCompanyId],
      studentsPlaced: 0,
      locations,
      attachments: [certificateUrl],
      logo: companyLogoUrl,
      startDate: row.startDate,
      endDate: row.endDate,
      isExpired: row.endDate < getTodayDateString(),
    });
  });

  return Array.from(groupedCompanies.values());
}

export async function getPlacementCompanies(
  params: PlacementCompanyPaginatedParams,
): Promise<PlacementCompanyPaginatedResult>;
export async function getPlacementCompanies(
  params: PlacementCompanyUnpaginatedParams,
): Promise<PlacementCompany[]>;
export async function getPlacementCompanies({
  collegeId,
  placementOfficerId,
  includeExpired = false,
  page,
  pageSize,
  cycle,
  branchName,
  status,
  sortBy,
}: PlacementCompanyPaginatedParams | PlacementCompanyUnpaginatedParams) {
  const today = getTodayDateString();
  const now = new Date().toISOString();

  let expireQuery = supabase
    .from("placement_companies")
    .update({
      is_deleted: true,
      deletedAt: now,
      updatedAt: now,
    })
    .eq("collegeId", collegeId)
    .eq("is_deleted", false)
    .lt("endDate", today);

  if (placementOfficerId) {
    expireQuery = expireQuery.eq("createdBy", placementOfficerId);
  }

  const { error: expireError } = await expireQuery;

  if (expireError) {
    console.error("Failed to auto delete expired placement companies:", expireError);
  }

  let branchIdsForFilter: number[] = [];

  if (branchName && branchName !== "All") {
    const { data: branchRows, error: branchError } = await supabase
      .from("college_branch")
      .select("collegeBranchId")
      .or(`collegeBranchCode.eq.${branchName},collegeBranchType.eq.${branchName}`);

    if (branchError) {
      console.error("Failed to fetch placement branch filter:", branchError);
      throw branchError;
    }

    branchIdsForFilter = ((branchRows ?? []) as Pick<BranchRow, "collegeBranchId">[]).map(
      (branch) => branch.collegeBranchId,
    );
  }

  let query = supabase
    .from("placement_companies")
    .select(
      "placementCompanyId,companyName,companyEmail,companyPhone,companyJobDescription,companyWebsite,jobRoleOffered,requiredSkills,jobType,workMode,location,annualPackage,driveType,companyLogo,companyCertificate,startDate,endDate,eligibilityCriteria,collegeId,collegeBranchId,collegeAcademicYearId,createdBy,is_deleted,createdAt",
      { count: "exact" },
    )
    .eq("collegeId", collegeId);

  if (!includeExpired) {
    query = query.eq("is_deleted", false);
  } else if (!status || status === "All") {
    query = query.or(`is_deleted.eq.false,endDate.lt.${today}`);
  }

  if (status === "Open") {
    query = query.eq("is_deleted", false).gte("endDate", today);
  } else if (status === "Completed") {
    query = query.lt("endDate", today);
  }

  if (cycle) {
    query = query.gte("startDate", `${cycle}-01-01`).lte("startDate", `${cycle}-12-31`);
  }

  if (branchName && branchName !== "All") {
    if (branchIdsForFilter.length === 0) {
      return page && pageSize ? { data: [], totalCount: 0 } : [];
    }

    query = query.in("collegeBranchId", branchIdsForFilter);
  }

  if (placementOfficerId) {
    query = query.eq("createdBy", placementOfficerId);
  }

  switch (sortBy) {
    case "Oldest First":
      query = query.order("createdAt", { ascending: true });
      break;
    case "Company Name A-Z":
      query = query.order("companyName", { ascending: true });
      break;
    case "Company Name Z-A":
      query = query.order("companyName", { ascending: false });
      break;
    case "CTC (High to Low)":
      query = query.order("annualPackage", { ascending: false });
      break;
    case "CTC (Low to High)":
      query = query.order("annualPackage", { ascending: true });
      break;
    case "Recently Uploaded":
    default:
      query = query.order("createdAt", { ascending: false });
      break;
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch placement companies:", error);
    throw error;
  }

  const rows = ((data ?? []) as PlacementCompanyRow[]).filter(
    (row) => !row.is_deleted || row.endDate < today,
  );
  const branchIds = Array.from(
    new Set(rows.map((row) => row.collegeBranchId).filter(Boolean)),
  );
  const academicYearIds = Array.from(
    new Set(rows.map((row) => row.collegeAcademicYearId).filter(Boolean)),
  );

  const branchInfoMap = await getBranchInfoMap(branchIds);
  const educationIds = Array.from(
    new Set(
      Array.from(branchInfoMap.values())
        .map((branchInfo) => branchInfo.collegeEducationId)
        .filter(Boolean),
    ),
  ) as number[];

  const [educationMap, academicYearMap] = await Promise.all([
    getEducationMap(educationIds),
    getAcademicYearMap(academicYearIds),
  ]);

  const companies = mapRowsToCompanies(rows, branchInfoMap, educationMap, academicYearMap);

  if (page && pageSize) {
    const from = (page - 1) * pageSize;

    return {
      data: companies.slice(from, from + pageSize),
      totalCount: companies.length,
    };
  }

  return companies;
}
