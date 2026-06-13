import React from "react";
import { View, Text, ScrollView } from "react-native";
import { fonts } from "@/constants/fonts";

export type AttendanceItem = {
    subject: string;
    attended: number;
    total: number;
    status: string;
};

type AttendanceListProps = {
    data?: AttendanceItem[];
};

const useTranslations = (namespace: string) => {
    return (key: string) => key;
};

export function AttendanceList({ data }: AttendanceListProps) {
    const t = useTranslations("Progress.student");

    return (
        <View className="w-full h-[400px] flex flex-col bg-white rounded-2xl overflow-hidden">
            <Text className="p-5 pb-2 text-lg text-gray-800" style={{ fontFamily: fonts.bold }}>
                {t("Attendance by Subject")}
            </Text>

            <ScrollView
                className="flex-1 px-5 pb-5"
                showsVerticalScrollIndicator={false}
            >
                {data?.map((item, i) => {
                    const pct = item.total > 0 ? Math.round((item.attended / item.total) * 100) : 0;
                    const isLast = data ? i === data.length - 1 : false;

                    return (
                        <View
                            key={i}
                            className={`flex flex-col gap-3 py-4 ${isLast ? "" : "border-b border-gray-100"
                                }`}
                        >
                            <View className="flex flex-row justify-between items-center">
                                <Text className="text-base text-gray-800 flex-1 pr-2" style={{ fontFamily: fonts.semiBold }}>
                                    {item.subject}
                                </Text>
                                <View className="bg-green-100 px-3 py-1 rounded-md">
                                    <Text className="text-green-500 text-sm" style={{ fontFamily: fonts.medium }}>
                                        {item.status}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex flex-row items-center gap-4">
                                <Text className="text-sm text-green-500" style={{ fontFamily: fonts.medium }}>
                                    {item.attended} of {item.total} classes
                                </Text>

                                <View className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <View
                                        className="h-full bg-[#5bc236]"
                                        style={{ width: `${pct}%` }}
                                    />
                                </View>

                                <Text className="text-right text-sm text-green-500" style={{ fontFamily: fonts.medium }}>
                                    {pct}% attendance
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}