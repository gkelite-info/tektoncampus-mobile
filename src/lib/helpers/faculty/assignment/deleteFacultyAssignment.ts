import { supabase } from "@/lib/supabaseClient";

export const deleteFacultyAssignment = async (assignmentId: number) => {
  try {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("assignments")
      .update({
        is_deleted: true,
        deletedAt: now,
        status: "Cancelled",
      })
      .eq("assignmentId", assignmentId);

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error("DELETE ERROR:", err.message);
    return { success: false, error: err.message };
  }
};
