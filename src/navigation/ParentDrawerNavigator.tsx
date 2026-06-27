import React, { useRef, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CustomHeader from "./components/CustomHeader";
import RoleSideMenu, { RoleSideMenuItem } from "./components/RoleSideMenu";

import ParentTabs from "@/tabs/ParentTabs";

import ParentMeetings from "@/(screens)/parent/Meetings/meetings";
import SettingsStackNavigator from "@/navigation/SettingsStackNavigator";
import ParentAttendance from "@/(screens)/parent/Attendance/attendance";
import ParentProgress from "@/(screens)/parent/Progress/progress";
import ParentPayment from "@/(screens)/parent/Payment/payment";



export type ParentDrawerParamList = {
    ParentTabs: undefined;
    Attendance: undefined;
    StudentProgress: undefined;
    Meetings: undefined;
    Payments: undefined;
    Settings: undefined;
};

const Stack = createNativeStackNavigator<ParentDrawerParamList>();

const menuItems: RoleSideMenuItem[] = [
    { name: "ParentTabs", label: "Home" },
    { name: "Attendance", label: "Attendance" },
    { name: "StudentProgress", label: "Student Progress" },
    { name: "Meetings", label: "Meetings" },
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
                <Stack.Screen name="Attendance" component={ParentAttendance} />
                <Stack.Screen name="StudentProgress" component={ParentProgress} />
                <Stack.Screen name="Meetings" component={ParentMeetings} />
                <Stack.Screen name="Payments" component={ParentPayment} />
                <Stack.Screen name="Settings" component={SettingsStackNavigator} />
            </Stack.Navigator>

            <RoleSideMenu
                visible={isMenuOpen}
                activeRouteName={activeRouteName}
                homeRouteName="ParentTabs"
                items={menuItems}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(routeName) => {
                    setIsMenuOpen(false);
                    
                    setTimeout(() => {
                        navigationRef.current?.navigate(routeName);
                    }, 100);
                }}
            />
        </>
    );
}
