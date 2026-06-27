import { supabase } from "@/lib/supabaseClient";

export type NativePaymentPayload = {
    studentFeeObligationId: number;
    collegeSemesterId?: number;
    semesterAllocations?: { collegeSemesterId: number; amount: number }[];
    gatewayTransactionId: string; 
    amount: number;
    paymentMode: string;
    paymentType?: string;
};

export async function processNativePaymentSuccess(payload: NativePaymentPayload) {
    try {
        const { data: existingTxn } = await supabase
            .from("student_payment_transaction")
            .select("studentPaymentTransactionId")
            .eq("gatewayTransactionId", payload.gatewayTransactionId)
            .single();

        let transactionId: number;
        const now = new Date().toISOString();

        if (existingTxn) {
            transactionId = existingTxn.studentPaymentTransactionId;
            await supabase
                .from("student_payment_transaction")
                .update({ paymentStatus: "success", updatedAt: now })
                .eq("studentPaymentTransactionId", transactionId);
        } else {
            const { data: newTxn, error: txnError } = await supabase
                .from("student_payment_transaction")
                .insert({
                    studentFeeObligationId: payload.studentFeeObligationId,
                    gatewayTransactionId: payload.gatewayTransactionId,
                    gatewayOrderId: payload.gatewayTransactionId,
                    paidAmount: payload.amount,
                    paymentMode: payload.paymentMode || "card",
                    paymentStatus: "success",
                    initiatedBy: "Student",
                    createdAt: now,
                    updatedAt: now,
                })
                .select("studentPaymentTransactionId")
                .single();

            if (txnError) throw txnError;
            transactionId = newTxn.studentPaymentTransactionId;
        }

        const { data: existingLedger, error: ledgerCheckError } = await supabase
            .from("student_fee_ledger")
            .select("studentFeeLedgerId")
            .eq("studentPaymentTransactionId", transactionId)
            .single();

        if (ledgerCheckError && ledgerCheckError.code !== "PGRST116") throw ledgerCheckError;

        if (!existingLedger) {
            const { error: ledgerError } = await supabase
                .from("student_fee_ledger")
                .insert({
                    studentFeeObligationId: payload.studentFeeObligationId,
                    studentPaymentTransactionId: transactionId,
                    amount: payload.amount,
                    remarks: "Stripe direct payment via App",
                    createdAt: now,
                    updatedAt: now,
                });
            if (ledgerError) throw ledgerError;
        }

        const { data: existingCollection, error: collectionCheckError } = await supabase
            .from("student_fee_collection")
            .select("studentFeeCollectionId")
            .eq("studentPaymentTransactionId", transactionId)
            .limit(1);

        if (collectionCheckError) throw collectionCheckError;

        if (!existingCollection || existingCollection.length === 0) {
            const allocations = payload.semesterAllocations?.length 
                ? payload.semesterAllocations 
                : [{ collegeSemesterId: payload.collegeSemesterId!, amount: payload.amount }];

            const collectionsToInsert = allocations.map(alloc => ({
                studentFeeObligationId: payload.studentFeeObligationId,
                collegeSemesterId: alloc.collegeSemesterId,
                studentPaymentTransactionId: transactionId,
                collectedAmount: alloc.amount,
                createdAt: now,
                updatedAt: now,
            }));

            const { error: collectionError } = await supabase
                .from("student_fee_collection")
                .insert(collectionsToInsert);
                
            if (collectionError) throw collectionError;
        }

        return { success: true, transactionId };
    } catch (error) {
        console.error("Native Payment processing error:", error);
        return { success: false, error };
    }
}
