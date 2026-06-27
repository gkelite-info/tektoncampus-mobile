import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";
import { WarningCircle } from "phosphor-react-native";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/utils/context/UserContext";
import SharedPaymentDashboard from "@/components/payments/SharedPaymentDashboard";
import PaymentsSkeleton from "@/components/payments/PaymentsSkeleton";

export default function ParentPayment() {
    const { t } = useTranslation();
    const { userId, role, loading: userLoading } = useUser();

    const [childUserId, setChildUserId] = useState<number | null>(null);
    const [childProfilePhoto, setChildProfilePhoto] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchChildData = async () => {
            if (userLoading) return;
            if (!userId || role !== "Parent") {
                setError(t("Payments.parent.Not authorized"));
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                // 1. Get Parent Record -> studentId
                const { data: parentRecord, error: parentError } = await supabase
                    .from("parents")
                    .select("studentId")
                    .eq("userId", userId)
                    .eq("is_deleted", false)
                    .maybeSingle();

                if (parentError || !parentRecord?.studentId) {
                    throw new Error("Could not find linked student");
                }

                // 2. Get Student Record -> userId
                const { data: studentRecord, error: studentError } = await supabase
                    .from("students")
                    .select("userId")
                    .eq("studentId", parentRecord.studentId)
                    .maybeSingle();

                if (studentError || !studentRecord?.userId) {
                    throw new Error("Could not find student account");
                }

                setChildUserId(studentRecord.userId);

                // 3. Get Student Profile Photo (Optional)
                const { data: profileRecord } = await supabase
                    .from("user_profile")
                    .select("profileUrl")
                    .eq("userId", studentRecord.userId)
                    .maybeSingle();

                if (profileRecord?.profileUrl) {
                    setChildProfilePhoto(profileRecord.profileUrl);
                }

            } catch (err: any) {
                console.error("Failed to load child data:", err);
                setError(err.message || "Failed to load linked student data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchChildData();
    }, [userId, role, userLoading, t]);

    if (isLoading) {
        return <PaymentsSkeleton />;
    }

    if (error || !childUserId) {
        return (
            <View className="flex-1 bg-[#F5F5F7] items-center justify-center p-6">
                <View className="bg-white rounded-xl p-8 items-center max-w-md shadow-sm border border-gray-100">
                    <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-4">
                        <WarningCircle size={32} color="#DC2626" weight="fill" />
                    </View>
                    <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
                        {t("Payments.parent.Student Not Found")}
                    </Text>
                    <Text className="text-gray-500 text-center">
                        {error || t("Payments.parent.We couldn't find a student account linked to this parent profile.")}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <SharedPaymentDashboard
            targetUserId={childUserId}
            profilePhoto={childProfilePhoto}
            isStudent={false}
        />
    );
}