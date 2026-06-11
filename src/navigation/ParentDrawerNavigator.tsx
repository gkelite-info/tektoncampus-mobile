import React, { useRef, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CustomHeader from "./components/CustomHeader";
import RoleSideMenu, { RoleSideMenuItem } from "./components/RoleSideMenu";

import ParentTabs from "@/tabs/ParentTabs";

import {
    AcademicsScreen,
    StudentProgressScreen,
    ProjectsScreen,
    PlacementsScreen,
    LeaveRequestsScreen,
    ClubScreen,
    DriveScreen,
    MeetingsScreen,
    MyAttendanceScreen,
    WellbeingScreen,
    SettingsScreen,
} from "@/(screens)/student/mockScreens";

const ParentCalendar = () => <AcademicsScreen />;
const ParentAssignments = () => <AcademicsScreen />;
const ParentAttendance = () => <AcademicsScreen />;

export type ParentDrawerParamList = {
    ParentTabs: undefined;
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
    MyAttendance: undefined;
    Wellbeing: undefined;
    Payments: undefined;
    Settings: undefined;
};

const Stack = createNativeStackNavigator<ParentDrawerParamList>();

const menuItems: RoleSideMenuItem[] = [
    { name: "ParentTabs", label: "Home" },
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
    { name: "MyAttendance", label: "My Attendance" },
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

export default function ParentDrawerNavigator() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigationRef = useRef<any>(null);

    // Dynamically evaluate active route name from the stack navigator state when the drawer is open
    let activeRouteName: keyof ParentDrawerParamList = "ParentTabs";
    if (isMenuOpen && navigationRef.current) {
        const navState = navigationRef.current.getState();
        const activeLeafName = getActiveRouteName(navState);
        if (activeLeafName) {
            if (activeLeafName === "Home" || activeLeafName === "Dashboard") {
                activeRouteName = "ParentTabs";
            } else {
                activeRouteName = activeLeafName as keyof ParentDrawerParamList;
            }
        }
    }

    return (
        <>
            <Stack.Navigator
                initialRouteName="ParentTabs"
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
                <Stack.Screen name="ParentTabs" component={ParentTabs} />
                <Stack.Screen name="Calendar" component={ParentCalendar} />
                <Stack.Screen name="Attendance" component={ParentAttendance} />
                <Stack.Screen name="Assignments" component={ParentAssignments} />
                <Stack.Screen name="Academics" component={AcademicsScreen} />
                <Stack.Screen name="StudentProgress" component={StudentProgressScreen} />
                <Stack.Screen name="Projects" component={ProjectsScreen} />
                <Stack.Screen name="Placements" component={PlacementsScreen} />
                <Stack.Screen name="LeaveRequests" component={LeaveRequestsScreen} />
                <Stack.Screen name="Club" component={ClubScreen} />
                <Stack.Screen name="Drive" component={DriveScreen} />
                <Stack.Screen name="Meetings" component={MeetingsScreen} />
                <Stack.Screen name="MyAttendance" component={MyAttendanceScreen} />
                <Stack.Screen name="Wellbeing" component={WellbeingScreen} />
                <Stack.Screen name="Payments" component={AcademicsScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
            </Stack.Navigator>

            <RoleSideMenu
                visible={isMenuOpen}
                activeRouteName={activeRouteName}
                homeRouteName="ParentTabs"
                items={menuItems}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(routeName) => {
                    setIsMenuOpen(false);
                    // Use a short delay to allow the Modal dismissal to start and avoid transition layout freezes on Android
                    setTimeout(() => {
                        navigationRef.current?.navigate(routeName);
                    }, 100);
                }}
            />
        </>
    );
}
