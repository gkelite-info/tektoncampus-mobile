import React, { useRef, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CustomHeader from "./components/CustomHeader";
import RoleSideMenu, { RoleSideMenuItem } from "./components/RoleSideMenu";
import StudentTabs from "@/tabs/StudentTabs";
import StudentAssignments from "@/(screens)/student/assignments/assignments";
import StudentProgressScreen from "@/(screens)/student/studentProgress/studentProgress";
import ProjectsScreen from "@/(screens)/student/projects/projects";
import PlacementsScreen from "@/(screens)/student/placements/placements";
import LeaveRequestsScreen from "@/(screens)/student/leaveRequests/leaveRequests";
import ClubScreen from "@/(screens)/student/club/club";
import DriveScreen from "@/(screens)/student/drive/drive";
import MeetingsScreen from "@/(screens)/student/meetings/meetings";
import WellbeingScreen from "@/(screens)/student/wellbeing/wellbeing";
import StudentPayments from "@/(screens)/student/payments/payments";
import SettingsStackNavigator from "@/navigation/SettingsStackNavigator";

export type StudentDrawerParamList = {
    StudentTabs: undefined;
    Calendar: undefined;
    Attendance: undefined;
    Assignments: undefined;
    Academics: undefined;
    StudentProgress: undefined;
    Projects: undefined;
    Placements: undefined;
    LeaveRequests: undefined;
    Club: undefined;
    Drive: undefined;
    Meetings: undefined;
    Wellbeing: undefined;
    Payments: undefined;
    Settings: undefined;
};

const Stack = createNativeStackNavigator<StudentDrawerParamList>();

const menuItems: RoleSideMenuItem[] = [
    { name: "StudentTabs", label: "Home" },
    { name: "Calendar", label: "Calendar" },
    { name: "Attendance", label: "Attendance" },
    { name: "Assignments", label: "Assignments" },
    { name: "Academics", label: "Academics" },
    { name: "StudentProgress", label: "Student Progress" },
    { name: "Projects", label: "Projects" },
    { name: "Placements", label: "Placements" },
    { name: "LeaveRequests", label: "Leave Requests" },
    { name: "Club", label: "Club" },
    { name: "Drive", label: "Drive" },
    { name: "Meetings", label: "Meetings" },
    { name: "Wellbeing", label: "Wellbeing" },
    { name: "Payments", label: "Payments" },
    { name: "Settings", label: "Settings" },
];

const getActiveRouteName = (state: any): string => {
    if (!state || !state.routes) return "";
    const index = state.index ?? 0;
    const route = state.routes[index];
    if (!route) return "";
    if (route.state) {
        return getActiveRouteName(route.state);
    }
    return route.name || "";
};

export default function StudentDrawerNavigator() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigationRef = useRef<any>(null);

    // Dynamically evaluate active route name from the stack navigator state when the drawer is open
    let activeRouteName: keyof StudentDrawerParamList = "StudentTabs";
    if (isMenuOpen && navigationRef.current) {
        const navState = navigationRef.current.getState();
        const activeLeafName = getActiveRouteName(navState);
        if (activeLeafName) {
            if (activeLeafName === "Home") {
                activeRouteName = "StudentTabs";
            } else {
                activeRouteName = activeLeafName as keyof StudentDrawerParamList;
            }
        }
    }

    return (
        <>
            <Stack.Navigator
                initialRouteName="StudentTabs"
                screenOptions={({ navigation }) => {
                    navigationRef.current = navigation;
                    return {
                        headerShown: true,
                        headerTransparent: true,
                        header: () => (
                            <CustomHeader navigation={{ toggleDrawer: () => setIsMenuOpen(true) }} />
                        ),
                        freezeOnBlur: false,
                    };
                }}
            >
                <Stack.Screen name="StudentTabs" component={StudentTabs} />
                <Stack.Screen name="Assignments" component={StudentAssignments} />
                <Stack.Screen name="StudentProgress" component={StudentProgressScreen} />
                <Stack.Screen name="Projects" component={ProjectsScreen} />
                <Stack.Screen name="Placements" component={PlacementsScreen} />
                <Stack.Screen name="LeaveRequests" component={LeaveRequestsScreen} />
                <Stack.Screen name="Club" component={ClubScreen} />
                <Stack.Screen name="Drive" component={DriveScreen} />
                <Stack.Screen name="Meetings" component={MeetingsScreen} />
                <Stack.Screen name="Wellbeing" component={WellbeingScreen} />
                <Stack.Screen name="Payments" component={StudentPayments} />
                <Stack.Screen name="Settings" component={SettingsStackNavigator} />
            </Stack.Navigator>

            <RoleSideMenu
                visible={isMenuOpen}
                activeRouteName={activeRouteName}
                homeRouteName="StudentTabs"
                items={menuItems}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(routeName) => {
                    setIsMenuOpen(false);

                    setTimeout(() => {
                        if (routeName === "StudentTabs") {
                            navigationRef.current?.navigate("StudentTabs", { screen: "Home" });
                        } else if (routeName === "Calendar") {
                            navigationRef.current?.navigate("StudentTabs", { screen: "Calendar" });
                        } else if (routeName === "Attendance") {
                            navigationRef.current?.navigate("StudentTabs", { screen: "Attendance" });
                        } else if (routeName === "Academics") {
                            navigationRef.current?.navigate("StudentTabs", { screen: "Academics" });
                        } else {
                            navigationRef.current?.navigate(routeName);
                        }
                    }, 300);
                }}
            />
        </>
    );
}
