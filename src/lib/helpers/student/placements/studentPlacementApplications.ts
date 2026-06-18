import { supabase } from "@/lib/supabaseClient";

export type StudentPlacementApplicationStatus =
  | "applied"
  | "withdrawn"
  | "selected"
  | "rejected";

export type StudentPlacementApplication = {
  studentPlacementApplicationId: number;
  studentId: number;
  placementCompanyId: number;
  status: StudentPlacementApplicationStatus;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: number | null;
};

type StudentPlacementApplicationParams = {
  studentId: number;
  placementCompanyId: number;
};

const APPLICATION_SELECT =
  "studentPlacementApplicationId,studentId,placementCompanyId,status,appliedAt,createdAt,updatedAt,updatedBy";

function formatAppliedDate(date?: string | null) {
  const parsedDate = date ? new Date(date) : new Date();

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export function mapApplicationToAppliedPlacement(
  application: StudentPlacementApplication,
) {
  return {
    placementId: application.placementCompanyId,
    appliedOn: formatAppliedDate(application.appliedAt || application.createdAt),
  };
}

export async function fetchStudentPlacementApplications(studentId: number) {
  const { data, error } = await supabase
    .from("student_placement_applications")
    .select(APPLICATION_SELECT)
    .eq("studentId", studentId)
    .eq("status", "applied")
    .order("appliedAt", { ascending: false });

  if (error) {
    console.error("Failed to fetch student placement applications:", error);
    throw error;
  }

  return (data ?? []) as StudentPlacementApplication[];
}

export async function applyForStudentPlacement({
  studentId,
  placementCompanyId,
}: StudentPlacementApplicationParams) {
  const now = new Date().toISOString();

  const { data: existingApplication, error: existingError } = await supabase
    .from("student_placement_applications")
    .select("studentPlacementApplicationId")
    .eq("studentId", studentId)
    .eq("placementCompanyId", placementCompanyId)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to check student placement application:", existingError);
    throw existingError;
  }

  if (existingApplication) {
    const { data, error } = await supabase
      .from("student_placement_applications")
      .update({
        status: "applied",
        appliedAt: now,
        updatedAt: now,
      })
      .eq("studentPlacementApplicationId", existingApplication.studentPlacementApplicationId)
      .select(APPLICATION_SELECT)
      .single();

    if (error) {
      console.error("Failed to update student placement application:", error);
      throw error;
    }

    return data as StudentPlacementApplication;
  }

  const { data, error } = await supabase
    .from("student_placement_applications")
    .insert({
      studentId,
      placementCompanyId,
      status: "applied",
      appliedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .select(APPLICATION_SELECT)
    .single();

  if (error) {
    console.error("Failed to create student placement application:", error);
    throw error;
  }

  return data as StudentPlacementApplication;
}

export async function withdrawStudentPlacementApplication({
  studentId,
  placementCompanyId,
}: StudentPlacementApplicationParams) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("student_placement_applications")
    .update({
      status: "withdrawn",
      updatedAt: now,
    })
    .eq("studentId", studentId)
    .eq("placementCompanyId", placementCompanyId)
    .select(APPLICATION_SELECT)
    .maybeSingle();

  if (!error) return (data ?? null) as StudentPlacementApplication | null;

  console.warn(
    "Could not mark placement application as withdrawn; deleting application row instead.",
    error,
  );

  const { error: deleteError } = await supabase
    .from("student_placement_applications")
    .delete()
    .eq("studentId", studentId)
    .eq("placementCompanyId", placementCompanyId);

  if (deleteError) {
    console.error("Failed to withdraw student placement application:", deleteError);
    throw deleteError;
  }

  return null;
}

export async function updateStudentPlacementApplicationStatus({
  studentPlacementApplicationId,
  status,
  updatedBy,
}: {
  studentPlacementApplicationId: number;
  status: Extract<StudentPlacementApplicationStatus, "selected" | "rejected">;
  updatedBy: number;
}) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("student_placement_applications")
    .update({
      status,
      updatedAt: now,
      updatedBy,
    })
    .eq("studentPlacementApplicationId", studentPlacementApplicationId)
    .select(APPLICATION_SELECT)
    .single();

  if (error) {
    console.error("Failed to update student placement application status:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw error;
  }

  return data as StudentPlacementApplication;
}
