import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";
import { MotiView, AnimatePresence } from "moti";
import { useHeaderHeight } from "@react-navigation/elements";
import PaymentsSkeleton from "./PaymentsSkeleton";
import ProfileCard from "./ProfileCard";
import AcademicFees from "./AcademicFees";
import AdditionalDues from "./AdditionalDues";
import PaymentHistory from "./PaymentHistory";
import PaymentConfirm from "./PaymentConfirm";
import { PaymentSuccessful, PaymentCancelled } from "./PaymentResult";
import { generateSemesterReceipt } from "@/utils/generateReceipt";

import { fetchStudentFeePlan } from "@/lib/helpers/payments/fetchStudentFeePlan";
import { fetchStudentPaymentHistory } from "@/lib/helpers/payments/fetchStudentPaymentHistory";
import { fetchStudentProfileCardData } from "@/lib/helpers/payments/fetchStudentProfileCardData";
import { ExtendedFeePlan, FeeSummaryItem, ProfileCardProps } from "./types";

interface SharedPaymentDashboardProps {
    targetUserId: number;
    profilePhoto: string | null;
    isStudent: boolean;
}

type TabType = "ACADEMIC" | "ADDITIONAL" | "HISTORY";

export default function SharedPaymentDashboard({
    targetUserId,
    profilePhoto,
    isStudent,
}: SharedPaymentDashboardProps) {
    const { t } = useTranslation();
    const headerHeight = useHeaderHeight();

    const [activeTab, setActiveTab] = useState<TabType>("ACADEMIC");
    const [isLoading, setIsLoading] = useState(true);

    const [profileData, setProfileData] = useState<Omit<ProfileCardProps, "image"> | null>(null);
    const [feePlan, setFeePlan] = useState<ExtendedFeePlan | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<FeeSummaryItem[]>([]);

    // Flow states
    const [paymentState, setPaymentState] = useState<"DASHBOARD" | "CONFIRM" | "SUCCESS" | "CANCELLED">("DASHBOARD");
    const [paymentContext, setPaymentContext] = useState<{
        amount: number;
        type: "ACADEMIC" | "FINANCIAL" | "NON_FINANCIAL" | "EXCESS";
        dueId?: string | number | number[];
    } | null>(null);

    const tabs = [
        { id: "ACADEMIC", label: t("Payments.student.Academic Fees") },
        { id: "ADDITIONAL", label: t("Payments.student.Additional Dues") },
        { id: "HISTORY", label: t("Payments.student.History") },
    ] as const;

    React.useEffect(() => {
        if (paymentState === "DASHBOARD") {
            const loadDashboardData = async () => {
                try {
                    setIsLoading(true); // Force loading overlay during refresh
                    const studentId = targetUserId || user?.id;
                    if (!studentId) return;

                    // 1. Fetch Profile
                    const profile = await fetchStudentProfileCardData(studentId);
                    setProfileData(profile);

                    // 2. Fetch Fee Plan
                    const plan = await fetchStudentFeePlan(studentId);
                    if (plan) setFeePlan(plan);

                    // 3. Fetch History (if we have a plan)
                    if (plan?.studentFeeObligationId) {
                        const history = await fetchStudentPaymentHistory(plan.studentFeeObligationId);
                        setPaymentHistory(history);
                    }
                } catch (err) {
                    console.error("Dashboard refresh error:", err);
                } finally {
                    setIsLoading(false);
                }
            };

            loadDashboardData();
        }
    }, [targetUserId, paymentState]);

    const handlePayInitiate = (
        amount: number,
        type: "ACADEMIC" | "FINANCIAL" | "NON_FINANCIAL" | "EXCESS",
        dueId?: string | number | number[]
    ) => {
        setPaymentContext({ amount, type, dueId });
        setPaymentState("CONFIRM");
    };

    const handleDownloadReceipt = (item: FeeSummaryItem) => {
        if (!profileData || !feePlan) return;

        // Find the semester associated with this payment, or default to the current/first one
        const sem = feePlan.semesters?.find((s: any) => s.semesterId === item.semesterId) || feePlan.semesters?.[0] || {};
        
        generateSemesterReceipt(
            feePlan,
            sem,
            { name: profileData.name, rollNo: profileData.course?.split('|')[0]?.trim() || "N/A" },
            [item] // Pass only this specific transaction to the receipt
        );
    };

    if (isLoading) {
        return <PaymentsSkeleton />;
    }

    if (paymentState === "CONFIRM" && paymentContext && feePlan) {
        return (
            <PaymentConfirm
                plan={feePlan}
                customAmount={paymentContext.amount}
                paymentType={paymentContext.type}
                dueId={paymentContext.dueId}
                onCancel={() => setPaymentState("DASHBOARD")}
                onSuccess={() => setPaymentState("SUCCESS")}
            />
        );
    }

    if (paymentState === "SUCCESS") {
        return <PaymentSuccessful onBack={() => setPaymentState("DASHBOARD")} />;
    }

    if (paymentState === "CANCELLED") {
        return <PaymentCancelled onBack={() => setPaymentState("DASHBOARD")} />;
    }

    return (
        <ScrollView 
            className="flex-1 bg-[#F5F5F7]"
            contentContainerStyle={{ paddingTop: headerHeight + 16, paddingBottom: 40 }}
        >
            <View className="p-4 md:p-6">
                {/* Header (Desktop only in NextJS, so we just show standard spacing) */}
                <View className="mb-6">
                    <Text className="text-2xl font-bold text-gray-900 mb-2">
                        {t("Payments.student.Payments Dashboard")}
                    </Text>
                    <Text className="text-gray-500">
                        {t("Payments.student.Manage your fees and transaction history.")}
                    </Text>
                </View>

                {/* Profile Card */}
                {profileData && (
                    <ProfileCard {...profileData} image={profilePhoto} />
                )}

                {/* Dashboard Card */}
                <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                    {/* Tabs */}
                    <View className="p-4 border-b border-gray-100">
                        <View className="flex-row bg-gray-100/80 rounded-full p-1 relative">
                            {/* Animated Background Pill */}
                            <MotiView
                                className="absolute rounded-full bottom-1 top-1"
                                style={{ 
                                    width: `${100 / tabs.length}%`,
                                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(16, 185, 129, 0.3)'
                                }}
                                animate={{
                                    left: `${(tabs.findIndex(t => t.id === activeTab) * 100) / tabs.length}%`
                                }}
                                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                            />
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <TouchableOpacity
                                        key={tab.id}
                                        onPress={() => setActiveTab(tab.id)}
                                        className="flex-1 py-2.5 items-center justify-center z-10"
                                    >
                                        <Text className={`font-medium text-sm ${isActive ? "text-emerald-800 font-bold" : "text-gray-500"}`}>
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Tab Content */}
                    <View className="p-4 md:p-6 min-h-[400px]">
                        {activeTab === "ACADEMIC" && feePlan && profileData && (
                            <AcademicFees
                                plan={feePlan}
                                history={paymentHistory}
                                profilePhoto={profilePhoto}
                                studentName={profileData.name}
                                courseInfo={profileData.course}
                                onPayPress={(amt, semId) => handlePayInitiate(amt, "ACADEMIC", semId)}
                            />
                        )}

                        {activeTab === "ADDITIONAL" && (
                            <AdditionalDues
                                financialDues={[]}
                                nonFinancialDues={[]}
                                excessDues={[]}
                                onPayPress={(amt, id) => handlePayInitiate(amt, "FINANCIAL", id)}
                            />
                        )}

                        {activeTab === "HISTORY" && (
                            <PaymentHistory
                                history={paymentHistory}
                                onDownloadReceipt={handleDownloadReceipt}
                            />
                        )}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
