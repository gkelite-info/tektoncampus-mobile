import { supabase } from "@/lib/supabaseClient";

export interface AttendanceQueryParams {
    userId: number;
    month: number;
    year: number;
    page?: number;
    limit?: number;
}

export async function getAttendanceData({
    userId,
    month,
    year,
    page = 1,
    limit = 15,
}: AttendanceQueryParams) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;

    const endDate =
        `${year}-${String(month).padStart(2, "0")}-${String(
            new Date(year, month, 0).getDate()
        ).padStart(2, "0")}`;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } =
        await supabase
            .from("attendance_daily")
            .select(`
        attendanceDailyId,
        attendanceDate,
        checkIn,
        checkOut,
        totalMinutes,
        status,
        lateByMinutes,
        earlyOutMinutes,
        classesTaken,
        markedReason,
        attendance_adjustments!left(
          newCheckIn,
          newCheckOut,
          reason,
          adjustmentId
        )
      `, { count: "exact" })
            .eq("userId", userId)
            .gte("attendanceDate", startDate)
            .lte("attendanceDate", endDate)
            .order("attendanceDate", {
                ascending: false
            })
            .range(from, to);
            
    if (error) {
        throw error;
    }

    const records =
        (data ?? []).map(row => {
            const latestAdjustment = row.attendance_adjustments?.sort((a: any, b: any) => b.adjustmentId - a.adjustmentId)?.[0];
            const checkIn = latestAdjustment?.newCheckIn ?? row.checkIn;
            const checkOut = latestAdjustment?.newCheckOut ?? row.checkOut;
            const totalMinutes = row.totalMinutes ?? 0;
            const reason = latestAdjustment?.reason ?? row.markedReason ?? "—";

            return {
                date: formatDate(row.attendanceDate),
                checkIn: formatTime(checkIn),
                checkOut: formatTime(checkOut),
                totalHours: totalMinutes ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : "—",
                status: row.status,
                lateBy: row.lateByMinutes ? `${row.lateByMinutes}m` : "—",
                earlyOut: row.earlyOutMinutes ? `${Math.floor(row.earlyOutMinutes / 60)}h ${row.earlyOutMinutes % 60}m` : "—",
                classDetail: row.classesTaken?.toString() ?? "0",
                reason
            };
        });

    return {
        records,
        total: count ?? 0,
    };
}

function formatTime(time?: string | null) {
    if (!time) return "—";
    const [h, m] = time.split(":");
    const hour = Number(h);
    const suffix = hour >= 12 ? "PM" : "AM";
    const formattedHour = ((hour + 11) % 12) + 1;
    return `${formattedHour}:${m} ${suffix}`;
}

function formatDate(date: string) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
}
