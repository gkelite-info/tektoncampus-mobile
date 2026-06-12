import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import tw from "twrnc";

interface TabNavigationProps {
    currentTab: string;
    onTabChange: (tab: string) => void;
    tabs: { id: string; label: string; icon?: React.ReactNode }[];
}

export default function TabNavigation({ currentTab, onTabChange, tabs }: TabNavigationProps) {
    return (
        <View style={tw`flex-row bg-[#F4F4F4] rounded-full p-1`}>
            {tabs.map((tab) => {
                const isActive = currentTab === tab.id;
                return (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => onTabChange(tab.id)}
                        style={tw`flex-row items-center justify-center px-6 py-2.5 rounded-full transition-all ${
                            isActive ? "bg-white shadow-sm" : "bg-transparent"
                        }`}
                    >
                        {tab.icon && (
                            <View style={tw`mr-2 opacity-${isActive ? "100" : "50"}`}>
                                {tab.icon}
                            </View>
                        )}
                        <Text
                            style={tw`font-semibold text-sm ${
                                isActive ? "text-[#16284F]" : "text-[#7B7B7B]"
                            }`}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
