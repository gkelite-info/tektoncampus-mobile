import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Heart, Smiley, SmileySad, Phone, BookOpen, Clock } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";

export default function WellbeingScreen() {
    const headerHeight = useHeaderHeight();
    const [selectedMood, setSelectedMood] = useState<string | null>(null);

    const quote = {
        text: "“You don't have to control your thoughts. You just have to stop letting them control you.”",
        author: "Dan Millman",
    };

    const resources = [
        { title: "Managing Exam Stress & Anxiety", readTime: "5 mins read", iconBg: "#E0F2FE", iconColor: "#0284C7" },
        { title: "Healthy Sleep Cycles during College", readTime: "4 mins read", iconBg: "#F3E8FF", iconColor: "#7C3AED" },
        { title: "Building Mindful Study Habits", readTime: "6 mins read", iconBg: "#ECFDF5", iconColor: "#059669" },
    ];

    const moods = [
        { label: "Great", emoji: "😊", value: "great" },
        { label: "Good", emoji: "🙂", value: "good" },
        { label: "Neutral", emoji: "😐", value: "neutral" },
        { label: "Tired", emoji: "😴", value: "tired" },
        { label: "Stressed", emoji: "😟", value: "stressed" },
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
                        Wellbeing Center
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1" style={{ fontFamily: fonts.regular }}>
                        Support tools, daily check-ins, and campus wellness
                    </Text>
                </View>

                {/* Quote card */}
                <View className="bg-emerald-50/75 border border-emerald-100 p-5 rounded-2xl mb-6">
                    <View className="mb-3">
                        <Heart size={24} color="#10B981" weight="fill" />
                    </View>
                    <Text className="text-emerald-900 text-sm leading-6 italic" style={{ fontFamily: fonts.italic }}>
                        {quote.text}
                    </Text>
                    <Text className="text-emerald-700 text-xs font-bold text-right mt-3" style={{ fontFamily: fonts.bold }}>
                        — {quote.author}
                    </Text>
                </View>

                {/* Mood Check-in */}
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <Text className="text-[#1E293B] text-[15px] mb-3.5" style={{ fontFamily: fonts.bold }}>
                        How are you feeling today?
                    </Text>
                    <View className="flex-row justify-between">
                        {moods.map((mood) => {
                            const isSelected = selectedMood === mood.value;
                            return (
                                <TouchableOpacity 
                                    key={mood.value}
                                    onPress={() => setSelectedMood(mood.value)}
                                    className={`items-center p-2 rounded-xl flex-1 mx-0.5 ${
                                        isSelected ? "bg-emerald-50 border border-emerald-200" : ""
                                    }`}
                                >
                                    <Text className="text-2xl">{mood.emoji}</Text>
                                    <Text className="text-slate-500 text-[10px] mt-1" style={{ fontFamily: fonts.medium }}>{mood.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Wellbeing Actions */}
                <View className="flex-row mb-6" style={{ gap: 12 }}>
                    <TouchableOpacity className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 items-center justify-center">
                        <View className="mb-2">
                            <Phone size={24} color="#EF4444" weight="fill" />
                        </View>
                        <Text className="text-slate-700 text-xs font-bold text-center" style={{ fontFamily: fonts.bold }}>
                            Talk to Counselor
                        </Text>
                        <Text className="text-slate-400 text-[9px] text-center mt-1" style={{ fontFamily: fonts.regular }}>
                            Confidential 24/7 Helpline
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 items-center justify-center">
                        <View className="mb-2">
                            <Clock size={24} color="#10B981" weight="fill" />
                        </View>
                        <Text className="text-slate-700 text-xs font-bold text-center" style={{ fontFamily: fonts.bold }}>
                            Breathing Guide
                        </Text>
                        <Text className="text-slate-400 text-[9px] text-center mt-1" style={{ fontFamily: fonts.regular }}>
                            1-minute relaxation
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Self Help Resources */}
                <View>
                    <Text className="text-[#1E293B] text-[16px] mb-3" style={{ fontFamily: fonts.bold }}>
                        Recommended Reads
                    </Text>

                    {resources.map((res, idx) => (
                        <View key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-row items-center mb-3">
                            <View 
                                className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                                style={{ backgroundColor: res.iconBg }}
                            >
                                <BookOpen size={20} color={res.iconColor} />
                            </View>
                            <View className="flex-1 mr-2">
                                <Text className="text-slate-700 text-xs font-semibold" numberOfLines={1} style={{ fontFamily: fonts.medium }}>
                                    {res.title}
                                </Text>
                                <Text className="text-slate-400 text-[10px] mt-1" style={{ fontFamily: fonts.regular }}>
                                    {res.readTime}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
