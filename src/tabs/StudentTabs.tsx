import React from "react";
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from "react-native";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { House, ClipboardText, BookOpen, User, Calendar } from "phosphor-react-native";
import StudentHome from "@/(screens)/student/student";
import StudentAssignments from "@/(screens)/student/assignments/assignments";
import StudentAttendance from "@/(screens)/student/attendance/attendance";
import Profile from "@/(screens)/Profile/profile";
import StudentCalendar from "@/(screens)/student/calendar/calendar";

export type StudentTabParamList = {
    Calendar: undefined;
    Assignments: undefined;
    Home: undefined;
    Attendance: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<StudentTabParamList>();
const { width: SCREEN_WIDTH } = Dimensions.get("window");

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    return (
        <View
            className="absolute bottom-0 bg-transparent"
            style={{ width: SCREEN_WIDTH, height: 120 }}
        >
            <View className="absolute bottom-0 left-0 right-0 h-[85px] bg-white rounded-t-[15px] flex-row shadow-lg shadow-black/10" />
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

                    const labels: Record<keyof StudentTabParamList, string> = {
                        Calendar: "Calendar",
                        Assignments: "Academics",
                        Home: "Home",
                        Attendance: "Attendance",
                        Profile: "Profile",
                    };

                    const label = labels[route.name as keyof StudentTabParamList];
                    const iconSize = 24;
                    const iconColor = isFocused ? "#6AE18B" : "#94A3B8";

                    const renderIcon = () => {
                        switch (route.name) {
                            case "Calendar": return <Calendar size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Assignments": return <BookOpen size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Attendance": return <ClipboardText size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Profile": return <User size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            default: return null;
                        }
                    };

                    // --- CENTRAL GREEN HOME BUTTON (NO OPACITY EFFECT ON TAP) ---
                    if (route.name === "Home") {
                        return (
                            <View key={route.key} className="flex-1 items-center justify-center">
                                <TouchableWithoutFeedback onPress={onPress}>
                                    <View
                                        /* Adjusted positioning (-top-[24px]) to match the new taller bar height perfectly */
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

                    // --- STANDARD SIDE NAVIGATION TABS ---
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

export default function StudentTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
            initialRouteName="Home"
        >
            <Tab.Screen name="Calendar" component={StudentCalendar} />
            <Tab.Screen name="Assignments" component={StudentAssignments} />
            <Tab.Screen name="Home" component={StudentHome} />
            <Tab.Screen name="Attendance" component={StudentAttendance} />
            <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
    );
}
