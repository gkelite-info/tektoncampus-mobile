import { supabase } from "@/lib/supabaseClient";

export type EduTypeFeeSegment = {
  collegeEducationId: number;
  eduType: string;
  totalAmount: number;
  collected: number;
  pending: number;
};

export type FeeCollectionTrend = {
  segments: EduTypeFeeSegment[];
  grandTotal: number;
  grandExpected: number;
};

export async function fetchFeeCollectionTrend(
  collegeId: number
): Promise<FeeCollectionTrend> {


  const { data: eduList, error: eduError } = await supabase
    .from("college_education")
    .select("collegeEducationId, collegeEducationType")
    .eq("collegeId", collegeId)
    .eq("isActive", true);

  if (eduError) throw eduError;
  if (!eduList || eduList.length === 0) {
    return { segments: [], grandTotal: 0, grandExpected: 0 };
  }

  const eduIds = eduList.map((e) => e.collegeEducationId);

  const { data: obligations, error: oblError } = await supabase
    .from("student_fee_obligation")
    .select("studentFeeObligationId, collegeEducationId, totalAmount")
    .in("collegeEducationId", eduIds)
    .eq("isActive", true);

  if (oblError) throw oblError;
  if (!obligations || obligations.length === 0) {
    return { segments: [], grandTotal: 0, grandExpected: 0 };
  }

  const obligationIds = obligations.map((o) => o.studentFeeObligationId);

  const { data: transactions, error: txError } = await supabase
    .from("student_payment_transaction")
    .select("studentPaymentTransactionId, studentFeeObligationId, paymentStatus")
    .in("studentFeeObligationId", obligationIds)
    .eq("paymentStatus", "success");

  if (txError) throw txError;

  const successTxIds = (transactions ?? []).map(
    (t) => t.studentPaymentTransactionId
  );

  let ledgerEntries: { studentFeeObligationId: number; amount: string }[] = [];

  if (successTxIds.length > 0) {
    const { data: ledger, error: ledgerError } = await supabase
      .from("student_fee_ledger")
      .select("studentFeeObligationId, amount, studentPaymentTransactionId")
      .in("studentPaymentTransactionId", successTxIds);

    if (ledgerError) throw ledgerError;
    ledgerEntries = ledger ?? [];
  }

  const segments: EduTypeFeeSegment[] = eduList.map((edu) => {
    const eduObligations = obligations.filter(
      (o) => o.collegeEducationId === edu.collegeEducationId
    );
    const eduObligationIds = new Set(
      eduObligations.map((o) => o.studentFeeObligationId)
    );

    const totalAmount = eduObligations.reduce(
      (sum, o) => sum + parseFloat(o.totalAmount),
      0
    );

    const collected = ledgerEntries
      .filter((l) => eduObligationIds.has(l.studentFeeObligationId))
      .reduce((sum, l) => sum + parseFloat(l.amount), 0);

    const pending = Math.max(0, totalAmount - collected);

    return {
      collegeEducationId: edu.collegeEducationId,
      eduType:            edu.collegeEducationType,
      totalAmount,
      collected,
      pending,
    };
  });

  const grandTotal    = segments.reduce((s, seg) => s + seg.collected, 0);
  const grandExpected = segments.reduce((s, seg) => s + seg.totalAmount, 0);

  return { segments, grandTotal, grandExpected };
}

export function formatINR(amount: number): string {
  if (amount >= 1_00_00_000) {
    const val = amount / 1_00_00_000;
    const str = parseFloat(val.toFixed(2)).toString();
    return `${str} Cr`;
  }
  if (amount >= 1_00_000) {
    const val = amount / 1_00_000;
    if (amount % 1_00_000 < 500) {
      return `${parseFloat(val.toFixed(1))} L`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    if (amount % 1_000 < 50) {
      return `${parseFloat(val.toFixed(1))} K`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}
