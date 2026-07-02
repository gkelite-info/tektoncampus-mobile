import { supabase } from "@/lib/supabaseClient";

export async function fetchTodayCollectionAmount(collegeId: number) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from("student_payment_transaction")
      .select(
        `
        paidAmount,
        student_fee_obligation!inner (
          students!inner (
            collegeId
          )
        )
      `,
      )
      .eq("paymentStatus", "success")
      .eq("student_fee_obligation.students.collegeId", collegeId)
      .gte("createdAt", startOfToday.toISOString())
      .lt("createdAt", startOfTomorrow.toISOString());

    if (error) {
      console.error("Supabase query error fetching collections:", error);
      return 0;
    }

    const totalCollected = data.reduce(
      (sum, trx) => sum + (Number(trx.paidAmount) || 0),
      0,
    );

    return totalCollected;
  } catch (error) {
    console.error("Error calculating today's collections:", error);
    return 0;
  }
}
