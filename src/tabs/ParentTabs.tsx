import React from "react";
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from "react-native";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { ChartLineUp, CreditCard, ClipboardText, User, House } from "phosphor-react-native";
import ParentHomeScreen from "@/(screens)/parent/parent";
import ParentProgress from "@/(screens)/parent/Progress/progress";
import ParentPayment from "@/(screens)/parent/Payment/payment";
import Profile from "@/(screens)/Profile/profile";
import ParentAttendance from "@/(screens)/parent/Attendance/attendance";

// Strict TypeScript navigation route configurations for Parent view context
export type ParentTabParamList = {
    Progress: undefined;
    Payment: undefined;
    Home: undefined;
    Attendance: undefined;
    Profile: undefined;
};

// Layout Mock Screens
function MockParentScreen({ title }: { title: string }) {
    return (
        <View className="flex-1 justify-center items-center bg-[#0F172A]">
            <Text className="text-white text-lg font-semibold">{title}</Text>
        </View>
    );
}

const Tab = createBottomTabNavigator<ParentTabParamList>();
const { width: SCREEN_WIDTH } = Dimensions.get("window");

function ParentCustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    return (
        /* Global absolute navigation zone layer wrapper */
        <View
            className="absolute bottom-0 bg-transparent"
            style={{ width: SCREEN_WIDTH, height: 120 }}
        >
            {/* FLAT TALL WHITE BACKGROUND
        Maintains matching height (85px) and flat top framing profile across all views
      */}
            <View className="absolute bottom-0 left-0 right-0 h-[85px] bg-white flex-row rounded-t-[15px] shadow-lg shadow-black/10" />

            {/* Interactive Item Stack */}
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

                    // Label layout configurations mapped exactly over requested changes
                    const labels: Record<keyof ParentTabParamList, string> = {
                        Progress: "Progress",
                        Payment: "Payment",
                        Home: "Home",
                        Attendance: "Attendance",
                        Profile: "Profile",
                    };

                    const label = labels[route.name as keyof ParentTabParamList];
                    const iconSize = 24;
                    const iconColor = isFocused ? "#6AE18B" : "#94A3B8";

                    // Icons safely matched to your parent-specific needs using Phosphor components
                    const renderIcon = () => {
                        switch (route.name) {
                            case "Progress": return <ChartLineUp size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Payment": return <CreditCard size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Attendance": return <ClipboardText size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            case "Profile": return <User size={iconSize} color={iconColor} weight={isFocused ? "fill" : "regular"} />;
                            default: return null;
                        }
                    };

                    // --- CENTRAL GREEN HOME BUTTON (NO OPACITY FLASH) ---
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

export default function ParentTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <ParentCustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
            initialRouteName="Home"
        >
            <Tab.Screen name="Progress" component={ParentProgress} />
            <Tab.Screen name="Payment" component={ParentPayment} />
            <Tab.Screen name="Home" component={ParentHomeScreen} />
            <Tab.Screen name="Attendance" component={ParentAttendance} />
            <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
    );
}