import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Kanban, CheckCircle, Clock, Users } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";

export default function ProjectsScreen() {
    const headerHeight = useHeaderHeight();
    const [selectedTab, setSelectedTab] = useState<"all" | "active" | "completed">("all");

    const projectsList = [
        {
            title: "Smart Campus Mobile App",
            description: "A comprehensive university administration & learning platform for students and faculty built using Expo and Supabase.",
            techStack: ["React Native", "TailwindCSS", "Supabase"],
            status: "active",
            progress: 75,
            teamSize: 4,
            mentor: "Dr. Srinivas Rao",
        },
        {
            title: "Automated Attendance System",
            description: "Face recognition based system for capturing and recording student class attendance automatically.",
            techStack: ["Python", "OpenCV", "Flask"],
            status: "active",
            progress: 40,
            teamSize: 3,
            mentor: "Prof. Priya Sen",
        },
        {
            title: "E-Commerce Recommendation System",
            description: "Machine learning application analyzing client behavior to suggest relevant merchandise.",
            techStack: ["React", "NodeJS", "TensorFlow"],
            status: "completed",
            progress: 100,
            teamSize: 2,
            mentor: "Dr. Amanda Green",
        },
    ];

    const filteredProjects = projectsList.filter(proj => {
        if (selectedTab === "all") return true;
        return proj.status === selectedTab;
    });

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
                        Projects Board
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1" style={{ fontFamily: fonts.regular }}>
                        Manage and track your academic project milestones
                    </Text>
                </View>

                {/* Filter Tabs */}
                <View className="flex-row bg-slate-100 p-1.5 rounded-xl mb-6">
                    {(["all", "active", "completed"] as const).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setSelectedTab(tab)}
                            className={`flex-1 items-center justify-center py-2.5 rounded-lg ${
                                selectedTab === tab ? "bg-white shadow-sm" : ""
                            }`}
                        >
                            <Text
                                className={`text-xs font-semibold capitalize ${
                                    selectedTab === tab ? "text-[#43C17A]" : "text-slate-500"
                                }`}
                                style={{ fontFamily: fonts.medium }}
                            >
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Projects List */}
                <View>
                    {filteredProjects.length === 0 ? (
                        <View className="items-center justify-center py-12">
                            <Kanban size={48} color="#94A3B8" />
                            <Text className="text-slate-400 mt-4 text-center text-sm" style={{ fontFamily: fonts.regular }}>
                                No projects found in this category.
                            </Text>
                        </View>
                    ) : (
                        filteredProjects.map((proj, idx) => (
                            <View key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
                                {/* Status Header */}
                                <View className="flex-row justify-between items-center mb-3">
                                    <View className="flex-row items-center">
                                        <View 
                                            className={`w-2 h-2 rounded-full mr-2 ${
                                                proj.status === "active" ? "bg-amber-500" : "bg-emerald-500"
                                            }`} 
                                        />
                                        <Text 
                                            className={`text-[11px] font-bold capitalize tracking-wider ${
                                                proj.status === "active" ? "text-amber-600" : "text-emerald-600"
                                            }`}
                                            style={{ fontFamily: fonts.bold }}
                                        >
                                            {proj.status}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Users size={16} color="#64748B" />
                                        <Text className="text-slate-500 text-xs font-semibold ml-1" style={{ fontFamily: fonts.medium }}>
                                            {proj.teamSize} members
                                        </Text>
                                    </View>
                                </View>

                                {/* Project Info */}
                                <Text className="text-[#1E293B] text-[16px] mb-2" style={{ fontFamily: fonts.bold }}>
                                    {proj.title}
                                </Text>
                                <Text className="text-slate-500 text-xs leading-5 mb-4" style={{ fontFamily: fonts.regular }}>
                                    {proj.description}
                                </Text>

                                {/* Tech Badges */}
                                <View className="flex-row flex-wrap gap-2 mb-4">
                                    {proj.techStack.map((tech, tid) => (
                                        <View key={tid} className="bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md">
                                            <Text className="text-slate-600 text-[10px] font-semibold" style={{ fontFamily: fonts.medium }}>
                                                {tech}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Divider */}
                                <View className="h-[1px] bg-slate-100 mb-4" />

                                {/* Progress Bar & Mentor */}
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-1 mr-4">
                                        <View className="flex-row justify-between items-center mb-1">
                                            <Text className="text-slate-400 text-[10px]" style={{ fontFamily: fonts.regular }}>Progress</Text>
                                            <Text className="text-slate-700 text-xs font-bold" style={{ fontFamily: fonts.bold }}>{proj.progress}%</Text>
                                        </View>
                                        <View className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <View 
                                                className={`h-full rounded-full ${proj.status === "active" ? "bg-amber-400" : "bg-emerald-500"}`} 
                                                style={{ width: `${proj.progress}%` }} 
                                            />
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-slate-400 text-[10px]" style={{ fontFamily: fonts.regular }}>Mentor</Text>
                                        <Text className="text-[#334155] text-xs font-semibold mt-0.5" style={{ fontFamily: fonts.medium }}>
                                            {proj.mentor}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
