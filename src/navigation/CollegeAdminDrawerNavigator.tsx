import React, { useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CustomHeader from "./components/CustomHeader";
import RoleSideMenu, { RoleSideMenuItem } from "./components/RoleSideMenu";

import ProfileContainer from "@/(screens)/Profile/ProfileContainer";
import SettingsStackNavigator from "@/navigation/SettingsStackNavigator";
import DashboardScreen from "@/(screens)/college-admin/dashboard/DashboardScreen";
import AdminListScreen from "@/(screens)/college-admin/lists/AdminListScreen";
import FacultyListScreen from "@/(screens)/college-admin/lists/FacultyListScreen";
import StudentListScreen from "@/(screens)/college-admin/lists/StudentListScreen";
import ParentListScreen from "@/(screens)/college-admin/lists/ParentListScreen";
import FinanceListScreen from "@/(screens)/college-admin/lists/FinanceListScreen";

export type CollegeAdminDrawerParamList = {
    Dashboard: undefined;
    AdminList: undefined;
    FacultyList: undefined;
    StudentList: undefined;
    ParentList: undefined;
    FinanceList: undefined;
    InstitutionManagement: undefined;
    AddAdmin: undefined;
    Calendar: undefined;
    Club: undefined;
    LeaveRequests: undefined;
    Drive: undefined;
    MyAttendance: undefined;
    Wellbeing: undefined;
    Settings: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<CollegeAdminDrawerParamList>();

const menuItems: RoleSideMenuItem[] = [
    { name: "Dashboard", label: "Home" },
    { name: "InstitutionManagement", label: "Institution Management" },
    { name: "AddAdmin", label: "Add Admin" },
    { name: "Calendar", label: "Calendar" },
    { name: "Club", label: "Club" },
    { name: "LeaveRequests", label: "Leave Requests" },
    { name: "Drive", label: "Drive" },
    { name: "MyAttendance", label: "My Attendance" },
    { name: "Wellbeing", label: "Wellbeing" },
    { name: "Settings", label: "Settings" },
];

function PlaceholderScreen({ route }: { route: any }) {
    return (
        <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
                {route.name} Screen (Placeholder)
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    placeholderText: {
        color: '#334155',
        fontSize: 18,
        fontWeight: 'bold',
    }
});

export default function CollegeAdminDrawerNavigator() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeRouteName, setActiveRouteName] = useState<keyof CollegeAdminDrawerParamList>("Dashboard");
    const navigationRef = useRef<any>(null);

    return (
        <>
            <Tab.Navigator
                initialRouteName="Dashboard"
                screenOptions={({ navigation }) => {
                    navigationRef.current = navigation;

                    return {
                        headerShown: true,
                        headerTransparent: true,
                        header: () => (
                            <CustomHeader navigation={{ toggleDrawer: () => setIsMenuOpen(true) }} />
                        ),
                        tabBarStyle: { display: "none" }
                    };
                }}
                screenListeners={{
                    state: (event) => {
                        const route = event.data.state.routes[event.data.state.index];
                        setActiveRouteName(route.name as keyof CollegeAdminDrawerParamList);
                    },
                }}
            >
                <Tab.Screen name="Dashboard" component={DashboardScreen} />
                <Tab.Screen name="AdminList" component={AdminListScreen} />
                <Tab.Screen name="FacultyList" component={FacultyListScreen} />
                <Tab.Screen name="StudentList" component={StudentListScreen} />
                <Tab.Screen name="ParentList" component={ParentListScreen} />
                <Tab.Screen name="FinanceList" component={FinanceListScreen} />
                <Tab.Screen name="InstitutionManagement" component={PlaceholderScreen} />
                <Tab.Screen name="AddAdmin" component={PlaceholderScreen} />
                <Tab.Screen name="Calendar" component={PlaceholderScreen} />
                <Tab.Screen name="Club" component={PlaceholderScreen} />
                <Tab.Screen name="LeaveRequests" component={PlaceholderScreen} />
                <Tab.Screen name="Drive" component={PlaceholderScreen} />
                <Tab.Screen name="MyAttendance" component={PlaceholderScreen} />
                <Tab.Screen name="Wellbeing" component={PlaceholderScreen} />
                <Tab.Screen name="Settings" component={SettingsStackNavigator} />
                <Tab.Screen name="Profile" component={ProfileContainer} />
            </Tab.Navigator>

            <RoleSideMenu
                visible={isMenuOpen}
                activeRouteName={activeRouteName}
                homeRouteName="Dashboard"
                items={menuItems}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(routeName) => {
                    setIsMenuOpen(false);
                    setActiveRouteName(routeName as keyof CollegeAdminDrawerParamList);
                    navigationRef.current?.navigate(routeName);
                }}
            />
        </>
    );
}
