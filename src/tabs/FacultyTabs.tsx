import { Text } from '@/components/AppText';
import React from "react";
import { View, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { ClipboardText, UsersThree, BookOpen, User, House } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FacultyDashboard from "@/(screens)/faculty/faculty";
import FacultyAssignmente from "@/(screens)/faculty/assignments/assignments";
import FacultyAttendance from "@/(screens)/faculty/attendance/attendance";
import ProfileContainer from "@/(screens)/Profile/ProfileContainer";
import FacultyAcademics from "@/(screens)/faculty/academics/academics";


export type FacultyTabParamList = {
    Assignments: undefined;
    Academics: undefined;
    Dashboard: undefined; 
    Attendance: undefined;
    Profile: undefined;
};


function MockFacultyScreen({ title }: { title: string }) {
    return (
        <View className="flex-1 justify-center items-center bg-[#0F172A]">
            <Text className="text-white text-lg font-semibold">{title}</Text>
        </View>
    );
}

const Tab = createBottomTabNavigator<FacultyTabParamList>();
const { width: SCREEN_WIDTH } = Dimensions.get("window");

import { useTranslation } from 'react-i18next';

export function FacultyCustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { t } = useTranslation();
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
                    
                    const coreRoutes = ["Assignments", "Academics", "Dashboard", "Attendance", "Profile"];
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

                    
                    const labels: Record<keyof FacultyTabParamList, string> = {
                        Assignments: t("Navbars.Assignments", "Assignments"),
                        Academics: t("Navbars.Academics", "Academics"),
                        Dashboard: t("Navbars.Home", "Home"), 
                        Attendance: t("Navbars.Attendance", "Attendance"),
                        Profile: t("Navbars.Profile", "Profile"),
                    };

                    const label = labels[route.name as keyof FacultyTabParamList];
                    const iconSize = 24;
                    const iconColor = isFocused ? "#6AE18B" : "#94A3B8";

                    
                    const renderIcon = () => {
                        switch (route.name) {
                            case "Assignments": return <ClipboardText size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Academics": return <UsersThree size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Attendance": return <BookOpen size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Profile": return <User size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            default: return null;
                        }
                    };

                    
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
            <Tab.Screen name="Profile" component={ProfileContainer} />
        </Tab.Navigator>
    );
}