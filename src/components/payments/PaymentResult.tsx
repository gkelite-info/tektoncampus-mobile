import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";
import { MotiView } from "moti";
import { Check, X } from "phosphor-react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import * as Haptics from "expo-haptics";

interface ResultProps {
    onBack: () => void;
}

export function PaymentSuccessful({ onBack }: ResultProps) {
    const { t } = useTranslation();

    React.useEffect(() => {
        // Trigger a very noticeable native SUCCESS vibration pattern
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Follow up with light synchronized impacts for the confetti falling
        const hapticInterval = setInterval(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 150);

        setTimeout(() => {
            clearInterval(hapticInterval);
        }, 1000);

        return () => clearInterval(hapticInterval);
    }, []);

    return (
        <View className="flex-1 bg-white items-center justify-center p-6">
            <View className="absolute inset-0 pointer-events-none z-50">
                <ConfettiCannon
                    count={200}
                    origin={{ x: 200, y: 0 }}
                    autoStart={true}
                    fadeOut={true}
                    fallSpeed={2500}
                />
            </View>
            <MotiView
                from={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 rounded-full bg-emerald-100 items-center justify-center mb-6"
            >
                <MotiView
                    from={{ scale: 0, rotate: "-45deg" }}
                    animate={{ scale: 1, rotate: "0deg" }}
                    transition={{ type: "spring", delay: 200, stiffness: 200 }}
                >
                    <Check size={48} color="#059669" weight="bold" />
                </MotiView>
            </MotiView>

            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
                {t("Payments.student.Payment Successful!")}
            </Text>
            <Text className="text-gray-500 text-center mb-8 px-4">
                {t("Payments.student.Your payment has been processed successfully. A receipt will be available in your transaction history shortly.")}
            </Text>

            <TouchableOpacity
                onPress={onBack}
                className="bg-[#14b8a6] px-8 py-3.5 rounded-xl w-full max-w-sm"
            >
                <Text className="text-white text-center font-medium text-base">
                    {t("Payments.student.Back to Dashboard")}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

export function PaymentCancelled({ onBack }: ResultProps) {
    const { t } = useTranslation();

    return (
        <View className="flex-1 bg-white items-center justify-center p-6">
            <MotiView
                from={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 rounded-full bg-red-100 items-center justify-center mb-6"
            >
                <MotiView
                    from={{ scale: 0, rotate: "45deg" }}
                    animate={{ scale: 1, rotate: "0deg" }}
                    transition={{ type: "spring", delay: 200, stiffness: 200 }}
                >
                    <X size={48} color="#DC2626" weight="bold" />
                </MotiView>
            </MotiView>

            <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
                {t("Payments.student.Payment Cancelled")}
            </Text>
            <Text className="text-gray-500 text-center mb-8 px-4">
                {t("Payments.student.Your payment process was cancelled or failed. No amount was deducted.")}
            </Text>

            <TouchableOpacity
                onPress={onBack}
                className="bg-gray-900 px-8 py-3.5 rounded-xl w-full max-w-sm"
            >
                <Text className="text-white text-center font-medium text-base">
                    {t("Payments.student.Try Again")}
                </Text>
            </TouchableOpacity>
        </View>
    );
}
