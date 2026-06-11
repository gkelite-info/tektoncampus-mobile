import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { ChartLineUp, BookOpen, Trophy, CheckCircle } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";

export default function StudentProgressScreen() {
    const headerHeight = useHeaderHeight();

    // Mock data for student progress
    const stats = {
        cgpa: "8.75",
        sgpa: "8.90",
        creditsEarned: "78",
        totalCredits: "120",
    };

    const semesterGrades = [
        { sem: "Semester 1", gpa: "8.50", status: "Completed" },
        { sem: "Semester 2", gpa: "8.65", status: "Completed" },
        { sem: "Semester 3", gpa: "8.90", status: "Active" },
    ];

    const subjectProgress = [
        { name: "Advanced Software Engineering", progress: 90, grade: "A+" },
        { name: "Database Management Systems", progress: 85, grade: "A" },
        { name: "Machine Learning & AI", progress: 78, grade: "A-" },
        { name: "Cloud Computing", progress: 95, grade: "O" },
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
                        Student Progress
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1" style={{ fontFamily: fonts.regular }}>
                        Academic performance, CGPA & subject analysis
                    </Text>
                </View>

                {/* Scorecards Row */}
                <View className="flex-row flex-wrap justify-between mb-6" style={{ gap: 12 }}>
                    {/* CGPA */}
                    <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-w-[150px]">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-gray-400 text-xs font-semibold" style={{ fontFamily: fonts.medium }}>CGPA</Text>
                            <View className="bg-emerald-50 p-1.5 rounded-lg">
                                <ChartLineUp size={20} color="#10B981" />
                            </View>
                        </View>
                        <Text className="text-2xl text-[#1E293B]" style={{ fontFamily: fonts.bold }}>{stats.cgpa}</Text>
                        <Text className="text-[10px] text-emerald-600 mt-1" style={{ fontFamily: fonts.regular }}>Top 10% of Branch</Text>
                    </View>

                    {/* SGPA */}
                    <View className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 min-w-[150px]">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-gray-400 text-xs font-semibold" style={{ fontFamily: fonts.medium }}>SGPA (Sem 3)</Text>
                            <View className="bg-blue-50 p-1.5 rounded-lg">
                                <Trophy size={20} color="#3B82F6" />
                            </View>
                        </View>
                        <Text className="text-2xl text-[#1E293B]" style={{ fontFamily: fonts.bold }}>{stats.sgpa}</Text>
                        <Text className="text-[10px] text-blue-600 mt-1" style={{ fontFamily: fonts.regular }}>Current Semester</Text>
                    </View>
                </View>

                {/* Credits Progress Card */}
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <View className="flex-row justify-between items-center mb-3">
                        <View className="flex-row items-center">
                            <BookOpen size={20} color="#64748B" />
                            <Text className="text-[#1E293B] text-[15px] ml-2" style={{ fontFamily: fonts.semiBold }}>
                                Degree Credits Progress
                            </Text>
                        </View>
                        <Text className="text-xs text-slate-500 font-semibold" style={{ fontFamily: fonts.medium }}>
                            {stats.creditsEarned} / {stats.totalCredits} Credits
                        </Text>
                    </View>
                    {/* Progress Bar */}
                    <View className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <View 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${(Number(stats.creditsEarned) / Number(stats.totalCredits)) * 100}%` }} 
                        />
                    </View>
                    <Text className="text-[11px] text-slate-400" style={{ fontFamily: fonts.regular }}>
                        You need {(Number(stats.totalCredits) - Number(stats.creditsEarned))} more credits to graduate.
                    </Text>
                </View>

                {/* Subject Wise Performance */}
                <View className="mb-6">
                    <Text className="text-[#1E293B] text-[16px] mb-3" style={{ fontFamily: fonts.bold }}>
                        Subject-wise Performance
                    </Text>
                    {subjectProgress.map((subject, idx) => (
                        <View key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-3">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-[#334155] text-sm flex-1 mr-2" numberOfLines={1} style={{ fontFamily: fonts.semiBold }}>
                                    {subject.name}
                                </Text>
                                <View className="bg-emerald-50 px-2 py-0.5 rounded-md">
                                    <Text className="text-emerald-700 text-xs font-bold" style={{ fontFamily: fonts.bold }}>
                                        {subject.grade}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row items-center">
                                <View className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden mr-3">
                                    <View className="h-full bg-[#43C17A] rounded-full" style={{ width: `${subject.progress}%` }} />
                                </View>
                                <Text className="text-slate-500 text-xs font-semibold" style={{ fontFamily: fonts.medium }}>{subject.progress}%</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Semester Summary */}
                <View>
                    <Text className="text-[#1E293B] text-[16px] mb-3" style={{ fontFamily: fonts.bold }}>
                        Academic Term Summary
                    </Text>
                    {semesterGrades.map((term, idx) => (
                        <View key={idx} className="flex-row items-center justify-between bg-white px-4 py-3.5 rounded-xl shadow-sm border border-slate-100 mb-2">
                            <View className="flex-row items-center">
                                <CheckCircle size={18} color={term.status === "Completed" ? "#10B981" : "#3B82F6"} />
                                <Text className="text-[#334155] text-sm ml-3" style={{ fontFamily: fonts.medium }}>{term.sem}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <Text className="text-[#1E293B] text-sm font-semibold mr-3" style={{ fontFamily: fonts.semiBold }}>GPA: {term.gpa}</Text>
                                <View className={`px-2 py-0.5 rounded-full ${term.status === "Completed" ? "bg-slate-100" : "bg-blue-50"}`}>
                                    <Text className={`text-[10px] font-bold ${term.status === "Completed" ? "text-slate-600" : "text-blue-700"}`} style={{ fontFamily: fonts.bold }}>
                                        {term.status}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
