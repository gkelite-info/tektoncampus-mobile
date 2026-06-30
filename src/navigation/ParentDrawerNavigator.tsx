import React, { useRef, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CustomHeader from "./components/CustomHeader";
import RoleSideMenu, { RoleSideMenuItem } from "./components/RoleSideMenu";

import { ParentCustomTabBar } from "@/tabs/ParentTabs";
import ParentHomeScreen from "@/(screens)/parent/parent";
import ProfileContainer from "@/(screens)/Profile/ProfileContainer";

import ParentMeetings from "@/(screens)/parent/Meetings/meetings";
import SettingsStackNavigator from "@/navigation/SettingsStackNavigator";
import ParentAttendance from "@/(screens)/parent/Attendance/attendance";
import ParentProgress from "@/(screens)/parent/Progress/progress";
import ParentPayment from "@/(screens)/parent/Payment/payment";



export type ParentDrawerParamList = {
    Home: undefined;
    Profile: undefined;
    Progress: undefined;
    Payment: undefined;
    Attendance: undefined;
    StudentProgress: undefined;
    Meetings: undefined;
    Payments: undefined;
    Settings: undefined;
};

const Tab = createBottomTabNavigator<ParentDrawerParamList>();

const menuItems: RoleSideMenuItem[] = [
    { name: "Home", label: "Home" },
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
    let activeRouteName: keyof ParentDrawerParamList = "Home";
    if (isMenuOpen && navigationRef.current) {
        const navState = navigationRef.current.getState();
        const activeLeafName = getActiveRouteName(navState);
        if (activeLeafName) {
            if (activeLeafName === "Home" || activeLeafName === "Dashboard") {
                activeRouteName = "Home";
            } else {
                activeRouteName = activeLeafName as keyof ParentDrawerParamList;
            }
        }
    }

    return (
        <>
            <Tab.Navigator
                initialRouteName="Home"
                tabBar={(props) => <ParentCustomTabBar {...props} />}
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
                        // Optionally update some state if needed
                    },
                }}
            >
                <Tab.Screen name="StudentProgress" component={ParentProgress} />
                <Tab.Screen name="Payments" component={ParentPayment} />
                <Tab.Screen name="Home" component={ParentHomeScreen} />
                <Tab.Screen name="Attendance" component={ParentAttendance} />
                <Tab.Screen name="Profile" component={ProfileContainer} />
                <Tab.Screen name="Meetings" component={ParentMeetings} />
                <Tab.Screen name="Settings" component={SettingsStackNavigator} />
            </Tab.Navigator>

            <RoleSideMenu
                visible={isMenuOpen}
                activeRouteName={activeRouteName}
                homeRouteName="Home"
                items={menuItems}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(routeName) => {
                    setIsMenuOpen(false);
                    
                    setTimeout(() => {
                        if (routeName === "ParentTabs" || routeName === "Home") {
                            navigationRef.current?.navigate("Home");
                        } else {
                            navigationRef.current?.navigate(routeName);
                        }
                    }, 100);
                }}
            />
        </>
    );
}
