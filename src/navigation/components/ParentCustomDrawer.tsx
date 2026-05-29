import React from "react";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import {
    House,
    CheckCircle,
    GraduationCap,
    CurrencyDollar,
    Laptop,
    Gear,
    SignOut
} from "phosphor-react-native";

type DrawerItemProps = {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onPress: () => void;
    isLogout?: boolean;
};

const DrawerItem = ({ label, icon, isActive, onPress, isLogout }: DrawerItemProps) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className={`flex-row items-center py-3 px-6 mx-0 my-1 rounded-r-full ${
                isActive ? "bg-white shadow-sm" : "bg-transparent"
            } ${isLogout ? "mt-4 border-t border-green-500/30 pt-4" : ""}`}
        >
            <View className="mr-4">
                {icon}
            </View>
            <Text
                className={`text-base font-semibold ${
                    isActive ? "text-[#3fbe73]" : isLogout ? "text-[#ef4444]" : "text-white"
                }`}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
};

export default function ParentCustomDrawer(props: DrawerContentComponentProps) {
    const { state, navigation } = props;
    
    const isActive = (routeName: string) => {
        return state.routeNames[state.index] === routeName;
    };

    const navigateTo = (routeName: string) => {
        navigation.navigate(routeName);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#47c67b]">
            <View className="items-center justify-center py-8">
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <DrawerItem
                    label="Home"
                    icon={<House size={24} color={isActive("ParentTabs") ? "#3fbe73" : "#FFFFFF"} weight={isActive("ParentTabs") ? "fill" : "regular"} />}
                    isActive={isActive("ParentTabs")}
                    onPress={() => navigateTo("ParentTabs")}
                />
                <DrawerItem
                    label="Attendance"
                    icon={<CheckCircle size={24} color={isActive("Attendance") ? "#3fbe73" : "#FFFFFF"} weight={isActive("Attendance") ? "fill" : "regular"} />}
                    isActive={isActive("Attendance")}
                    onPress={() => navigateTo("Attendance")}
                />
                <DrawerItem
                    label="Student Progress"
                    icon={<GraduationCap size={24} color={isActive("StudentProgress") ? "#3fbe73" : "#FFFFFF"} weight={isActive("StudentProgress") ? "fill" : "regular"} />}
                    isActive={isActive("StudentProgress")}
                    onPress={() => navigateTo("StudentProgress")}
                />
                <DrawerItem
                    label="Payments"
                    icon={<CurrencyDollar size={24} color={isActive("Payments") ? "#3fbe73" : "#FFFFFF"} weight={isActive("Payments") ? "fill" : "regular"} />}
                    isActive={isActive("Payments")}
                    onPress={() => navigateTo("Payments")}
                />
                <DrawerItem
                    label="Meetings"
                    icon={<Laptop size={24} color={isActive("Meetings") ? "#3fbe73" : "#FFFFFF"} weight={isActive("Meetings") ? "fill" : "regular"} />}
                    isActive={isActive("Meetings")}
                    onPress={() => navigateTo("Meetings")}
                />
                <DrawerItem
                    label="Settings"
                    icon={<Gear size={24} color={isActive("Settings") ? "#3fbe73" : "#FFFFFF"} weight={isActive("Settings") ? "fill" : "regular"} />}
                    isActive={isActive("Settings")}
                    onPress={() => navigateTo("Settings")}
                />
                
                <View className="mb-8">
                    <DrawerItem
                        label="Logout"
                        icon={<SignOut size={24} color="#ef4444" weight="bold" />}
                        isActive={false}
                        isLogout={true}
                        onPress={() => {
                            console.log("Logout pressed");
                        }}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
