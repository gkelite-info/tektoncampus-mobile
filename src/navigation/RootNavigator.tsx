import React from "react";

import { NavigationContainer } from "@react-navigation/native";
import LoginScreen from "@/(screens)/(auth)/loginScreen";
import { useAuthStore } from "@/store/authStore";
import FacultyTabs from "@/tabs/FacultyTabs";
import StudentTabs from "@/tabs/StudentTabs";
import ParentTabs from "@/tabs/ParentTabs";

export default function RootNavigator() {
    const user = useAuthStore(
        (state) => state.user
    );

    return (
        <NavigationContainer>
            {!user ? (
                <LoginScreen />
            ) : user.role === "Faculty" ? (
                <FacultyTabs />
            ) : user.role === "Student" ? (
                <StudentTabs />
            ) : user.role === "Parent" ? (
                <ParentTabs />
            ) : (
                <LoginScreen />
            )}
        </NavigationContainer>
    );
}