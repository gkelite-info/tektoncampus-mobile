import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { User, Bell, ShieldCheck, Globe, Question, CaretRight, SignOut } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";

export default function SettingsScreen() {
    const headerHeight = useHeaderHeight();
    
    // Toggle preferences mock state
    const [pushNotifs, setPushNotifs] = useState(true);
    const [emailNotifs, setEmailNotifs] = useState(false);

    const settingSections = [
        {
            title: "Account Preferences",
            items: [
                { label: "Profile Information", icon: User, desc: "Edit personal details & contact details" },
                { label: "App Language", icon: Globe, desc: "English (US)" },
            ],
        },
        {
            title: "Security & Terms",
            items: [
                { label: "Change Password", icon: ShieldCheck, desc: "Update your login security credentials" },
                { label: "Help & Support", icon: Question, desc: "Contact support & read documentation" },
            ],
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
                        App Settings
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1" style={{ fontFamily: fonts.regular }}>
                        Manage notification configurations and profile credentials
                    </Text>
                </View>

                {/* Notifications Panel */}
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <Text className="text-[#1E293B] text-[15px] mb-4" style={{ fontFamily: fonts.bold }}>
                        Notifications
                    </Text>

                    <View className="flex-row items-center justify-between py-2 border-b border-slate-50">
                        <View className="flex-row items-center flex-1 mr-3">
                            <Bell size={18} color="#64748B" />
                            <View className="ml-3">
                                <Text className="text-slate-700 text-xs font-semibold" style={{ fontFamily: fonts.medium }}>
                                    Push Notifications
                                </Text>
                                <Text className="text-slate-400 text-[9px] mt-0.5" style={{ fontFamily: fonts.regular }}>
                                    Alerts for class announcements & timetable updates
                                </Text>
                            </View>
                        </View>
                        <Switch 
                            value={pushNotifs} 
                            onValueChange={setPushNotifs} 
                            trackColor={{ false: "#E2E8F0", true: "#A7F3D0" }}
                            thumbColor={pushNotifs ? "#10B981" : "#94A3B8"}
                        />
                    </View>

                    <View className="flex-row items-center justify-between py-2 mt-2">
                        <View className="flex-row items-center flex-1 mr-3">
                            <Bell size={18} color="#64748B" />
                            <View className="ml-3">
                                <Text className="text-slate-700 text-xs font-semibold" style={{ fontFamily: fonts.medium }}>
                                    Email Notifications
                                </Text>
                                <Text className="text-slate-400 text-[9px] mt-0.5" style={{ fontFamily: fonts.regular }}>
                                    Weekly performance summaries & statements
                                </Text>
                            </View>
                        </View>
                        <Switch 
                            value={emailNotifs} 
                            onValueChange={setEmailNotifs} 
                            trackColor={{ false: "#E2E8F0", true: "#A7F3D0" }}
                            thumbColor={emailNotifs ? "#10B981" : "#94A3B8"}
                        />
                    </View>
                </View>

                {/* General Settings List */}
                {settingSections.map((section, sidx) => (
                    <View key={sidx} className="mb-6">
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 px-1" style={{ fontFamily: fonts.bold }}>
                            {section.title}
                        </Text>
                        
                        <View className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            {section.items.map((item, iidx) => {
                                const IconComp = item.icon;
                                const isLast = iidx === section.items.length - 1;

                                return (
                                    <TouchableOpacity 
                                        key={iidx}
                                        activeOpacity={0.7}
                                        className={`flex-row items-center justify-between p-4 ${
                                            !isLast ? "border-b border-slate-50" : ""
                                        }`}
                                    >
                                        <View className="flex-row items-center flex-1 mr-3">
                                            <IconComp size={18} color="#64748B" />
                                            <View className="flex-1 ml-3">
                                                <Text className="text-[#334155] text-xs font-semibold" style={{ fontFamily: fonts.medium }}>
                                                    {item.label}
                                                </Text>
                                                <Text className="text-slate-400 text-[9px] mt-0.5" style={{ fontFamily: fonts.regular }}>
                                                    {item.desc}
                                                </Text>
                                            </View>
                                        </View>
                                        <CaretRight size={16} color="#64748B" />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}

                {/* Sign Out Action Button */}
                <TouchableOpacity className="bg-rose-50 border border-rose-100 py-3.5 rounded-2xl flex-row items-center justify-center mt-2">
                    <View className="mr-2">
                        <SignOut size={18} color="#E11D48" weight="bold" />
                    </View>
                    <Text className="text-rose-700 text-xs font-bold" style={{ fontFamily: fonts.bold }}>
                        Sign Out
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
