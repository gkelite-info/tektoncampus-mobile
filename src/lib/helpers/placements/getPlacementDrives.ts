import type {
  PlacementCompany,
  PlacementDrive,
  PlacementStudentRow,
} from "@/app/(screens)/placement/placements/components/mockData";
import { supabase } from "@/lib/supabaseClient";

type StudentApplicationRow = {
  studentPlacementApplicationId: number;
  studentId: number;
  placementCompanyId: number;
  status: string | null;
  students?:
    | {
    studentId: number;
    userId: number | null;
    collegeId: number | null;
    collegeEducationId: number | null;
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
    student_academic_history?: {
      isCurrent: boolean | null;
      deletedAt: string | null;
      college_academic_year?: {
        collegeAcademicYear: string | null;
      } | null;
    }[];
  }
    | {
        studentId: number;
        userId: number | null;
        collegeId: number | null;
        collegeEducationId: number | null;
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
        student_academic_history?: {
          isCurrent: boolean | null;
          deletedAt: string | null;
          college_academic_year?: {
            collegeAcademicYear: string | null;
          } | null;
        }[];
      }[]
    | null;
};

type StudentPinRow = {
  studentId: number;
  pinNumber: string | null;
};

type StudentCountRow = {
  collegeEducationId: number | null;
  collegeBranchId: number | null;
  student_academic_history?:
    | {
        collegeAcademicYearId: number | null;
      }
    | {
        collegeAcademicYearId: number | null;
      }[]
    | null;
};

type StudentNameBranchLike = {
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
};

type DriveStudentRow = {
  studentId: number;
  userId: number | null;
  collegeId: number | null;
  collegeEducationId: number | null;
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
        collegeAcademicYearId: number | null;
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
        collegeAcademicYearId: number | null;
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
};

export type PlacementDriveStatusFilter = "All" | "Active" | "Completed";

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date?: string) {
  if (!date) return "-";

  const parsedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
}

function isDriveCompleted(drive: PlacementCompany) {
  return Boolean(drive.endDate && drive.endDate < getTodayDateString());
}

function getBranchName(student: StudentNameBranchLike | StudentNameBranchLike[]) {
  const normalizedStudent = Array.isArray(student) ? student[0] : student;
  const branch = Array.isArray(normalizedStudent.college_branch)
    ? normalizedStudent.college_branch[0]
    : normalizedStudent.college_branch;

  return (
    branch?.collegeBranchCode ||
    branch?.collegeBranchType ||
    "-"
  );
}

function getCurrentAcademicYear(
  student: NonNullable<StudentApplicationRow["students"]>,
) {
  const normalizedStudent = Array.isArray(student) ? student[0] : student;
  const currentHistory = normalizedStudent.student_academic_history?.find(
    (history) => history.isCurrent && !history.deletedAt,
  );

  return currentHistory?.college_academic_year?.collegeAcademicYear || "-";
}

function getStudentName(student: StudentNameBranchLike | StudentNameBranchLike[]) {
  const normalizedStudent = Array.isArray(student) ? student[0] : student;
  const user = Array.isArray(normalizedStudent.users)
    ? normalizedStudent.users[0]
    : normalizedStudent.users;

  return user?.fullName || "";
}

function getStudentStatus(application: StudentApplicationRow, isEligible: boolean) {
  if (!isEligible) return "Not Eligible";
  return application.status === "applied" ? "Applied" : application.status || "Applied";
}

function getAcademicYearLabel(
  history:
    | NonNullable<DriveStudentRow["student_academic_history"]>
    | undefined
    | null,
) {
  const currentHistory = Array.isArray(history) ? history[0] : history;
  const academicYear = Array.isArray(currentHistory?.college_academic_year)
    ? currentHistory?.college_academic_year[0]
    : currentHistory?.college_academic_year;

  return academicYear?.collegeAcademicYear || "-";
}

async function fetchApplicationsByPlacementIds(placementCompanyIds: number[]) {
  if (placementCompanyIds.length === 0) {
    return [] as StudentApplicationRow[];
  }

  const { data, error } = await supabase
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
          collegeId,
          collegeEducationId,
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
        )
      `,
    )
    .in("placementCompanyId", placementCompanyIds)
    .eq("status", "applied");

  if (error) {
    console.error("Failed to fetch placement drive applications:", error);
    throw error;
  }

  return (data ?? []) as unknown as StudentApplicationRow[];
}

async function fetchStudentPins(studentIds: number[], collegeId: number) {
  if (studentIds.length === 0) {
    return new Map<number, string>();
  }

  const { data, error } = await supabase
    .from("student_pins")
    .select("studentId,pinNumber")
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .is("deletedAt", null)
    .in("studentId", studentIds);

  if (error) {
    console.error("Failed to fetch placement drive student pins:", error);
    return new Map<number, string>();
  }

  return new Map(
    ((data ?? []) as StudentPinRow[]).map((pin) => [
      pin.studentId,
      pin.pinNumber || String(pin.studentId),
    ]),
  );
}

function getStudentCountKey({
  collegeEducationId,
  collegeBranchId,
  collegeAcademicYearId,
}: {
  collegeEducationId?: number | null;
  collegeBranchId?: number | null;
  collegeAcademicYearId?: number | null;
}) {
  return `${collegeEducationId ?? ""}|${collegeBranchId ?? ""}|${collegeAcademicYearId ?? ""}`;
}

async function fetchEligibleStudentCountMap(
  companies: PlacementCompany[],
  collegeId: number,
) {
  const educationIds = Array.from(
    new Set(companies.map((company) => company.collegeEducationId).filter(Boolean)),
  ) as number[];
  const branchIds = Array.from(
    new Set(companies.map((company) => company.collegeBranchId).filter(Boolean)),
  ) as number[];
  const academicYearIds = Array.from(
    new Set(
      companies.map((company) => company.collegeAcademicYearId).filter(Boolean),
    ),
  ) as number[];

  if (
    educationIds.length === 0 ||
    branchIds.length === 0 ||
    academicYearIds.length === 0
  ) {
    return new Map<string, number>();
  }

  const { data, error } = await supabase
    .from("students")
    .select(
      `
        collegeEducationId,
        collegeBranchId,
        student_academic_history!inner (
          collegeAcademicYearId
        )
      `,
    )
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .is("deletedAt", null)
    .in("collegeEducationId", educationIds)
    .in("collegeBranchId", branchIds)
    .eq("student_academic_history.isCurrent", true)
    .is("student_academic_history.deletedAt", null)
    .in("student_academic_history.collegeAcademicYearId", academicYearIds);

  if (error) {
    console.error("Failed to fetch placement drive student counts:", error);
    return new Map<string, number>();
  }

  return ((data ?? []) as unknown as StudentCountRow[]).reduce((countMap, row) => {
    const history = Array.isArray(row.student_academic_history)
      ? row.student_academic_history[0]
      : row.student_academic_history;
    const key = getStudentCountKey({
      collegeEducationId: row.collegeEducationId,
      collegeBranchId: row.collegeBranchId,
      collegeAcademicYearId: history?.collegeAcademicYearId,
    });

    countMap.set(key, (countMap.get(key) ?? 0) + 1);
    return countMap;
  }, new Map<string, number>());
}

export async function fetchPlacementDriveStudents({
  collegeId,
  collegeEducationId,
  collegeBranchId,
  collegeAcademicYearId,
  placementCompanyIds,
  companyName,
  role,
  packageDetails,
  page,
  limit,
}: {
  collegeId: number;
  collegeEducationId: number;
  collegeBranchId: number;
  collegeAcademicYearId: number;
  placementCompanyIds: number[];
  companyName: string;
  role: string;
  packageDetails: string;
  page: number;
  limit: number;
}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const [applications, studentsResponse] = await Promise.all([
    fetchApplicationsByPlacementIds(placementCompanyIds),
    supabase
      .from("students")
      .select(
        `
          studentId,
          userId,
          collegeId,
          collegeEducationId,
          collegeBranchId,
          users:userId (
            fullName
          ),
          college_branch:collegeBranchId (
            collegeBranchCode,
            collegeBranchType
          ),
          student_academic_history!inner (
            isCurrent,
            deletedAt,
            collegeAcademicYearId,
            college_academic_year:collegeAcademicYearId (
              collegeAcademicYear
            )
          )
        `,
        { count: "exact" },
      )
      .eq("collegeId", collegeId)
      .eq("collegeEducationId", collegeEducationId)
      .eq("collegeBranchId", collegeBranchId)
      .eq("isActive", true)
      .is("deletedAt", null)
      .eq("student_academic_history.isCurrent", true)
      .is("student_academic_history.deletedAt", null)
      .eq("student_academic_history.collegeAcademicYearId", collegeAcademicYearId)
      .order("studentId", { ascending: true })
      .range(from, to),
  ]);

  if (studentsResponse.error) {
    console.error("Failed to fetch placement drive students:", studentsResponse.error);
    throw studentsResponse.error;
  }

  const studentRows = (studentsResponse.data ?? []) as unknown as DriveStudentRow[];
  const studentIds = studentRows.map((student) => student.studentId);
  const pinMap = await fetchStudentPins(studentIds, collegeId);
  const applicationsByStudentId = new Map(
    applications.map((application) => [application.studentId, application]),
  );

  const rows = studentRows.map((student) => {
    const application = applicationsByStudentId.get(student.studentId);

    return {
      id: student.studentId,
      studentName: getStudentName(student),
      studentId: pinMap.get(student.studentId) || String(student.studentId),
      branch: getBranchName(student),
      year: getAcademicYearLabel(student.student_academic_history),
      role,
      company: companyName,
      package: packageDetails,
      joiningDate: "-",
      status: application?.status === "applied" ? "Applied" : "Eligible",
    } satisfies PlacementStudentRow;
  });

  return {
    students: rows,
    totalCount: studentsResponse.count ?? 0,
    currentPageCount: rows.length,
  };
}

export function getPlacementDriveStats(drives: PlacementDrive[]) {
  const totalDrives = drives.length;
  const completedDrives = drives.filter((drive) => drive.isCompleted).length;
  const activeDrives = totalDrives - completedDrives;

  return [
    {
      label: String(totalDrives),
      value: String(totalDrives),
      note: "Total Drives",
      cardClass: "bg-[#FFE8CC]",
    },
    {
      label: String(activeDrives),
      value: String(activeDrives),
      note: "Active Drives",
      cardClass: "bg-[#DFF7E7]",
    },
    {
      label: String(completedDrives),
      value: String(completedDrives),
      note: "Completed Drives",
      cardClass: "bg-[#D8EAFE]",
    },
  ];
}

export function filterPlacementDrives({
  drives,
  educationId,
  branchId,
  status,
}: {
  drives: PlacementDrive[];
  educationId?: number | null;
  branchId?: number | null;
  status: PlacementDriveStatusFilter;
}) {
  return drives.filter((drive) => {
    if (educationId && drive.collegeEducationId !== educationId) return false;
    if (branchId && drive.collegeBranchId !== branchId) return false;
    if (status === "Active") return !drive.isCompleted;
    if (status === "Completed") return Boolean(drive.isCompleted);
    return true;
  });
}

export async function mapCompaniesToPlacementDrives(
  companies: PlacementCompany[],
  collegeId: number,
) {
  const placementIds = Array.from(
    new Set(
      companies.flatMap((company) => company.placementCompanyIds ?? [company.id]),
    ),
  );
  const applications = await fetchApplicationsByPlacementIds(placementIds);
  const studentIds = Array.from(
    new Set(applications.map((application) => application.studentId)),
  );
  const pinMap = await fetchStudentPins(studentIds, collegeId);
  const eligibleStudentCountMap = await fetchEligibleStudentCountMap(
    companies,
    collegeId,
  );
  const applicationsByPlacementId = new Map<number, StudentApplicationRow[]>();

  applications.forEach((application) => {
    const current = applicationsByPlacementId.get(application.placementCompanyId) ?? [];
    current.push(application);
    applicationsByPlacementId.set(application.placementCompanyId, current);
  });

  return companies.map((company) => {
    const companyPlacementIds = company.placementCompanyIds ?? [company.id];
    const companyApplications = companyPlacementIds.flatMap(
      (placementId) => applicationsByPlacementId.get(placementId) ?? [],
    );
    const eligibleStudentCount =
      eligibleStudentCountMap.get(
        getStudentCountKey({
          collegeEducationId: company.collegeEducationId,
          collegeBranchId: company.collegeBranchId,
          collegeAcademicYearId: company.collegeAcademicYearId,
        }),
      ) ?? 0;

    const students: PlacementStudentRow[] = companyApplications.map((application) => {
      const student = Array.isArray(application.students)
        ? application.students[0]
        : application.students;
      const isEligible =
        student?.collegeId === company.collegeId &&
        student?.collegeEducationId === company.collegeEducationId &&
        student?.collegeBranchId === company.collegeBranchId;

      return {
        id: application.studentPlacementApplicationId,
        studentName: student ? getStudentName(student) : `Student ${application.studentId}`,
        studentId: pinMap.get(application.studentId) || String(application.studentId),
        branch: student ? getBranchName(student) : "-",
        year: student ? getCurrentAcademicYear(student) : "-",
        role: company.role,
        company: company.name,
        package: company.packageDetails,
        joiningDate: formatDate(company.startDate),
        status: getStudentStatus(application, isEligible),
      };
    });

    return {
      id: company.id,
      driveName: `${company.name} ${company.role}`,
      companyName: company.name,
      date: formatDate(company.startDate),
      branch: company.branchName || "All Branch",
      eligibleStudents: eligibleStudentCount,
      applied: students.length,
      placed: students.filter((student) =>
        ["placed", "joined"].includes(student.status.toLowerCase()),
      ).length,
      students,
      collegeId: company.collegeId,
      collegeEducationId: company.collegeEducationId,
      educationTypeName: company.educationTypeName,
      collegeBranchId: company.collegeBranchId,
      collegeAcademicYearId: company.collegeAcademicYearId,
      placementCompanyIds: companyPlacementIds,
      role: company.role,
      packageDetails: company.packageDetails,
      isCompleted: isDriveCompleted(company),
    } satisfies PlacementDrive;
  });
}
