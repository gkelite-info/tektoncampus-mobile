import React, { useState, useEffect } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View, StyleSheet, Platform, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView, AnimatePresence } from 'moti';
import {
    Buildings,
    Calendar,
    CalendarCheck,
    ChartLineUp,
    CheckCircle,
    ClipboardText,
    CurrencyDollar,
    FileText,
    FolderOpen,
    Gear,
    GraduationCap,
    House,
    PresentationChart,
    SignOut,
    Smiley,
    UsersThree,
    X,
} from "phosphor-react-native";

export type RoleSideMenuItem = {
    name: string;
    label: string;
};

type Props = {
    visible: boolean;
    activeRouteName?: string;
    items: RoleSideMenuItem[];
    homeRouteName: string;
    onClose: () => void;
    onNavigate: (routeName: string) => void;
};

function renderIcon(routeName: string, isActive: boolean) {
    const color = isActive ? "#3fbe73" : "#FFFFFF";
    const weight = isActive ? "fill" : "regular";

    switch (routeName) {
        case "StudentTabs":
        case "FacultyTabs":
        case "ParentTabs":
            return <House size={24} color={color} weight={weight as any} />;
        case "Calendar":
            return <Calendar size={24} color={color} weight={weight as any} />;
        case "Attendance":
        case "MyAttendance":
            return <CheckCircle size={24} color={color} weight={weight as any} />;
        case "Assignments":
            return <FileText size={24} color={color} weight={weight as any} />;
        case "Academics":
            return <GraduationCap size={24} color={color} weight={weight as any} />;
        case "StudentProgress":
            return <ChartLineUp size={24} color={color} weight={weight as any} />;
        case "Projects":
            return <ClipboardText size={24} color={color} weight={weight as any} />;
        case "Placements":
            return <Buildings size={24} color={color} weight={weight as any} />;
        case "LeaveRequests":
            return <CalendarCheck size={24} color={color} weight={weight as any} />;
        case "Club":
            return <UsersThree size={24} color={color} weight={weight as any} />;
        case "Drive":
            return <FolderOpen size={24} color={color} weight={weight as any} />;
        case "Meetings":
            return <PresentationChart size={24} color={color} weight={weight as any} />;
        case "Wellbeing":
            return <Smiley size={24} color={color} weight={weight as any} />;
        case "Payments":
            return <CurrencyDollar size={24} color={color} weight={weight as any} />;
        case "Settings":
            return <Gear size={24} color={color} weight={weight as any} />;
        default:
            return <FileText size={24} color={color} weight={weight as any} />;
    }
}

export default function RoleSideMenu({
    visible,
    activeRouteName,
    items,
    homeRouteName,
    onClose,
    onNavigate,
}: Props) {
    const [modalVisible, setModalVisible] = useState(visible);

    useEffect(() => {
        if (visible) {
            setModalVisible(true);
        } else {
            const timeout = setTimeout(() => setModalVisible(false), 300);
            return () => clearTimeout(timeout);
        }
    }, [visible]);

    if (!modalVisible) return null;

    return (
        <Modal visible={modalVisible} animationType="none" transparent onRequestClose={onClose}>
            <View style={{ flex: 1, flexDirection: "row" }}>
                <AnimatePresence>
                    {visible && (
                        <MotiView
                            from={{ translateX: -400 }}
                            animate={{ translateX: 0 }}
                            exit={{ translateX: -400 }}
                            transition={{ type: "spring", damping: 150, stiffness: 350 }}
                            style={{ width: '75%', backgroundColor: "#47c67b", height: '100%', zIndex: 10 }}
                            className="shadow-2xl shadow-black"
                        >
                            <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 }}>
                                <View style={{ position: 'absolute', top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 0 : 0, right: 16, zIndex: 50 }}>
                                    <TouchableOpacity onPress={onClose} className="bg-black/10 p-2 rounded-full">
                                        <X size={20} color="white" weight="bold" />
                                    </TouchableOpacity>
                                </View>
                                <View className="items-center justify-center py-6" />

                                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                                    {items.map((item) => {
                                        const isActive =
                                            activeRouteName === item.name ||
                                            (!activeRouteName && item.name === homeRouteName);

                                        return (
                                            <TouchableOpacity
                                                key={item.name}
                                                onPress={() => onNavigate(item.name)}
                                                activeOpacity={0.7}
                                                className={`flex-row items-center py-3 px-6 mx-0 my-1 rounded-r-full ${isActive ? "bg-white shadow-sm" : "bg-transparent"
                                                    }`}
                                            >
                                                <View className="mr-4">{renderIcon(item.name, isActive)}</View>
                                                <Text
                                                    className={`text-base font-semibold ${isActive ? "text-[#3fbe73]" : "text-white"
                                                        }`}
                                                >
                                                    {item.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}

                                    {/* <View className="mb-8">
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            className="flex-row items-center py-3 px-6 mx-0 my-1 rounded-r-full mt-4 border-t border-green-500/30 pt-4"
                                        >
                                            <View className="mr-4">
                                                <SignOut size={24} color="#ef4444" weight="bold" />
                                            </View>
                                            <Text className="text-base font-semibold text-[#ef4444]">
                                                Logout
                                            </Text>
                                        </TouchableOpacity>
                                    </View> */}
                                </ScrollView>
                            </SafeAreaView>
                        </MotiView>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {visible && (
                        <MotiView
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: "timing", duration: 300 }}
                            style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
                        >
                            <TouchableOpacity
                                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
                                onPress={onClose}
                                activeOpacity={1}
                            />
                        </MotiView>
                    )}
                </AnimatePresence>
            </View>
        </Modal>
    );
}
