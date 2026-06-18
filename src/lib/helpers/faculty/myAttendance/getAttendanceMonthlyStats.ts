import { supabase } from "@/lib/supabaseClient";

interface Props {
  userId: number;
  month: number;
  year: number;
}

export async function getAttendanceMonthlyStats({
  userId,
  month,
  year,
}: Props) {

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate =
    `${year}-${String(month).padStart(2, "0")}-${String(
      new Date(year, month, 0).getDate()
    ).padStart(2, "0")}`;
  const today = new Date().toISOString().split("T")[0];

  const [
    { data: todayRow, error: todayError },
    { count: workingDays, error: countError }
  ] =
    await Promise.all([
      supabase
        .from("attendance_daily")
        .select("status")
        .eq("userId", userId)
        .eq("attendanceDate", today)
        .maybeSingle(),
      supabase
        .from("attendance_daily")
        .select("*", { count: "exact", head: true })
        .eq("userId", userId)
        .gte("attendanceDate", startDate)
        .lte("attendanceDate", endDate)
        .in("status", ["PRESENT", "LATE"])
    ]);

  if (todayError) throw todayError;
  if (countError) throw countError;

  return {
    todayStatus:
      todayRow?.status ?? "Not Marked",

    totalWorkingDays:
      workingDays ?? 0,
  };

}
