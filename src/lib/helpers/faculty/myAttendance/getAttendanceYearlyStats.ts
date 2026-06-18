import { supabase } from "@/lib/supabaseClient";

export async function getAttendanceYearlyStats(userId:number, year:number){

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } =
    await supabase
      .from("attendance_daily")
      .select(`
        attendanceDate,
        status
      `)
      .eq("userId", userId)
      .gte("attendanceDate", startDate)
      .lte("attendanceDate", endDate);

  if(error) throw error;

  const monthlyMap =
    Array(12)
      .fill(0)
      .map(()=>({
        attendance:0,
        performance:0
      }));

  data?.forEach(row=>{
    const month =
      new Date(
        row.attendanceDate
      ).getMonth();

    monthlyMap[month].attendance += 1;

    if(row.status === "PRESENT" || row.status === "LATE"){
      monthlyMap[month].performance += 100;
    }

  });

  return monthlyMap.map(
    (m,i)=>({
      month:
        [
          "Jan","Feb","Mar","Apr",
          "May","Jun","Jul","Aug",
          "Sep","Oct","Nov","Dec"
        ][i],
      attendance: m.attendance,
      performance:
        m.attendance
          ? Math.round(
              m.performance/
              m.attendance
            )
          : 0
    })
  );

}
