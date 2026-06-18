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
  createdAt: string;
  is_deleted: boolean | null;
};

type BranchRow = {
  collegeBranchId: number;
  collegeEducationId: number | null;
  collegeBranchCode: string | null;
  collegeBranchType: string | null;
};

type AcademicYearRow = {
  collegeAcademicYearId: number;
  collegeAcademicYear: string | null;
};

export type StudentPlacementCompany = {
  id: number;
  placementCompanyIds: number[];
  companyName: string;
  role: string;
  description: string;
  longDescription: string;
  skills: string[];
  email: string;
  phone: string;
  website: string;
  packageDetails: string;
  driveType: string;
  jobType: string;
  workMode: string;
  location: string;
  locations: string[];
  logoUrl: string;
  startDate: string;
  endDate: string;
  eligibilityCriteria: string;
  collegeId: number;
  collegeEducationId?: number;
  collegeBranchId: number;
  branchName?: string;
  collegeAcademicYearId: number;
  academicYear?: string;
  createdAt: string;
  attachments: string[];
  isEligible: boolean;
  isExpired: boolean;
};

type FetchStudentPlacementCompaniesParams = {
  collegeId: number;
  collegeEducationId: number;
  collegeBranchId: number;
  collegeAcademicYearId: number;
};

function getStorageUrl(bucket: "placement-logos" | "placement-certificates", path: string) {
  if (path.startsWith("http")) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

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
    .split(/[,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
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

async function getBranchMap(branchIds: number[]) {
  if (branchIds.length === 0) return new Map<number, BranchRow>();

  const { data, error } = await supabase
    .from("college_branch")
    .select("collegeBranchId,collegeEducationId,collegeBranchCode,collegeBranchType")
    .in("collegeBranchId", branchIds);

  if (error) {
    console.error("Failed to fetch student placement branches:", error);
    return new Map<number, BranchRow>();
  }

  return new Map(
    ((data ?? []) as BranchRow[]).map((branch) => [
      branch.collegeBranchId,
      branch,
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
    console.error("Failed to fetch student placement academic years:", error);
    return new Map<number, string>();
  }

  return new Map(
    ((data ?? []) as AcademicYearRow[]).map((academicYear) => [
      academicYear.collegeAcademicYearId,
      academicYear.collegeAcademicYear || "",
    ]),
  );
}

export async function fetchStudentPlacementCompanies({
  collegeId,
  collegeEducationId,
  collegeBranchId,
  collegeAcademicYearId,
}: FetchStudentPlacementCompaniesParams) {
  const today = getTodayDateString();

  const { data, error } = await supabase
    .from("placement_companies")
    .select(
      "placementCompanyId,companyName,companyEmail,companyPhone,companyJobDescription,companyWebsite,jobRoleOffered,requiredSkills,jobType,workMode,location,annualPackage,driveType,companyLogo,companyCertificate,startDate,endDate,eligibilityCriteria,collegeId,collegeBranchId,collegeAcademicYearId,createdBy,createdAt,is_deleted",
    )
    .eq("collegeId", collegeId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Failed to fetch student placement companies:", error);
    throw error;
  }

  const rows = (data ?? []) as PlacementCompanyRow[];
  const branchIds = Array.from(
    new Set(rows.map((row) => row.collegeBranchId).filter(Boolean)),
  );
  const academicYearIds = Array.from(
    new Set(rows.map((row) => row.collegeAcademicYearId).filter(Boolean)),
  );

  const [branchMap, academicYearMap] = await Promise.all([
    getBranchMap(branchIds),
    getAcademicYearMap(academicYearIds),
  ]);

  const groupedCompanies = new Map<string, StudentPlacementCompany>();

  rows.forEach((row) => {
    const isExpired = row.endDate < today;

    if (row.is_deleted && !isExpired) return;

    const branch = branchMap.get(row.collegeBranchId);
    const rowEducationId = branch?.collegeEducationId;

    if (typeof rowEducationId === "number" && rowEducationId !== collegeEducationId) {
      return;
    }

    const isEligible =
      row.collegeBranchId === collegeBranchId &&
      row.collegeAcademicYearId === collegeAcademicYearId;

    const groupKey = getCompanyGroupKey(row);
    const existingCompany = groupedCompanies.get(groupKey);
    const certificateUrl = getStorageUrl(
      "placement-certificates",
      row.companyCertificate,
    );

    if (existingCompany) {
      if (!existingCompany.attachments.includes(certificateUrl)) {
        existingCompany.attachments.push(certificateUrl);
      }
      if (!existingCompany.placementCompanyIds.includes(row.placementCompanyId)) {
        existingCompany.placementCompanyIds.push(row.placementCompanyId);
      }
      return;
    }

    const locations = splitLocations(row.location);

    groupedCompanies.set(groupKey, {
      id: row.placementCompanyId,
      placementCompanyIds: [row.placementCompanyId],
      companyName: row.companyName,
      role: row.jobRoleOffered,
      description: row.companyJobDescription,
      longDescription: row.companyJobDescription,
      skills: row.requiredSkills ?? [],
      email: row.companyEmail,
      phone: row.companyPhone || "Not provided",
      website: row.companyWebsite,
      packageDetails: formatPackage(row.annualPackage),
      driveType: formatDriveType(row.driveType),
      jobType: formatJobType(row.jobType),
      workMode: formatWorkMode(row.workMode),
      location: locations.join(", ") || row.location,
      locations,
      logoUrl: getStorageUrl("placement-logos", row.companyLogo),
      startDate: row.startDate,
      endDate: row.endDate,
      eligibilityCriteria: row.eligibilityCriteria,
      collegeId: row.collegeId,
      collegeEducationId: rowEducationId || undefined,
      collegeBranchId: row.collegeBranchId,
      branchName: branch?.collegeBranchCode || branch?.collegeBranchType || undefined,
      collegeAcademicYearId: row.collegeAcademicYearId,
      academicYear: academicYearMap.get(row.collegeAcademicYearId) || undefined,
      createdAt: row.createdAt,
      attachments: [certificateUrl],
      isEligible,
      isExpired,
    });
  });

  return Array.from(groupedCompanies.values());
}
