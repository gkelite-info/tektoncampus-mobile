import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Buildings,
    Calendar,
    CalendarCheck,
    ChartLineUp,
    CheckCircle,
    ClipboardText,
    CurrencyDollar,
    FileText,
    FolderOpen,
    Gear,
    GraduationCap,
    House,
    PresentationChart,
    SignOut,
    Smiley,
    UsersThree,
} from "phosphor-react-native";

export type RoleSideMenuItem = {
    name: string;
    label: string;
};

type Props = {
    visible: boolean;
    activeRouteName?: string;
    items: RoleSideMenuItem[];
    homeRouteName: string;
    onClose: () => void;
    onNavigate: (routeName: string) => void;
};

function renderIcon(routeName: string, isActive: boolean) {
    const color = isActive ? "#3fbe73" : "#FFFFFF";
    const weight = isActive ? "fill" : "regular";

    switch (routeName) {
        case "StudentTabs":
        case "FacultyTabs":
        case "ParentTabs":
            return <House size={24} color={color} weight={weight as any} />;
        case "Calendar":
            return <Calendar size={24} color={color} weight={weight as any} />;
        case "Attendance":
        case "MyAttendance":
            return <CheckCircle size={24} color={color} weight={weight as any} />;
        case "Assignments":
            return <FileText size={24} color={color} weight={weight as any} />;
        case "Academics":
            return <GraduationCap size={24} color={color} weight={weight as any} />;
        case "StudentProgress":
            return <ChartLineUp size={24} color={color} weight={weight as any} />;
        case "Projects":
            return <ClipboardText size={24} color={color} weight={weight as any} />;
        case "Placements":
            return <Buildings size={24} color={color} weight={weight as any} />;
        case "LeaveRequests":
            return <CalendarCheck size={24} color={color} weight={weight as any} />;
        case "Club":
            return <UsersThree size={24} color={color} weight={weight as any} />;
        case "Drive":
            return <FolderOpen size={24} color={color} weight={weight as any} />;
        case "Meetings":
            return <PresentationChart size={24} color={color} weight={weight as any} />;
        case "Wellbeing":
            return <Smiley size={24} color={color} weight={weight as any} />;
        case "Payments":
            return <CurrencyDollar size={24} color={color} weight={weight as any} />;
        case "Settings":
            return <Gear size={24} color={color} weight={weight as any} />;
        default:
            return <FileText size={24} color={color} weight={weight as any} />;
    }
}

export default function RoleSideMenu({
    visible,
    activeRouteName,
    items,
    homeRouteName,
    onClose,
    onNavigate,
}: Props) {
    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <View style={{ flex: 1, flexDirection: "row" }}>
                <View style={{ width: '75%', backgroundColor: "#47c67b", height: '100%' }} className="shadow-2xl shadow-black">
                    <SafeAreaView style={{ flex: 1 }}>
                        <View className="items-center justify-center py-8" />

                        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                            {items.map((item) => {
                                const isActive =
                                    activeRouteName === item.name ||
                                    (!activeRouteName && item.name === homeRouteName);

                                return (
                                    <TouchableOpacity
                                        key={item.name}
                                        onPress={() => onNavigate(item.name)}
                                        activeOpacity={0.7}
                                        className={`flex-row items-center py-3 px-6 mx-0 my-1 rounded-r-full ${
                                            isActive ? "bg-white shadow-sm" : "bg-transparent"
                                        }`}
                                    >
                                        <View className="mr-4">{renderIcon(item.name, isActive)}</View>
                                        <Text
                                            className={`text-base font-semibold ${
                                                isActive ? "text-[#3fbe73]" : "text-white"
                                            }`}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}

                            <View className="mb-8">
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    className="flex-row items-center py-3 px-6 mx-0 my-1 rounded-r-full mt-4 border-t border-green-500/30 pt-4"
                                >
                                    <View className="mr-4">
                                        <SignOut size={24} color="#ef4444" weight="bold" />
                                    </View>
                                    <Text className="text-base font-semibold text-[#ef4444]">
                                        Logout
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                </View>
                
                <TouchableOpacity 
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} 
                    onPress={onClose} 
                    activeOpacity={1}
                />
            </View>
        </Modal>
    );
}
