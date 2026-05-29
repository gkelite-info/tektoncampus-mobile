import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import ParentCustomDrawer from "./components/ParentCustomDrawer";
import CustomHeader from "./components/CustomHeader";

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
    SettingsScreen
} from "@/(screens)/student/mockScreens";


const ParentAttendance = () => <AcademicsScreen />; 
const ParentPayments = () => <AcademicsScreen />; 

export type ParentDrawerParamList = {
    ParentTabs: undefined;
    Attendance: undefined;
    StudentProgress: undefined;
    Payments: undefined;
    Meetings: undefined;
    Settings: undefined;
};

const Drawer = createDrawerNavigator<ParentDrawerParamList>();

export default function ParentDrawerNavigator() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <ParentCustomDrawer {...props} />}
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
            initialRouteName="ParentTabs"
        >
            <Drawer.Screen name="ParentTabs" component={ParentTabs} />
            <Drawer.Screen name="Attendance" component={ParentAttendance} />
            <Drawer.Screen name="StudentProgress" component={StudentProgressScreen} />
            <Drawer.Screen name="Payments" component={ParentPayments} />
            <Drawer.Screen name="Meetings" component={MeetingsScreen} />
            <Drawer.Screen name="Settings" component={SettingsScreen} />
        </Drawer.Navigator>
    );
}
