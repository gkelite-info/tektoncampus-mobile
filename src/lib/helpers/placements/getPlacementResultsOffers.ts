import type {
  ChartBarItem,
  PlacementStudentRow,
} from "@/app/(screens)/placement/placements/components/mockData";
import { supabase } from "@/lib/supabaseClient";

type PlacementApplicationRow = {
  studentPlacementApplicationId: number;
  studentId: number;
  placementCompanyId: number;
  status: string | null;
  students?:
    | {
        studentId: number;
        userId: number | null;
        collegeBranchId: number | null;
        users?:
          | {
              fullName: string | null;
            }
          | {
              fullName: string | null;
            }[]
          | null;
        college_branch?:
          | {
              collegeBranchCode: string | null;
              collegeBranchType: string | null;
            }
          | {
              collegeBranchCode: string | null;
              collegeBranchType: string | null;
            }[]
          | null;
        student_academic_history?:
          | {
              isCurrent: boolean | null;
              deletedAt: string | null;
              college_academic_year?:
                | {
                    collegeAcademicYear: string | null;
                  }
                | {
                    collegeAcademicYear: string | null;
                  }[]
                | null;
            }
          | {
              isCurrent: boolean | null;
              deletedAt: string | null;
              college_academic_year?:
                | {
                    collegeAcademicYear: string | null;
                  }
                | {
                    collegeAcademicYear: string | null;
                  }[]
                | null;
            }[]
          | null;
      }
    | {
        studentId: number;
        userId: number | null;
        collegeBranchId: number | null;
        users?:
          | {
              fullName: string | null;
            }
          | {
              fullName: string | null;
            }[]
          | null;
        college_branch?:
          | {
              collegeBranchCode: string | null;
              collegeBranchType: string | null;
            }
          | {
              collegeBranchCode: string | null;
              collegeBranchType: string | null;
            }[]
          | null;
        student_academic_history?:
          | {
              isCurrent: boolean | null;
              deletedAt: string | null;
              college_academic_year?:
                | {
                    collegeAcademicYear: string | null;
                  }
                | {
                    collegeAcademicYear: string | null;
                  }[]
                | null;
            }
          | {
              isCurrent: boolean | null;
              deletedAt: string | null;
              college_academic_year?:
                | {
                    collegeAcademicYear: string | null;
                  }
                | {
                    collegeAcademicYear: string | null;
                  }[]
                | null;
            }[]
          | null;
      }[]
    | null;
  placement_companies?:
    | {
        placementCompanyId: number;
        companyName: string | null;
        jobRoleOffered: string | null;
        annualPackage: string | number | null;
        createdBy: number | null;
      }
    | {
        placementCompanyId: number;
        companyName: string | null;
        jobRoleOffered: string | null;
        annualPackage: string | number | null;
        createdBy: number | null;
      }[]
    | null;
};

type StudentPinRow = {
  studentId: number;
  pinNumber: string | null;
};

export type PlacementResultsOffersData = {
  companyStats: ChartBarItem[];
  branchStats: ChartBarItem[];
  placedStudents: PlacementStudentRow[];
};

function normalizeOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatPackage(value: string | number | null | undefined) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value ? String(value) : "-";
  return `${amount.toLocaleString("en-IN")} Lpa`;
}

function getStudentName(row: PlacementApplicationRow) {
  const student = normalizeOne(row.students);
  const user = normalizeOne(student?.users);

  return user?.fullName || `Student ${row.studentId}`;
}

function getBranchName(row: PlacementApplicationRow) {
  const student = normalizeOne(row.students);
  const branch = normalizeOne(student?.college_branch);

  return branch?.collegeBranchCode || branch?.collegeBranchType || "-";
}

function getCurrentYear(row: PlacementApplicationRow) {
  const student = normalizeOne(row.students);
  const histories = student?.student_academic_history;
  const currentHistory = Array.isArray(histories)
    ? histories.find((history) => history.isCurrent && !history.deletedAt)
    : histories;
  const academicYear = normalizeOne(currentHistory?.college_academic_year);

  return academicYear?.collegeAcademicYear || "-";
}

async function fetchStudentPins(studentIds: number[], collegeId: number) {
  if (studentIds.length === 0) return new Map<number, string>();

  const { data, error } = await supabase
    .from("student_pins")
    .select("studentId,pinNumber")
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .is("deletedAt", null)
    .in("studentId", studentIds);

  if (error) {
    console.error("Failed to fetch results/offers student pins:", error);
    return new Map<number, string>();
  }

  return new Map(
    ((data ?? []) as StudentPinRow[]).map((pin) => [
      pin.studentId,
      pin.pinNumber || String(pin.studentId),
    ]),
  );
}

function buildStats(rows: PlacementStudentRow[]) {
  const companyCounts = new Map<string, number>();
  const branchCounts = new Map<string, number>();

  rows.filter((row) => row.status === "Selected").forEach((row) => {
    companyCounts.set(row.company, (companyCounts.get(row.company) ?? 0) + 1);
    branchCounts.set(row.branch, (branchCounts.get(row.branch) ?? 0) + 1);
  });

  return {
    companyStats: Array.from(companyCounts.entries()).map(([label, value]) => ({
      label,
      value,
    })),
    branchStats: Array.from(branchCounts.entries()).map(([label, value]) => ({
      label,
      value,
    })),
  };
}

export async function getPlacementResultsOffers({
  collegeId,
  placementOfficerId,
}: {
  collegeId: number;
  placementOfficerId?: number | null;
}): Promise<PlacementResultsOffersData> {
  let query = supabase
    .from("student_placement_applications")
    .select(
      `
        studentPlacementApplicationId,
        studentId,
        placementCompanyId,
        status,
        students:studentId (
          studentId,
          userId,
          collegeBranchId,
          users:userId (
            fullName
          ),
          college_branch:collegeBranchId (
            collegeBranchCode,
            collegeBranchType
          ),
          student_academic_history (
            isCurrent,
            deletedAt,
            college_academic_year:collegeAcademicYearId (
              collegeAcademicYear
            )
          )
        ),
        placement_companies:placementCompanyId!inner (
          placementCompanyId,
          companyName,
          jobRoleOffered,
          annualPackage,
          createdBy
        )
      `,
    )
    .neq("status", "withdrawn")
    .eq("placement_companies.collegeId", collegeId)
    .eq("placement_companies.is_deleted", false)
    .order("studentPlacementApplicationId", { ascending: false });

  if (placementOfficerId) {
    query = query.eq("placement_companies.createdBy", placementOfficerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch placement results/offers:", error);
    throw error;
  }

  const rows = (data ?? []) as unknown as PlacementApplicationRow[];
  const pinMap = await fetchStudentPins(
    Array.from(new Set(rows.map((row) => row.studentId))),
    collegeId,
  );
  const placedStudents = rows.map((row) => {
    const company = normalizeOne(row.placement_companies);

    return {
      id: row.studentPlacementApplicationId,
      studentName: getStudentName(row),
      studentId: pinMap.get(row.studentId) || String(row.studentId),
      branch: getBranchName(row),
      year: getCurrentYear(row),
      role: company?.jobRoleOffered || "-",
      company: company?.companyName || "-",
      package: formatPackage(company?.annualPackage),
      joiningDate: "-",
      status:
        row.status === "placed"
          ? "Selected"
          : row.status === "selected"
          ? "Selected"
          : row.status === "rejected"
            ? "Rejected"
            : "Applied",
    } satisfies PlacementStudentRow;
  });
  const stats = buildStats(placedStudents);

  return {
    ...stats,
    placedStudents,
  };
}
