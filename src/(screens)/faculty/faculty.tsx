import React from "react";
import { View } from "react-native";
import FacultyDashLeft from "./dashboard/components/FacultyDashLeft";

export default function FacultyDashboard() {
    return (
        <View className="flex-1 bg-gray-50">
            <View className="flex-col w-full flex-1">
                <FacultyDashLeft />
            </View>
        </View>
    );
}