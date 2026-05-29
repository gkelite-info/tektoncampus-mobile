import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import StudentCustomDrawer from "./components/StudentCustomDrawer";
import CustomHeader from "./components/CustomHeader";

import StudentTabs from "@/tabs/StudentTabs";

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
    SettingsScreen
} from "@/(screens)/student/mockScreens";

import StudentCalendar from "@/(screens)/student/calendar/calendar";
import StudentAssignments from "@/(screens)/student/assignments/assignments";
import StudentAttendance from "@/(screens)/student/attendance/attendance";

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
    MyAttendance: undefined;
    Wellbeing: undefined;
    Settings: undefined;
};

const Drawer = createDrawerNavigator<StudentDrawerParamList>();

export default function StudentDrawerNavigator() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <StudentCustomDrawer {...props} />}
            screenOptions={{
                headerShown: true,
                headerTransparent: true,
                header: () => <CustomHeader />,
                drawerType: 'slide',
                overlayColor: 'transparent',
                drawerStyle: {
                    width: '75%',
                    backgroundColor: 'transparent',
                },
            }}
            initialRouteName="StudentTabs"
        >
            <Drawer.Screen
    name="StudentTabs"
    component={StudentTabs}
    options={{
        drawerItemStyle: { display: "none" },
    }}
/>
            <Drawer.Screen name="Calendar" component={StudentCalendar} />
            <Drawer.Screen name="Attendance" component={StudentAttendance} />
            <Drawer.Screen name="Assignments" component={StudentAssignments} />
            
            <Drawer.Screen name="Academics" component={AcademicsScreen} />
            <Drawer.Screen name="StudentProgress" component={StudentProgressScreen} />
            <Drawer.Screen name="Projects" component={ProjectsScreen} />
            <Drawer.Screen name="Placements" component={PlacementsScreen} />
            <Drawer.Screen name="LeaveRequests" component={LeaveRequestsScreen} />
            <Drawer.Screen name="Club" component={ClubScreen} />
            <Drawer.Screen name="Drive" component={DriveScreen} />
            <Drawer.Screen name="Meetings" component={MeetingsScreen} />
            <Drawer.Screen name="MyAttendance" component={MyAttendanceScreen} />
            <Drawer.Screen name="Wellbeing" component={WellbeingScreen} />
            <Drawer.Screen name="Settings" component={SettingsScreen} />
        </Drawer.Navigator>
    );
}
