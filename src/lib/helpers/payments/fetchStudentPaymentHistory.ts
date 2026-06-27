import { supabase } from "@/lib/supabaseClient";
import { FeeSummaryItem, StripePaymentStatus } from "../../components/payments/types";

export async function fetchStudentPaymentHistory(
  studentFeeObligationId: number,
): Promise<FeeSummaryItem[]> {
  const { data, error } = await supabase
    .from("student_payment_transaction")
    .select(
      `
    studentPaymentTransactionId,
    studentFeeObligationId,
    gatewayTransactionId,
    gatewayOrderId,
    paidAmount,
    paymentMode,
    paymentStatus,
    paymentType,
    gatewayResponse,
    proof,
    notes,
    collectedBy,
    paymentDate,
    initiatedBy,
    createdAt,
    updatedAt
  `,
    )
    .eq("studentFeeObligationId", studentFeeObligationId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("fetchStudentPaymentHistory error:", error);
    return [];
  }

  return (
    data?.map((txn) => ({
      id: txn.studentPaymentTransactionId,
      paidAmount: Number(txn.paidAmount),
      paymentMode: txn.paymentMode || extractPaymentMode(txn.gatewayResponse),
      entity: txn.collectedBy ? `Staff (ID: ${txn.collectedBy})` : "Stripe",
      paidOn: new Date(txn.paymentDate || txn.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),

      status: txn.paymentStatus as StripePaymentStatus,

      comments:
        txn.notes ||
        (txn.paymentStatus === "success"
          ? "Payment successful"
          : txn.paymentStatus === "refunded"
            ? "Payment refunded"
            : txn.paymentStatus === "failed"
              ? "Payment failed"
              : txn.paymentStatus),

      paymentType: txn.paymentType,
      proof: txn.proof,
      notes: txn.notes,
      collectedBy: txn.collectedBy,
      initiatedBy: txn.initiatedBy,
      gatewayTransactionId: txn.gatewayTransactionId,
      gatewayOrderId: txn.gatewayOrderId,
    })) ?? []
  );
}

function extractPaymentMode(gatewayResponse: any): string {
  try {
    const response =
      typeof gatewayResponse === "string"
        ? JSON.parse(gatewayResponse)
        : gatewayResponse;

    const method = response?.payment_method_types?.[0];

    if (!method) return "Unknown";

    switch (method) {
      case "card":
        return "Card";

      case "upi":
        return "UPI";

      case "netbanking":
        return "Net Banking";

      case "wallet":
        return "Wallet";

      case "link":
        return "Link";

      default:
        return method;
    }
  } catch {
    return "Unknown";
  }
}
