import { Text } from '@/components/AppText';
import React from "react";
import { View, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { ChartLineUp, CreditCard, ClipboardText, User, House } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ParentHomeScreen from "@/(screens)/parent/parent";
import ParentProgress from "@/(screens)/parent/Progress/progress";
import ParentPayment from "@/(screens)/parent/Payment/payment";
import ProfileContainer from "@/(screens)/Profile/ProfileContainer";
import ParentAttendance from "@/(screens)/parent/Attendance/attendance";

export type ParentTabParamList = {
    StudentProgress: undefined;
    Payments: undefined;
    Home: undefined;
    Attendance: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<ParentTabParamList>();
const { width: SCREEN_WIDTH } = Dimensions.get("window");

import { useTranslation } from 'react-i18next';

export function ParentCustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
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

                    const coreRoutes = ["StudentProgress", "Payments", "Home", "Attendance", "Profile"];
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

                    const labels: Record<keyof ParentTabParamList, string> = {
                        StudentProgress: t("Navbars.Progress", "Progress"),
                        Payments: t("Navbars.Payment", "Payment"),
                        Home: t("Navbars.Home", "Home"),
                        Attendance: t("Navbars.Attendance", "Attendance"),
                        Profile: t("Navbars.Profile", "Profile"),
                    };

                    const label = labels[route.name as keyof ParentTabParamList];
                    const iconSize = 24;
                    const iconColor = isFocused ? "#6AE18B" : "#94A3B8";
                    
                    const renderIcon = () => {
                        switch (route.name) {
                            case "StudentProgress": return <ChartLineUp size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Payments": return <CreditCard size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
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

// The default export is no longer needed since we use ParentDrawerNavigator as the root tab navigator.
// We keep it around temporarily to avoid import errors before the navigator is updated.
export default function ParentTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <ParentCustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
            initialRouteName="Home"
        >
            <Tab.Screen name="StudentProgress" component={ParentProgress} />
            <Tab.Screen name="Payments" component={ParentPayment} />
            <Tab.Screen name="Home" component={ParentHomeScreen} />
            <Tab.Screen name="Attendance" component={ParentAttendance} />
            <Tab.Screen name="Profile" component={ProfileContainer} />
        </Tab.Navigator>
    );
}