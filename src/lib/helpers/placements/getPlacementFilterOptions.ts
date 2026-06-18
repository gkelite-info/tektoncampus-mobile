import { supabase } from "@/lib/supabaseClient";

type PlacementFilterRow = {
  startDate: string | null;
  endDate: string | null;
  collegeBranchId: number | null;
  is_deleted: boolean | null;
};

type BranchRow = {
  collegeBranchId: number;
  collegeEducationId: number | null;
  collegeBranchCode: string | null;
  collegeBranchType: string | null;
};

function getCycleFromStartDate(startDate?: string | null) {
  if (!startDate) return "";

  const parsedDate = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.getFullYear().toString();
}

async function getBranchMap(branchIds: number[]) {
  if (branchIds.length === 0) return new Map<number, BranchRow>();

  const { data, error } = await supabase
    .from("college_branch")
    .select("collegeBranchId,collegeEducationId,collegeBranchCode,collegeBranchType")
    .in("collegeBranchId", branchIds);

  if (error) {
    console.error("Failed to fetch placement filter branches:", error);
    return new Map<number, BranchRow>();
  }

  return new Map(
    ((data ?? []) as BranchRow[]).map((branch) => [
      branch.collegeBranchId,
      branch,
    ]),
  );
}

async function getPlacementFilterRows(collegeId: number) {
  const { data, error } = await supabase
    .from("placement_companies")
    .select("startDate,endDate,collegeBranchId,is_deleted")
    .eq("collegeId", collegeId)
    .order("startDate", { ascending: false });

  if (error) {
    console.error("Failed to fetch placement filter options:", error);
    throw error;
  }

  return (data ?? []) as PlacementFilterRow[];
}

export async function fetchAdminPlacementFilterOptions(collegeId: number) {
  const rows = await getPlacementFilterRows(collegeId);
  const branchIds = Array.from(
    new Set(rows.map((row) => row.collegeBranchId).filter(Boolean)),
  ) as number[];
  const branchMap = await getBranchMap(branchIds);

  const cycles = Array.from(
    new Set(rows.map((row) => getCycleFromStartDate(row.startDate)).filter(Boolean)),
  ).sort((a, b) => Number(b) - Number(a));

  const branches = Array.from(
    new Set(
      branchIds
        .map((branchId) => {
          const branch = branchMap.get(branchId);
          return branch?.collegeBranchCode || branch?.collegeBranchType || "";
        })
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return { cycles, branches };
}

export async function fetchStudentPlacementFilterOptions({
  collegeId,
  collegeEducationId,
}: {
  collegeId: number;
  collegeEducationId: number;
}) {
  const rows = await getPlacementFilterRows(collegeId);
  const branchIds = Array.from(
    new Set(rows.map((row) => row.collegeBranchId).filter(Boolean)),
  ) as number[];
  const branchMap = await getBranchMap(branchIds);

  const cycles = Array.from(
    new Set(
      rows
        .filter((row) => {
          const branch = row.collegeBranchId
            ? branchMap.get(row.collegeBranchId)
            : undefined;

          return branch?.collegeEducationId === collegeEducationId;
        })
        .map((row) => getCycleFromStartDate(row.startDate))
        .filter(Boolean),
    ),
  ).sort((a, b) => Number(b) - Number(a));

  return { cycles };
}
