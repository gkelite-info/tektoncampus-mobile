import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export function recalculateAttendancePercentage(
  oldAttendance: string,
  newRecordStatus: string,
  oldStats: { present: number; total: number }
) {
  const isPresentStatus = (status: string) => status === "PRESENT" || status === "LATE";
  const wasPresent = oldAttendance === "Present" || oldAttendance === "Late";
  const isNowPresent = isPresentStatus(newRecordStatus);
  const wasNotMarked = oldAttendance === "Not Marked";

  let newPresent = oldStats.present;
  let newTotal = oldStats.total;

  if (wasNotMarked) {
    newTotal += 1;
    if (isNowPresent) newPresent += 1;
  } else {
    if (wasPresent && !isNowPresent) newPresent -= 1;
    else if (!wasPresent && isNowPresent) newPresent += 1;
  }

  const percentage = newTotal > 0 ? Math.round((newPresent / newTotal) * 100) : 0;
  return { newStats: { present: newPresent, total: newTotal }, newPercentage: `${percentage}%` };
}

export function useAttendanceRealtime(
  calendarEventId: number | null,
  isBulk: boolean,
  onAttendanceMarked: (payload: any) => void
) {
  const callbackRef = useRef(onAttendanceMarked);

  useEffect(() => {
    callbackRef.current = onAttendanceMarked;
  }, [onAttendanceMarked]);

  useEffect(() => {
    if (!calendarEventId) return;

    const channel = supabase
      .channel(`public:attendance_record:${isBulk ? 'bulk-' : ''}eventId=${calendarEventId}`, {
        config: { broadcast: { self: false, ack: false } },
      })
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT and UPDATE
          schema: "public",
          table: "attendance_record",
        },
        (payload: any) => {
          const rec = payload.new;
          if (rec) {
            const matches = isBulk 
              ? rec.bulkCalendarEventId === calendarEventId 
              : rec.calendarEventId === calendarEventId;
            if (matches) {
              callbackRef.current(payload);
            }
          }
        }
      )
      .on("broadcast", { event: "new_attendance" }, ({ payload }) => {
        callbackRef.current({ new: payload });
      })
      .subscribe((status, err) => {
        if (err) {
          console.error("Realtime subscription error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [calendarEventId]);
}

export function useAdminAttendanceRealtime(
  onAttendanceMarked: (payload: any) => void
) {
  const callbackRef = useRef(onAttendanceMarked);

  useEffect(() => {
    callbackRef.current = onAttendanceMarked;
  }, [onAttendanceMarked]);

  useEffect(() => {
    const channel = supabase
      .channel(`public:attendance_record:admin`, {
        config: { broadcast: { self: false, ack: false } },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_record",
        },
        (payload) => {
          callbackRef.current(payload);
        }
      )
      .on("broadcast", { event: "new_attendance" }, ({ payload }) => {
        callbackRef.current({ new: payload });
      })
      .subscribe((status, err) => {
        if (err) {
          console.error("Admin Realtime subscription error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
