import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Buildings, Briefcase, CalendarCheck, CurrencyDollar } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";

export default function PlacementsScreen() {
    const headerHeight = useHeaderHeight();

    const ongoingDrives = [
        {
            company: "Google India",
            logoBg: "#EA4335",
            role: "Associate Software Engineer",
            package: "32 LPA",
            deadline: "June 25, 2026",
            eligibility: "CGPA >= 8.5, CSE/ECE",
        },
        {
            company: "Microsoft",
            logoBg: "#00A4EF",
            role: "Software Engineering Intern",
            package: "1.2 Lakhs/month",
            deadline: "June 30, 2026",
            eligibility: "CGPA >= 8.0, All Branches",
        },
    ];

    const applicationHistory = [
        {
            company: "Accenture",
            role: "Packaged App Development Analyst",
            date: "May 12, 2026",
            status: "Selected",
            statusColor: "emerald",
        },
        {
            company: "Amazon India",
            role: "Systems Engineer",
            date: "April 28, 2026",
            status: "Interviewing",
            statusColor: "blue",
        },
        {
            company: "TCS",
            role: "Ninja Developer",
            date: "April 15, 2026",
            status: "Offered",
            statusColor: "purple",
        },
    ];

    return (
        <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-[#F8FAFC]">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16, paddingTop: headerHeight + 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {}
                <View className="mb-6">
                    <Text className="text-2xl text-[#1E293B]" style={{ fontFamily: fonts.bold }}>
                        Placements Hub
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1" style={{ fontFamily: fonts.regular }}>
                        Ongoing recruitment drives and placement statistics
                    </Text>
                </View>

                {}
                <View className="mb-6">
                    <Text className="text-[#1E293B] text-[16px] mb-4" style={{ fontFamily: fonts.bold }}>
                        Active Drives
                    </Text>

                    {ongoingDrives.map((drive, idx) => (
                        <View key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
                            {}
                            <View className="flex-row items-center mb-4">
                                <View 
                                    className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: drive.logoBg }}
                                >
                                    <Buildings size={22} color="white" weight="bold" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[#1E293B] text-base" style={{ fontFamily: fonts.bold }}>
                                        {drive.company}
                                    </Text>
                                    <View className="flex-row items-center mt-0.5">
                                        <Briefcase size={12} color="#64748B" />
                                        <Text className="text-slate-500 text-xs ml-1" style={{ fontFamily: fonts.medium }}>
                                            {drive.role}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {}
                            <View className="flex-row justify-between bg-slate-50 p-3 rounded-xl mb-4">
                                <View>
                                    <Text className="text-slate-400 text-[10px]" style={{ fontFamily: fonts.regular }}>Package Offered</Text>
                                    <Text className="text-emerald-700 text-xs font-bold mt-0.5" style={{ fontFamily: fonts.bold }}>{drive.package}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-slate-400 text-[10px]" style={{ fontFamily: fonts.regular }}>Deadline</Text>
                                    <Text className="text-slate-700 text-xs font-semibold mt-0.5" style={{ fontFamily: fonts.medium }}>{drive.deadline}</Text>
                                </View>
                            </View>

                            {}
                            <View className="flex-row justify-between items-center">
                                <View className="flex-1 mr-3">
                                    <Text className="text-slate-400 text-[10px]" style={{ fontFamily: fonts.regular }}>Eligibility</Text>
                                    <Text className="text-[#334155] text-xs font-semibold mt-0.5" style={{ fontFamily: fonts.medium }}>
                                        {drive.eligibility}
                                    </Text>
                                </View>
                                <TouchableOpacity className="bg-[#43C17A] px-4 py-2 rounded-xl">
                                    <Text className="text-white text-xs font-bold" style={{ fontFamily: fonts.bold }}>
                                        Apply Now
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {}
                <View>
                    <Text className="text-[#1E293B] text-[16px] mb-3" style={{ fontFamily: fonts.bold }}>
                        Application History
                    </Text>

                    {applicationHistory.map((history, idx) => {
                        const statusClass = 
                            history.statusColor === "emerald" 
                                ? "bg-emerald-50 text-emerald-700" 
                                : history.statusColor === "blue" 
                                ? "bg-blue-50 text-blue-700" 
                                : "bg-purple-50 text-purple-700";

                        return (
                            <View key={idx} className="bg-white px-4 py-3.5 rounded-xl shadow-sm border border-slate-100 flex-row justify-between items-center mb-2">
                                <View className="flex-1 mr-2">
                                    <Text className="text-[#334155] text-sm" style={{ fontFamily: fonts.semiBold }}>
                                        {history.company}
                                    </Text>
                                    <Text className="text-slate-400 text-[10px] mt-0.5" style={{ fontFamily: fonts.regular }}>
                                        {history.role} · {history.date}
                                    </Text>
                                </View>
                                <View className={`px-2.5 py-1 rounded-full ${statusClass.split(" ")[0]}`}>
                                    <Text className={`text-[10px] font-bold ${statusClass.split(" ")[1]}`} style={{ fontFamily: fonts.bold }}>
                                        {history.status}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
