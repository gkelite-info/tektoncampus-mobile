import React from "react";
import { ScrollView, View } from "react-native";
import FacultyDashLeft from "./dashboard/components/FacultyDashLeft";

export default function FacultyDashboard() {
    return (
        <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
            <View className="flex-col w-full min-h-screen">
                <FacultyDashLeft />
            </View>
        </ScrollView>
    );
}