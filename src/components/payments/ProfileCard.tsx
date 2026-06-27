import React from "react";
import { View } from "react-native";
import { Text } from "@/components/AppText";
import { Avatar } from "@/components/Avatar";
import { useTranslation } from "react-i18next";
import { ProfileCardProps } from "./types";

export default function ProfileCard({
    name,
    course,
    year,
    rollNo,
    email,
    mobile,
    image,
}: ProfileCardProps) {
    const { t } = useTranslation();

    return (
        <View className="flex-row rounded-xl bg-white p-4 shadow-sm mb-6 items-center gap-4">
            <Avatar src={image} size={80} alt={name} />

            <View className="space-y-1 flex-1">
                <Text className="text-lg font-semibold text-[#1F2937]">
                    {name}
                </Text>

                <Text className="text-xs text-[#111827]">
                    <Text className="font-medium">{t("Payments.student.Course:")} </Text>
                    <Text className="text-[#4B5563]">{course}</Text>
                </Text>

                <Text className="text-xs text-[#111827]">
                    <Text className="font-medium">{t("Payments.student.Year:")} </Text>
                    <Text className="text-[#4B5563]">{year}</Text>
                </Text>

                <Text className="text-xs text-[#111827]">
                    <Text className="font-medium">{t("Payments.student.Roll No:")} </Text>
                    <Text className="text-[#4B5563]">{rollNo}</Text>
                </Text>

                <Text className="text-xs text-[#111827] truncate" numberOfLines={1}>
                    <Text className="font-medium">{t("Payments.student.Email:")} </Text>
                    <Text className="text-[#4B5563]">{email}</Text>
                </Text>

                <Text className="text-xs text-[#111827]">
                    <Text className="font-medium">{t("Payments.student.Mobile:")} </Text>
                    <Text className="text-[#4B5563]">{mobile}</Text>
                </Text>
            </View>
        </View>
    );
}
