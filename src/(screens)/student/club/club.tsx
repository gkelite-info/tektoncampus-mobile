import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { UsersThree, Trophy, Check } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";

export default function ClubScreen() {
    const headerHeight = useHeaderHeight();
    
    const [joinedClubs, setJoinedClubs] = useState<number[]>([1]); // Pre-join the coding club

    const clubsList = [
        {
            id: 1,
            name: "Tekton Coding Club",
            category: "Technical",
            iconBg: "#43C17A",
            desc: "The official tech community organizing hackathons, open source contributions, and coding bootcamps.",
            members: 342,
            eventsCount: 4,
        },
        {
            id: 2,
            name: "Campus Sports Chapter",
            category: "Sports",
            iconBg: "#3B82F6",
            desc: "Promoting physical fitness and hosting annual inter-college sports tournaments.",
            members: 195,
            eventsCount: 2,
        },
        {
            id: 3,
            name: "Melody & Beats Club",
            category: "Cultural",
            iconBg: "#EC4899",
            desc: "Uniting campus vocalists, guitarists, and dancers for regular gig nights and festivals.",
            members: 220,
            eventsCount: 3,
        },
    ];

    const toggleClubJoin = (id: number) => {
        if (joinedClubs.includes(id)) {
            setJoinedClubs(joinedClubs.filter(cid => cid !== id));
        } else {
            setJoinedClubs([...joinedClubs, id]);
        }
    };

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
                        Clubs & Societies
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1" style={{ fontFamily: fonts.regular }}>
                        Join campus communities and participate in extracurricular activities
                    </Text>
                </View>

                {/* Section: Registered/All Clubs */}
                <View>
                    {clubsList.map((club) => {
                        const isJoined = joinedClubs.includes(club.id);

                        return (
                            <View key={club.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
                                {/* Club Header */}
                                <View className="flex-row items-center mb-3">
                                    <View 
                                        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                                        style={{ backgroundColor: club.iconBg }}
                                    >
                                        <UsersThree size={22} color="white" weight="bold" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-[#1E293B] text-base" style={{ fontFamily: fonts.bold }}>
                                            {club.name}
                                        </Text>
                                        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-0.5" style={{ fontFamily: fonts.bold }}>
                                            {club.category}
                                        </Text>
                                    </View>
                                </View>

                                {/* Description */}
                                <Text className="text-slate-500 text-xs leading-5 mb-4" style={{ fontFamily: fonts.regular }}>
                                    {club.desc}
                                </Text>

                                {/* Stats & Join button */}
                                <View className="flex-row justify-between items-center border-t border-slate-50 pt-4">
                                    <View className="flex-row gap-4">
                                        <View>
                                            <Text className="text-slate-400 text-[9px]" style={{ fontFamily: fonts.regular }}>Members</Text>
                                            <Text className="text-slate-700 text-xs font-bold mt-0.5" style={{ fontFamily: fonts.bold }}>
                                                {isJoined ? club.members + 1 : club.members}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text className="text-slate-400 text-[9px]" style={{ fontFamily: fonts.regular }}>Active Events</Text>
                                            <Text className="text-slate-700 text-xs font-bold mt-0.5" style={{ fontFamily: fonts.bold }}>
                                                {club.eventsCount}
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity 
                                        onPress={() => toggleClubJoin(club.id)}
                                        className={`px-4 py-2 rounded-xl flex-row items-center ${
                                            isJoined ? "bg-slate-100" : "bg-[#43C17A]"
                                        }`}
                                    >
                                        {isJoined && <Check size={12} color="#64748B" />}
                                        <Text 
                                            className={`text-xs font-bold ${isJoined ? "ml-1 text-slate-500" : "text-white"}`}
                                            style={{ fontFamily: fonts.bold }}
                                        >
                                            {isJoined ? "Joined" : "Join Club"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
