import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import {
    House,
    Calendar,
    CheckCircle,
    FileText,
    GraduationCap,
    ChartLineUp,
    ClipboardText,
    Buildings,
    CalendarCheck,
    UsersThree,
    FolderOpen,
    PresentationChart,
    Smiley,
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

export default function StudentCustomDrawer(props: DrawerContentComponentProps) {
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
                    icon={<House size={24} color={isActive("StudentTabs") ? "#3fbe73" : "#FFFFFF"} weight={isActive("StudentTabs") ? "fill" : "regular"} />}
                    isActive={isActive("StudentTabs")}
                    onPress={() => navigateTo("StudentTabs")}
                />
                <DrawerItem
                    label="Calendar"
                    icon={<Calendar size={24} color={isActive("Calendar") ? "#3fbe73" : "#FFFFFF"} weight={isActive("Calendar") ? "fill" : "regular"} />}
                    isActive={isActive("Calendar")}
                    onPress={() => navigateTo("Calendar")}
                />
                <DrawerItem
                    label="Attendance"
                    icon={<CheckCircle size={24} color={isActive("Attendance") ? "#3fbe73" : "#FFFFFF"} weight={isActive("Attendance") ? "fill" : "regular"} />}
                    isActive={isActive("Attendance")}
                    onPress={() => navigateTo("Attendance")}
                />
                <DrawerItem
                    label="Assignments"
                    icon={<FileText size={24} color={isActive("Assignments") ? "#3fbe73" : "#FFFFFF"} weight={isActive("Assignments") ? "fill" : "regular"} />}
                    isActive={isActive("Assignments")}
                    onPress={() => navigateTo("Assignments")}
                />
                <DrawerItem
                    label="Academics"
                    icon={<GraduationCap size={24} color={isActive("Academics") ? "#3fbe73" : "#FFFFFF"} weight={isActive("Academics") ? "fill" : "regular"} />}
                    isActive={isActive("Academics")}
                    onPress={() => navigateTo("Academics")}
                />
                <DrawerItem
                    label="Student Progress"
                    icon={<ChartLineUp size={24} color={isActive("StudentProgress") ? "#3fbe73" : "#FFFFFF"} weight={isActive("StudentProgress") ? "fill" : "regular"} />}
                    isActive={isActive("StudentProgress")}
                    onPress={() => navigateTo("StudentProgress")}
                />
                <DrawerItem
                    label="Projects"
                    icon={<ClipboardText size={24} color={isActive("Projects") ? "#3fbe73" : "#FFFFFF"} weight={isActive("Projects") ? "fill" : "regular"} />}
                    isActive={isActive("Projects")}
                    onPress={() => navigateTo("Projects")}
                />
                <DrawerItem
                    label="Placements"
                    icon={<Buildings size={24} color={isActive("Placements") ? "#3fbe73" : "#FFFFFF"} weight={isActive("Placements") ? "fill" : "regular"} />}
                    isActive={isActive("Placements")}
                    onPress={() => navigateTo("Placements")}
                />
                <DrawerItem
                    label="Leave Requests"
                    icon={<CalendarCheck size={24} color={isActive("LeaveRequests") ? "#3fbe73" : "#FFFFFF"} weight={isActive("LeaveRequests") ? "fill" : "regular"} />}
                    isActive={isActive("LeaveRequests")}
                    onPress={() => navigateTo("LeaveRequests")}
                />
                <DrawerItem
                    label="Club"
                    icon={<UsersThree size={24} color={isActive("Club") ? "#3fbe73" : "#FFFFFF"} weight={isActive("Club") ? "fill" : "regular"} />}
                    isActive={isActive("Club")}
                    onPress={() => navigateTo("Club")}
                />
                <DrawerItem
                    label="Drive"
                    icon={<FolderOpen size={24} color={isActive("Drive") ? "#3fbe73" : "#FFFFFF"} weight={isActive("Drive") ? "fill" : "regular"} />}
                    isActive={isActive("Drive")}
                    onPress={() => navigateTo("Drive")}
                />
                <DrawerItem
                    label="Meetings"
                    icon={<PresentationChart size={24} color={isActive("Meetings") ? "#3fbe73" : "#FFFFFF"} weight={isActive("Meetings") ? "fill" : "regular"} />}
                    isActive={isActive("Meetings")}
                    onPress={() => navigateTo("Meetings")}
                />
                <DrawerItem
                    label="My Attendance"
                    icon={<CheckCircle size={24} color={isActive("MyAttendance") ? "#3fbe73" : "#FFFFFF"} weight={isActive("MyAttendance") ? "fill" : "regular"} />}
                    isActive={isActive("MyAttendance")}
                    onPress={() => navigateTo("MyAttendance")}
                />
                <DrawerItem
                    label="Wellbeing"
                    icon={<Smiley size={24} color={isActive("Wellbeing") ? "#3fbe73" : "#FFFFFF"} weight={isActive("Wellbeing") ? "fill" : "regular"} />}
                    isActive={isActive("Wellbeing")}
                    onPress={() => navigateTo("Wellbeing")}
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
