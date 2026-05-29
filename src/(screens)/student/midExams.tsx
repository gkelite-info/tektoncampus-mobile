import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";

type MidExamsProps = {
    onBack: () => void;
    translations?: Record<string, string>;
};

type Subject = {
    subject: string;
    attendance: number;
};

export default function MidExams({ onBack, translations }: MidExamsProps) {
    const t = (key: string, defaultValue: string) => translations?.[key] || defaultValue;

    const examMetaData = [
        { title: t("examStartDate", "Exam start date"), subTitle: "11 March 2025" },
        { title: t("examType", "Exam type"), subTitle: "Mid Term Exams (CSE Year 2)" },
    ];

    const subjects: Subject[] = [
        { subject: "Data Structures", attendance: 87 },
        { subject: "OOPs using C++", attendance: 72 },
        { subject: "Discrete Mathematics", attendance: 65 },
    ];

    return (
        <ScrollView
            className="flex-1 bg-[#F9FAFB]"
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
        >
            {/* HEADER */}
            <View className="flex-row items-center mb-1.5">
                <TouchableOpacity onPress={onBack} activeOpacity={0.7} className="mr-2.5">
                    <Text className="text-2xl color-[#282828] font-bold">←</Text>
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-[#282828]">
                    {t("midTermTitle", "Mid Term Exam Enrollment")}
                </Text>
            </View>

            <Text className="text-sm text-[#515151] mb-4 pl-0.5">
                {t("description", "Enroll for your upcoming exams starting March 11, 2025")}
            </Text>

            {/* METADATA CARD */}
            <View className="bg-white rounded-lg p-3.5 mb-3.5 shadow-sm border border-gray-100">
                {examMetaData.map((item, index) => (
                    <View className="flex-row items-center my-1.5" key={index}>
                        <View className="w-[35%]">
                            <Text className="text-sm text-[#282828]">{item.title}</Text>
                        </View>
                        <View className="bg-[#E5F6EC] rounded-full px-3 py-1">
                            <Text className="text-[#43C17A] font-medium text-xs">{item.subTitle}</Text>
                        </View>
                    </View>
                ))}

                <View className="flex-row items-center my-1.5">
                    <View className="w-[18%]">
                        <Text className="text-sm text-[#282828] font-medium">{t("note", "Note")}</Text>
                    </View>
                    <Text className="text-sm text-[#282828] flex-1">
                        {t("noteDesc", "You’re eligible to enroll if your attendance ≥ 75%")}
                    </Text>
                </View>
            </View>

            {/* TABLE CARD */}
            <View className="bg-white rounded-lg p-3.5 mb-3.5 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-sm font-medium text-[#282828]">
                        {t("selectSubjects", "Select Subjects to Enroll")}
                    </Text>
                    <View className="bg-[#E5F6EC] rounded-full px-3 py-1">
                        <Text className="text-[#43C17A] font-medium text-xs">{t("hallTicket", "Hall Ticket")}</Text>
                    </View>
                </View>

                {/* TH HEADERS */}
                <View className="flex-row border-b border-gray-200 pb-2 mb-2.5">
                    <Text className="flex-[2.2] text-xs font-bold text-gray-400">{t("subjectHeader", "Subject")}</Text>
                    <Text className="flex-[1.8] text-xs font-bold text-gray-400 text-center">{t("attendanceHeader", "Attendance")}</Text>
                    <Text className="flex-[2] text-xs font-bold text-gray-400 text-center">{t("actionsHeader", "Actions")}</Text>
                </View>

                {/* TD ROWS */}
                {subjects.map((item, index) => {
                    const isEligible = item.attendance >= 75;

                    return (
                        <View className="flex-row items-center py-3 border-b border-gray-50" key={index}>
                            {/* Subject Title */}
                            <Text className="flex-[2.2] text-sm text-[#282828]" numberOfLines={2}>
                                {item.subject}
                            </Text>

                            {/* Attendance Ratio */}
                            <View className="flex-[1.8] flex-row items-center justify-center">
                                <Text className={`text-sm font-medium ${isEligible ? "text-[#43C17A]" : "text-red-500"}`}>
                                    {item.attendance}%
                                </Text>
                                <Text className="text-[11px] text-gray-400">/100%</Text>
                            </View>

                            {/* Action Trigger */}
                            <View className="flex-[2] items-center">
                                <TouchableOpacity
                                    disabled={!isEligible}
                                    className={`rounded-md py-1.5 w-full items-center ${isEligible ? "bg-[#43C17A]" : "bg-gray-300"}`}
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-white text-[11px] font-bold text-center">
                                        {isEligible ? t("enroll", "ENROLL") : t("notEligible", "NOT ELIGIBLE")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
}