import { Text } from '@/components/AppText';
import React from "react";
import { View, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { House, ClipboardText, BookOpen, User, Calendar } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StudentHome from "@/(screens)/student/student";
import StudentAttendance from "@/(screens)/student/attendance/attendance";
import ProfileContainer from "@/(screens)/Profile/ProfileContainer";
import StudentCalendar from "@/(screens)/student/calendar/calendar";
import StudentAcademics from "@/(screens)/student/academics/academics";

export type StudentTabParamList = {
    Calendar: undefined;
    Academics: undefined;
    Home: undefined;
    Attendance: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<StudentTabParamList>();
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function StudentCustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const bottomInset = insets.bottom || 10; 

    return (
        <View
            className="absolute bottom-0 bg-transparent"
            style={{ width: SCREEN_WIDTH, height: 120 + bottomInset }}
        >
            <View 
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[15px] shadow-lg shadow-black/10" 
                style={{ height: 85 + bottomInset }}
            />
            <View 
                className="flex-row absolute left-0 right-0"
                style={{ height: 85, bottom: bottomInset }}
            >
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;
                    
                    const coreRoutes = ["Calendar", "Academics", "Home", "Attendance", "Profile"];
                    if (!coreRoutes.includes(route.name)) return null;

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
                        Academics: "Academics",
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
                            case "Academics": return <BookOpen size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Attendance": return <ClipboardText size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Profile": return <User size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            default: return null;
                        }
                    };

                    if (route.name === "Home") {
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

// The default export is no longer needed since we use StudentDrawerNavigator as the root tab navigator.
// We keep it around temporarily to avoid import errors before the navigator is updated.
export default function StudentTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <StudentCustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
            initialRouteName="Home"
        >
            <Tab.Screen name="Calendar" component={StudentCalendar} />
            <Tab.Screen name="Academics" component={StudentAcademics} />
            <Tab.Screen name="Home" component={StudentHome} />
            <Tab.Screen name="Attendance" component={StudentAttendance} />
            <Tab.Screen name="Profile" component={ProfileContainer} />
        </Tab.Navigator>
    );
}
