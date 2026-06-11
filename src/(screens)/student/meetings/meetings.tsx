import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { VideoCamera, Calendar, User, Clock } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";

export default function MeetingsScreen() {
    const headerHeight = useHeaderHeight();

    const meetings = [
        {
            title: "Guest Lecture: AI System Architectures",
            host: "Dr. Arvind Subramanian",
            date: "Today, June 11",
            time: "03:00 PM - 04:30 PM",
            status: "active",
            platform: "Zoom",
        },
        {
            title: "Project Review & Mentorship",
            host: "Prof. Priya Sen",
            date: "Tomorrow, June 12",
            time: "11:00 AM - 12:00 PM",
            status: "scheduled",
            platform: "MS Teams",
        },
        {
            title: "Soft Skills Training Workshop",
            host: "Ms. Sarah Jones",
            date: "June 15, 2026",
            time: "10:00 AM - 01:00 PM",
            status: "scheduled",
            platform: "Google Meet",
        },
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
                        Meetings Board
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1" style={{ fontFamily: fonts.regular }}>
                        Scheduled video conferences, guest talks, and reviews
                    </Text>
                </View>

                {/* Meetings List */}
                <View>
                    <Text className="text-[#1E293B] text-[16px] mb-4" style={{ fontFamily: fonts.bold }}>
                        Upcoming Schedules
                    </Text>

                    {meetings.map((meeting, idx) => {
                        const isActive = meeting.status === "active";

                        return (
                            <View key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
                                {/* Meeting status and platform */}
                                <View className="flex-row justify-between items-center mb-3">
                                    <View className="flex-row items-center">
                                        <View 
                                            className={`w-2 h-2 rounded-full mr-2 ${
                                                isActive ? "bg-red-500" : "bg-blue-500"
                                            }`} 
                                        />
                                        <Text 
                                            className={`text-[10px] font-bold capitalize tracking-wider ${
                                                isActive ? "text-red-600 animate-pulse" : "text-blue-600"
                                            }`}
                                            style={{ fontFamily: fonts.bold }}
                                        >
                                            {isActive ? "LIVE NOW" : "Scheduled"}
                                        </Text>
                                    </View>
                                    <View className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                                        <Text className="text-slate-500 text-[10px] font-semibold" style={{ fontFamily: fonts.medium }}>
                                            {meeting.platform}
                                        </Text>
                                    </View>
                                </View>

                                {/* Meeting Info */}
                                <Text className="text-[#1E293B] text-base mb-2" style={{ fontFamily: fonts.bold }}>
                                    {meeting.title}
                                </Text>

                                <View className="flex-row items-center mb-2">
                                    <User size={14} color="#64748B" />
                                    <Text className="text-slate-500 text-xs ml-1.5" style={{ fontFamily: fonts.medium }}>
                                        Host: {meeting.host}
                                    </Text>
                                </View>

                                <View className="flex-row items-center mb-4">
                                    <Clock size={14} color="#64748B" />
                                    <Text className="text-slate-400 text-xs ml-1.5" style={{ fontFamily: fonts.regular }}>
                                        {meeting.date} · {meeting.time}
                                    </Text>
                                </View>

                                {/* Action button */}
                                {isActive ? (
                                    <TouchableOpacity className="bg-[#43C17A] py-3 rounded-xl flex-row items-center justify-center">
                                        <View className="mr-2">
                                            <VideoCamera size={18} color="white" weight="bold" />
                                        </View>
                                        <Text className="text-white text-xs font-bold" style={{ fontFamily: fonts.bold }}>
                                            Join Meeting
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View className="bg-slate-50 py-3 rounded-xl items-center justify-center">
                                        <Text className="text-slate-400 text-xs font-semibold" style={{ fontFamily: fonts.medium }}>
                                            Starts at {meeting.time.split(" - ")[0]}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
