import React, { useRef, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CustomHeader from "./components/CustomHeader";
import RoleSideMenu, { RoleSideMenuItem } from "./components/RoleSideMenu";

import FacultyTabs from "@/tabs/FacultyTabs";

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

import CalendarScreen from "@/(screens)/faculty/calendar/CalendarScreen";
import FacultyAttendance from "@/(screens)/faculty/attendance/attendance";

import FacultyAssignments from "@/(screens)/faculty/assignments/assignments";

export type FacultyDrawerParamList = {
    FacultyTabs: undefined;
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
    Settings: undefined;
};

const Stack = createNativeStackNavigator<FacultyDrawerParamList>();

const menuItems: RoleSideMenuItem[] = [
    { name: "FacultyTabs", label: "Home" },
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
    { name: "Settings", label: "Settings" },
];

export default function FacultyDrawerNavigator() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeRouteName, setActiveRouteName] = useState<keyof FacultyDrawerParamList>("FacultyTabs");
    const navigationRef = useRef<any>(null);

    return (
        <>
            <Stack.Navigator
                initialRouteName="FacultyTabs"
                screenOptions={({ navigation }) => {
                    navigationRef.current = navigation;

                    return {
                        headerShown: true,
                        headerTransparent: true,
                        header: () => (
                            <CustomHeader navigation={{ toggleDrawer: () => setIsMenuOpen(true) }} />
                        ),
                    };
                }}
                screenListeners={{
                    state: (event) => {
                        const route = event.data.state.routes[event.data.state.index];
                        setActiveRouteName(route.name as keyof FacultyDrawerParamList);
                    },
                }}
            >
                <Stack.Screen name="FacultyTabs" component={FacultyTabs} />
                <Stack.Screen name="Calendar" component={CalendarScreen} />
                <Stack.Screen name="Attendance" component={FacultyAttendance} />
                <Stack.Screen name="Assignments" component={FacultyAssignments} />
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
                <Stack.Screen name="Settings" component={SettingsScreen} />
            </Stack.Navigator>

            <RoleSideMenu
                visible={isMenuOpen}
                activeRouteName={activeRouteName}
                homeRouteName="FacultyTabs"
                items={menuItems}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(routeName) => {
                    setIsMenuOpen(false);
                    setActiveRouteName(routeName as keyof FacultyDrawerParamList);
                    navigationRef.current?.navigate(routeName);
                }}
            />
        </>
    );
}
