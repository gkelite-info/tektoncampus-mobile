import React from "react";
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from "react-native";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { ClipboardText, UsersThree, BookOpen, User, House } from "phosphor-react-native";
import FacultyDashboard from "@/(screens)/faculty/faculty";
import FacultyAssignmente from "@/(screens)/faculty/assignments/assignments";
import FacultyAttendance from "@/(screens)/faculty/attendance/attendance";
import Profile from "@/(screens)/Profile/profile";
import FacultyAcademics from "@/(screens)/faculty/academics/academics";

// Strict Typescript interface definitions for Faculty Navigation context
export type FacultyTabParamList = {
    Assignments: undefined;
    Academics: undefined;
    Dashboard: undefined; // Map central Home button structure to primary Dashboard screen
    Attendance: undefined;
    Profile: undefined;
};

// Target screen mocks using Tailwind design system
function MockFacultyScreen({ title }: { title: string }) {
    return (
        <View className="flex-1 justify-center items-center bg-[#0F172A]">
            <Text className="text-white text-lg font-semibold">{title}</Text>
        </View>
    );
}

const Tab = createBottomTabNavigator<FacultyTabParamList>();
const { width: SCREEN_WIDTH } = Dimensions.get("window");

function FacultyCustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    return (
        <View
            className="absolute bottom-0 bg-transparent"
            style={{ width: SCREEN_WIDTH, height: 120 }}
        >
            <View className="absolute bottom-0 left-0 right-0 h-[85px] bg-white flex-row rounded-t-[15px] shadow-lg shadow-black/10" />

            <View className="flex-row h-[85px] absolute bottom-0 left-0 right-0">
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: "tabPress",
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    // Precise Label configurations mapped directly over Faculty structural keys
                    const labels: Record<keyof FacultyTabParamList, string> = {
                        Assignments: "Assignments",
                        Academics: "Academics",
                        Dashboard: "Home", // Keeps label standard matching original interface design
                        Attendance: "Attendance",
                        Profile: "Profile",
                    };

                    const label = labels[route.name as keyof FacultyTabParamList];
                    const iconSize = 24;
                    const iconColor = isFocused ? "#6AE18B" : "#94A3B8";

                    // Icon parsing switch engine matching Phosphor specifications
                    const renderIcon = () => {
                        switch (route.name) {
                            case "Assignments": return <ClipboardText size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Students": return <UsersThree size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Attendance": return <BookOpen size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Profile": return <User size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            default: return null;
                        }
                    };

                    // --- EXTRAORDINARY FLOATING ACTION BUTTON (DASHBOARD SCREEN ANCHOR) ---
                    if (route.name === "Dashboard") {
                        return (
                            <View key={route.key} className="flex-1 items-center justify-center">
                                <TouchableWithoutFeedback onPress={onPress}>
                                    <View
                                        className="absolute -top-[24px] w-[64px] h-[64px] rounded-full bg-[#7BE47B] items-center justify-center border-[5px] border-white"
                                        style={{
                                            shadowColor: "#7BE47B",
                                            shadowOffset: { width: 0, height: 6 },
                                            shadowOpacity: 0.35,
                                            shadowRadius: 8,
                                            elevation: 6,
                                        }}
                                    >
                                        <House size={28} color="#FFFFFF" weight="fill" />
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        );
                    }

                    // --- STANDARD SYSTEM RUNTIME NAVIGATION TABS ---
                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            activeOpacity={0.7}
                            className="flex-1 items-center justify-center pt-1"
                        >
                            {renderIcon()}
                            <Text
                                className={`text-[11px] mt-1 font-semibold tracking-wide ${isFocused ? "text-[#1E293B]" : "text-[#94A3B8]"
                                    }`}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

export default function FacultyTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <FacultyCustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
            initialRouteName="Dashboard"
        >
            <Tab.Screen name="Assignments" component={FacultyAssignmente} />
            <Tab.Screen name="Academics" component={FacultyAcademics} />
            <Tab.Screen name="Dashboard" component={FacultyDashboard} />
            <Tab.Screen name="Attendance" component={FacultyAttendance} />
            <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
    );
}