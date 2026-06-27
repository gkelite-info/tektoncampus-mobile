import React, { useState, useRef } from "react";
import { View, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";
import { CaretLeft, CreditCard, QrCode, ShieldCheck, CheckCircle } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import { useHeaderHeight } from "@react-navigation/elements";
import { ExtendedFeePlan, FeeComponent } from "./types";
import { formatCurrency } from "./utils";
import { processNativePaymentSuccess } from "@/lib/helpers/payments/processNativePaymentSuccess";

interface PaymentConfirmProps {
    plan: ExtendedFeePlan;
    dueId?: string | number | number[];
    customAmount: number;
    paymentType: "ACADEMIC" | "FINANCIAL" | "NON_FINANCIAL" | "EXCESS";
    onCancel: () => void;
    onSuccess?: () => void;
}

export default function PaymentConfirm({
    plan,
    dueId,
    customAmount,
    paymentType,
    onCancel,
    onSuccess,
}: PaymentConfirmProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const processingSuccessRef = useRef(false);
    const [selectedMethod, setSelectedMethod] = useState<"card" | "upi" | "netbanking">("card");
    const [showWebView, setShowWebView] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
    const headerHeight = useHeaderHeight();

    // Recalculate component ratios based on the custom amount being paid
    // so we can show a proportional breakdown.
    const proportionalComponents: FeeComponent[] = plan.components.map((comp) => ({
        label: comp.label,
        amount: Math.round((comp.amount / plan.totalPayable) * customAmount),
    }));

    const proportionalGst = Math.round((plan.gstAmount / plan.totalPayable) * customAmount);

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            const secretKey = process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
            
            if (!secretKey) {
                throw new Error("Stripe Secret Key is missing from .env! (Please add EXPO_PUBLIC_STRIPE_SECRET_KEY)");
            }

            // We intercept these URLs using WebView, so they just need to be valid HTTPS URLs
            const successUrl = "https://example.com/payments/successful";
            const cancelUrl = "https://example.com/payments/cancelled";

            // Construct x-www-form-urlencoded payload for Stripe API
            const body = new URLSearchParams({
                'payment_method_types[0]': 'card',
                'mode': 'payment',
                'line_items[0][price_data][currency]': 'inr',
                'line_items[0][price_data][product_data][name]': 'College Fee Payment',
                'line_items[0][price_data][unit_amount]': (customAmount * 100).toString(),
                'line_items[0][quantity]': '1',
                'metadata[studentFeeObligationId]': plan.studentFeeObligationId?.toString() || '',
                'metadata[collegeSemesterIds]': Array.isArray(dueId) ? dueId.join(',') : (plan.collegeSemesterId?.toString() || ''),
                'success_url': `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
                'cancel_url': cancelUrl
            });

            // Make Direct API call to Stripe (No Backend Required)
            const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Bearer ${secretKey}`
                },
                body: body.toString()
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Payment initiation failed");
            }

            if (data.url) {
                setCheckoutUrl(data.url);
                setShowWebView(true);
            } else {
                throw new Error("No payment URL received");
            }

        } catch (error: any) {
            console.error("Payment Error:", error);
            Toast.show({
                type: "error",
                text1: t("Payments.student.Payment Error"),
                text2: error.message || t("Payments.student.Failed to initiate payment. Please try again."),
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (showWebView && checkoutUrl) {
        return (
            <View className="flex-1 bg-white" style={{ paddingTop: headerHeight }}>
                <View className="flex-row items-center p-4 border-b border-gray-100 bg-white">
                    <TouchableOpacity onPress={() => setShowWebView(false)} className="flex-row items-center">
                        <CaretLeft size={20} color="#374151" className="mr-1" />
                        <Text className="text-gray-700 font-medium">
                            {t("Payments.student.Cancel Payment")}
                        </Text>
                    </TouchableOpacity>
                </View>
                <WebView 
                    source={{ uri: checkoutUrl }} 
                    onNavigationStateChange={async (navState) => {
                        // The moment Stripe tries to redirect to the success or cancel URL,
                        // we intercept it immediately before it even tries to load!
                        if (navState.url.includes('/payments/successful')) {
                            // PREVENT DOUBLE EXECUTION
                            if (processingSuccessRef.current) return;
                            processingSuccessRef.current = true;

                            setShowWebView(false);
                            setIsConfirming(true); // Show full screen loader!
                            
                            // Parse session ID from URL
                            const urlParams = new URL(navState.url);
                            const sessionId = urlParams.searchParams.get('session_id') || 'manual_sync_required';

                            // Show processing toast while DB updates
                            Toast.show({ type: "info", text1: "Processing payment...", text2: "Updating your records." });

                            let semesterAllocations: { collegeSemesterId: number; amount: number }[] = [];
                            if (paymentType === "ACADEMIC" && Array.isArray(dueId) && plan.semesterRoadmap) {
                                semesterAllocations = plan.semesterRoadmap
                                    .filter(sem => dueId.includes(sem.semesterId))
                                    .map(sem => ({ collegeSemesterId: sem.semesterId, amount: sem.pendingAmount }));
                            } else if (paymentType === "ACADEMIC" && typeof dueId === "number") {
                                semesterAllocations = [{ collegeSemesterId: dueId, amount: customAmount }];
                            }

                            const result = await processNativePaymentSuccess({
                                studentFeeObligationId: plan.studentFeeObligationId,
                                semesterAllocations: semesterAllocations.length > 0 ? semesterAllocations : undefined,
                                collegeSemesterId: plan.collegeSemesterId,
                                gatewayTransactionId: sessionId,
                                amount: customAmount,
                                paymentMode: "card",
                                paymentType: paymentType
                            });

                            setIsConfirming(false);

                            if (result.success) {
                                if (onSuccess) onSuccess();
                            } else {
                                Toast.show({ type: "error", text1: "Payment Sync Failed", text2: "Please contact administration." });
                                processingSuccessRef.current = false;
                            }
                        } else if (navState.url.includes('/payments/cancelled')) {
                            setShowWebView(false);
                            Toast.show({ type: "info", text1: "Payment cancelled" });
                        }
                    }}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View className="absolute inset-0 items-center justify-center bg-white">
                            <ActivityIndicator size="large" color="#10B981" />
                        </View>
                    )}
                />
            </View>
        );
    }

    if (isConfirming) {
        return (
            <View className="flex-1 bg-white items-center justify-center p-6">
                <ActivityIndicator size="large" color="#10B981" />
                <Text className="text-lg font-bold text-gray-900 mt-6 text-center">
                    {t("Payments.student.Confirming Payment...")}
                </Text>
                <Text className="text-gray-500 text-center mt-2 px-4">
                    {t("Payments.student.Please wait while we securely verify your transaction with the bank.")}
                </Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ paddingTop: headerHeight }}>
            <View className="p-4 space-y-6 gap-y-6">
                
                {/* Back Button */}
                <TouchableOpacity onPress={onCancel} className="flex-row items-center gap-2">
                    <CaretLeft size={16} weight="bold" color="#6B7280" />
                    <Text className="text-gray-500 font-medium text-sm">
                        {t("Payments.student.Back to Fee Details")}
                    </Text>
                </TouchableOpacity>

                {/* Payment Summary Card */}
                <View className="bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
                    <View className="p-5 border-b border-gray-100 bg-gray-50/50">
                        <Text className="text-lg font-bold text-gray-800">
                            {t("Payments.student.Payment Summary")}
                        </Text>
                        <Text className="text-sm text-gray-500 mt-1">
                            {t("Payments.student.Review your fee breakdown before proceeding")}
                        </Text>
                    </View>

                    <View className="p-5 space-y-4 gap-y-4">
                        <View className="flex-row justify-between items-start pb-4 border-b border-gray-100">
                            <View className="flex-1 pr-2">
                                <Text className="font-semibold text-gray-800 text-base">
                                    {plan.programName}
                                </Text>
                                <View className="bg-emerald-100 self-start px-2 py-1 rounded mt-1">
                                    <Text className="text-emerald-700 text-xs font-medium">
                                        {t(`Payments.student.${plan.type || "Academic Fees"}`)}
                                    </Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="text-sm text-gray-500">{t("Payments.student.Academic Year")}</Text>
                                <Text className="font-medium text-gray-800">
                                    {plan.academicYear}
                                </Text>
                            </View>
                        </View>

                        <View className="space-y-3 gap-y-3 pt-2">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-gray-600 text-sm">{t("Payments.student.Opening Balance")}</Text>
                                <Text className="text-gray-900 font-medium text-sm">
                                    {formatCurrency(plan.openingBalance || 0)}
                                </Text>
                            </View>

                            {proportionalComponents.map((comp, idx) => (
                                <View key={idx} className="flex-row justify-between items-center">
                                    <Text className="text-gray-600 text-sm">{comp.label}</Text>
                                    <Text className="text-gray-900 font-medium text-sm">
                                        {formatCurrency(comp.amount)}
                                    </Text>
                                </View>
                            ))}

                            {proportionalGst > 0 && (
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-gray-600 text-sm">
                                        {t("Payments.student.GST")} ({plan.gstPercent}%)
                                    </Text>
                                    <Text className="text-gray-900 font-medium text-sm">
                                        {formatCurrency(proportionalGst)}
                                    </Text>
                                </View>
                            )}

                            {(plan.scholarship || 0) > 0 && (
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-emerald-600 text-sm">{t("Payments.student.Scholarship Applied")}</Text>
                                    <Text className="text-emerald-600 text-sm">- {formatCurrency(plan.scholarship)}</Text>
                                </View>
                            )}

                            <View className="border-t border-dashed border-gray-200 my-1" />

                            <View className="flex-row justify-between items-center pb-1">
                                <Text className="text-gray-600 text-sm">{t("Payments.student.Total Yearly Fee")}</Text>
                                <Text className="text-gray-900 font-medium text-sm">
                                    {formatCurrency(plan.totalPayable)}
                                </Text>
                            </View>

                            <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
                                <Text className="text-gray-600 text-sm">
                                    {t("Payments.student.Yearly Paid Amount")}
                                </Text>
                                <Text className="text-emerald-600 font-medium text-sm">
                                    - {formatCurrency(plan.paidTillNow || 0)}
                                </Text>
                            </View>

                            <View className="flex-row justify-between items-center pt-2">
                                <Text className="text-base font-bold text-gray-800">
                                    {t("Payments.student.Semester Payable")}
                                </Text>
                                <Text className="text-xl font-bold text-emerald-600">
                                    {formatCurrency(customAmount)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View className="flex-row items-center justify-center gap-2 mb-2">
                    <ShieldCheck size={16} weight="fill" color="#D1D5DB" />
                    <Text className="text-gray-400 text-xs">
                        {t("Payments.student.Payments are secure and encrypted")}
                    </Text>
                </View>

                {/* Choose Payment Mode Card */}
                <View className="bg-white rounded-xl border border-gray-100 p-5 mb-8" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
                    <Text className="text-lg font-bold text-gray-800 mb-5">
                        {t("Payments.student.Choose Payment Mode")}
                    </Text>

                    <View className="space-y-3 gap-y-3">
                        <TouchableOpacity
                            onPress={() => setSelectedMethod("card")}
                            activeOpacity={0.7}
                            className={`flex-row items-center p-4 rounded-xl border-2 ${
                                selectedMethod === "card"
                                    ? "border-emerald-500 bg-emerald-50/30"
                                    : "border-gray-100 bg-white"
                            }`}
                        >
                            <View className={`p-2 rounded-lg mr-4 ${selectedMethod === "card" ? "bg-emerald-100" : "bg-gray-100"}`}>
                                <CreditCard size={24} weight={selectedMethod === "card" ? "fill" : "regular"} color={selectedMethod === "card" ? "#059669" : "#6B7280"} />
                            </View>
                            <View className="flex-1">
                                <Text className={`font-semibold text-sm ${selectedMethod === "card" ? "text-emerald-900" : "text-gray-700"}`}>
                                    {t("Payments.student.Credit / Debit Card")}
                                </Text>
                                <Text className="text-xs text-gray-500 mt-0.5">
                                    {t("Payments.student.Visa, Mastercard, Rupay")}
                                </Text>
                            </View>
                            {selectedMethod === "card" && (
                                <CheckCircle size={20} weight="fill" color="#10B981" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setSelectedMethod("upi")}
                            activeOpacity={0.7}
                            className={`flex-row items-center p-4 rounded-xl border-2 ${
                                selectedMethod === "upi"
                                    ? "border-emerald-500 bg-emerald-50/30"
                                    : "border-gray-100 bg-white"
                            }`}
                        >
                            <View className={`p-2 rounded-lg mr-4 ${selectedMethod === "upi" ? "bg-emerald-100" : "bg-gray-100"}`}>
                                <QrCode size={24} weight={selectedMethod === "upi" ? "fill" : "regular"} color={selectedMethod === "upi" ? "#059669" : "#6B7280"} />
                            </View>
                            <View className="flex-1">
                                <Text className={`font-semibold text-sm ${selectedMethod === "upi" ? "text-emerald-900" : "text-gray-700"}`}>
                                    {t("Payments.student.UPI")}
                                </Text>
                                <Text className="text-xs text-gray-500 mt-0.5">
                                    {t("Payments.student.Google Pay, PhonePe, Paytm")}
                                </Text>
                            </View>
                            {selectedMethod === "upi" && (
                                <CheckCircle size={20} weight="fill" color="#10B981" />
                            )}
                        </TouchableOpacity>
                    </View>

                    <View className="mt-6 pt-5 border-t border-gray-100">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-sm text-gray-600">{t("Payments.student.Total to pay")}</Text>
                            <Text className="font-bold text-gray-900">{formatCurrency(customAmount)}</Text>
                        </View>
                        
                        <TouchableOpacity
                            onPress={handlePayment}
                            disabled={isLoading}
                            className="w-full bg-[#10B981] flex-row justify-center items-center py-3.5 px-4 rounded-xl shadow-sm"
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-semibold text-base">
                                    {t("Payments.student.Pay")} {formatCurrency(customAmount)}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
