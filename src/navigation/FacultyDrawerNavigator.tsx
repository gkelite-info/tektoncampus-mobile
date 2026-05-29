import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import FacultyCustomDrawer from "./components/FacultyCustomDrawer";
import CustomHeader from "./components/CustomHeader";

// The main tab bar for faculties
import FacultyTabs from "@/tabs/FacultyTabs";

// Reusing Mock screens from student folder since the names and functionality are identical placeholders
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

// We will use existing screens or mock screens for these standard options
// For now, mapping them to mock screens if faculty-specific ones don't exist yet, 
// or I'll just use the mock screens to prevent crashes.
const FacultyCalendar = () => <AcademicsScreen />; // Replace with actual
const FacultyAssignments = () => <AcademicsScreen />; // Replace with actual
const FacultyAttendance = () => <AcademicsScreen />; // Replace with actual

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

const Drawer = createDrawerNavigator<FacultyDrawerParamList>();

export default function FacultyDrawerNavigator() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <FacultyCustomDrawer {...props} />}
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
            initialRouteName="FacultyTabs"
        >
            <Drawer.Screen
    name="FacultyTabs"
    component={FacultyTabs}
    options={{
        drawerItemStyle: { display: "none" },
    }}
/>
            <Drawer.Screen name="Calendar" component={FacultyCalendar} />
            <Drawer.Screen name="Attendance" component={FacultyAttendance} />
            <Drawer.Screen name="Assignments" component={FacultyAssignments} />
            
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
