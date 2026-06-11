import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { ClipboardText, Info, WarningCircle } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";

export default function MyAttendanceScreen() {
    const headerHeight = useHeaderHeight();

    const summary = {
        overall: 84.5,
        totalClasses: 180,
        present: 152,
        absent: 28,
    };

    const subjectWiseAttendance = [
        { subject: "Advanced Software Engineering", present: 36, total: 40, percent: 90 },
        { subject: "Database Management Systems", present: 34, total: 40, percent: 85 },
        { subject: "Machine Learning & AI", present: 27, total: 40, percent: 67.5 },
        { subject: "Cloud Computing", present: 38, total: 40, percent: 95 },
        { subject: "Technical Communications", present: 17, total: 20, percent: 85 },
    ];

    return (
        <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-[#F8FAFC]">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16, paddingTop: headerHeight + 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="mb-6">
                    <Text className="text-2xl text-[#1E293B]" style={{ fontFamily: fonts.bold }}>
                        Attendance Analytics
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1" style={{ fontFamily: fonts.regular }}>
                        Detailed reports and compliance records
                    </Text>
                </View>

                {/* Overall Attendance Card */}
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <View>
                            <Text className="text-slate-400 text-xs font-semibold" style={{ fontFamily: fonts.medium }}>Overall Attendance</Text>
                            <Text className="text-[32px] text-[#1E293B] mt-1" style={{ fontFamily: fonts.bold }}>
                                {summary.overall}%
                            </Text>
                        </View>
                        <View className="w-16 h-16 rounded-full bg-emerald-50 items-center justify-center border-4 border-[#43C17A]">
                            <Text className="text-[#43C17A] text-xs font-bold" style={{ fontFamily: fonts.bold }}>
                                ON TRACK
                            </Text>
                        </View>
                    </View>

                    {/* Breakdown counts */}
                    <View className="flex-row justify-between bg-slate-50 p-3 rounded-xl">
                        <View className="items-center flex-1">
                            <Text className="text-slate-400 text-[10px]" style={{ fontFamily: fonts.regular }}>Total Classes</Text>
                            <Text className="text-slate-700 text-sm font-bold mt-0.5" style={{ fontFamily: fonts.bold }}>{summary.totalClasses}</Text>
                        </View>
                        <View className="items-center flex-1 border-x border-slate-100">
                            <Text className="text-slate-400 text-[10px]" style={{ fontFamily: fonts.regular }}>Present</Text>
                            <Text className="text-emerald-600 text-sm font-bold mt-0.5" style={{ fontFamily: fonts.bold }}>{summary.present}</Text>
                        </View>
                        <View className="items-center flex-1">
                            <Text className="text-slate-400 text-[10px]" style={{ fontFamily: fonts.regular }}>Absent</Text>
                            <Text className="text-rose-500 text-sm font-bold mt-0.5" style={{ fontFamily: fonts.bold }}>{summary.absent}</Text>
                        </View>
                    </View>
                </View>

                {/* Attendance Alert warning */}
                {subjectWiseAttendance.some(sub => sub.percent < 75) && (
                    <View className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex-row items-start mb-6">
                        <View className="mr-3 mt-0.5">
                            <WarningCircle size={20} color="#E11D48" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-rose-700 text-sm font-bold" style={{ fontFamily: fonts.bold }}>
                                Shortage Warning
                            </Text>
                            <Text className="text-rose-600 text-xs mt-0.5 leading-5" style={{ fontFamily: fonts.regular }}>
                                Your attendance in Machine Learning & AI has dropped below the minimum requirement of 75%. Please attend classes to prevent eligibility issues.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Subject Wise breakdown */}
                <View>
                    <Text className="text-[#1E293B] text-[16px] mb-4" style={{ fontFamily: fonts.bold }}>
                        Subject-wise Breakdown
                    </Text>

                    {subjectWiseAttendance.map((item, idx) => {
                        const isShortage = item.percent < 75;
                        const percentageColor = isShortage ? "text-rose-600" : "text-emerald-600";
                        const barColor = isShortage ? "bg-rose-500" : "bg-[#43C17A]";

                        return (
                            <View key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-3">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-slate-700 text-sm font-semibold flex-1 mr-2" numberOfLines={1} style={{ fontFamily: fonts.semiBold }}>
                                        {item.subject}
                                    </Text>
                                    <Text className={`text-sm font-bold ${percentageColor}`} style={{ fontFamily: fonts.bold }}>
                                        {item.percent}%
                                    </Text>
                                </View>

                                {/* Progress Bar */}
                                <View className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                                    <View className={`h-full rounded-full ${barColor}`} style={{ width: `${item.percent}%` }} />
                                </View>

                                {/* Ratio */}
                                <Text className="text-slate-400 text-[10px]" style={{ fontFamily: fonts.regular }}>
                                    Attended: {item.present} / {item.total} lectures
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
