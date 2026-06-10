import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, RefreshControl } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    CaretRight,
    SignOut,
    ArrowLeft,
    EnvelopeSimple,
    Phone,
    Headset,
    Key,
    ClipboardText,
    User as UserIcon,
    PencilSimple,
} from "phosphor-react-native";
import { useUser } from "@/utils/context/UserContext";
import ConfirmLogoutModal from "@/components/modals/ConfirmLogoutModal";
import TermsModal from "@/components/modals/TermsModal";
import SupportModal from "@/components/modals/SupportModal";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import { logoutUser } from "@/services/auth/logoutUser";
import { fonts } from "@/constants/fonts";

type ProfileDashboardProps = {
    onOpenProfileDetails: () => void;
};

export default function ProfileDashboard({ onOpenProfileDetails }: ProfileDashboardProps) {
    const {
        fullName,
        mobile,
        email,
        role,
        userId,
        collegeEducationType,
        collegeBranchCode,
        collegeAcademicYear,
        profilePhoto,
        identifierId,
        parentId,
        studentId,
        facultyId,
        adminId,
        financeManagerId,
        collegeAdminId,
        collegeHrId,
        placementEmployeeId,
        wellBeingId,
        refreshUserContext,
    } = useUser();

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshUserContext();
        } catch (err) {
            console.error("Profile refresh error:", err);
        } finally {
            setRefreshing(false);
        }
    }, [refreshUserContext]);

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const roleIdMap: Record<string, number | null> = {
        Student: studentId,
        Faculty: facultyId,
        Admin: adminId,
        Finance: financeManagerId,
        FinanceManager: financeManagerId,
        CollegeAdmin: collegeAdminId,
        CollegeHr: collegeHrId,
        Parent: parentId,
        PlacementOfficer: placementEmployeeId,
        WellbeingExecutive: wellBeingId,
        WellbeingManager: wellBeingId,
        SuperAdmin: userId,
    };

    const displayRoleMap: Record<string, string> = {
        FinanceManager: "Finance Manager",
        CollegeAdmin: "College Admin",
        CollegeHr: "College HR",
        PlacementOfficer: "Placement Officer",
        WellbeingExecutive: "Wellbeing Executive",
        WellbeingManager: "Wellbeing Manager",
        SuperAdmin: "Super Admin",
    };

    const displayRole = role ? (displayRoleMap[role] ?? role) : "";
    const displayId = identifierId || (role ? roleIdMap[role] : null) || userId;

    const profileOptions = [
        {
            id: "terms",
            name: "Terms And Conditions",
            icon: <ClipboardText size={24} color="#43C17A" weight="fill" />,
            onClick: () => setShowTermsModal(true),
        },
        {
            id: "support",
            name: "Tekton Campus Support",
            icon: <Headset size={24} color="#43C17A" weight="fill" />,
            onClick: () => setShowSupportModal(true),
        },
        {
            id: "change-password",
            name: "Change Password",
            icon: <Key size={24} color="#43C17A" weight="fill" />,
            onClick: () => setShowPasswordModal(true),
        },
    ];

    const handleLogout = async () => {
        const res = await logoutUser();
        if (res.success) {
            setShowLogoutModal(false);
        }
    };

    const insets = useSafeAreaInsets();
    const headerHeight = insets.top + 60;

    return (
        <View className="flex-1 bg-white" style={{ paddingTop: headerHeight, paddingBottom: 130 }}>
            <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100">
                <Text className="text-xl font-bold text-[#282828]">Profile Dashboard</Text>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                alwaysBounceVertical={true}
                overScrollMode="always"
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onOpenProfileDetails}
                    className="m-4 p-4 rounded-xl bg-[#43C17A]/10 flex-row items-center gap-4 border border-[#43C17A]/20"
                >
                    {profilePhoto ? (
                        <Image
                            source={{ uri: profilePhoto }}
                            className="w-20 h-20 rounded-full"
                        />
                    ) : (
                        <View className="w-20 h-20 rounded-full bg-white border border-[#43C17A]/30 items-center justify-center">
                            <UserIcon size={32} color="#43C17A" weight="fill" />
                        </View>
                    )}

                    <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-xl text-[#282828]" numberOfLines={1} style={{ fontFamily: fonts.bold }}>
                                {fullName}
                            </Text>
                            <CaretRight size={20} color="#43C17A" weight="bold" />
                        </View>

                        <Text className="text-sm text-gray-500 font-medium mt-1">
                            ID - {displayId || "-"}
                        </Text>

                        {role === "Student" && (
                            <Text className="text-sm text-[#282828] mt-1" style={{ fontFamily: fonts.medium }}>
                                {collegeEducationType || "—"} {collegeBranchCode || "—"} - {collegeAcademicYear || "—"}
                            </Text>
                        )}
                        {role === "Faculty" && (
                            <Text className="text-xs text-[#282828] font-medium mt-1">
                                {collegeEducationType || "—"} {collegeBranchCode || "—"}
                            </Text>
                        )}
                        {(role !== "Student" && role !== "Faculty") && (
                            <Text className="text-xs text-[#282828] font-medium mt-1">{displayRole}</Text>
                        )}

                        <View className="flex-row flex-wrap items-center gap-3 mt-3">
                            <View className="flex-row items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-[#43C17A]/20">
                                <EnvelopeSimple size={14} color="#43C17A" weight="bold" />
                                <Text className="text-sm text-gray-700">{email || "N/A"}</Text>
                            </View>

                            <View className="flex-row items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-[#43C17A]/20">
                                <Phone size={14} color="#43C17A" weight="bold" />
                                <Text className="text-sm text-gray-700">{mobile || "N/A"}</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                <View className="px-4 mt-2">
                    {profileOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            onPress={option.onClick}
                            className="flex-row items-center justify-between py-4 border-b border-gray-100"
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="bg-[#43C17A]/10 p-2 rounded-full">
                                    {option.icon}
                                </View>
                                <Text className="flex-1 text-base font-semibold text-[#282828] ml-3">
                                    {option.name}
                                </Text>
                            </View>
                            <CaretRight size={20} color="#888888" weight="bold" />
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        onPress={() => setShowLogoutModal(true)}
                        className="flex-row items-center justify-between py-4 border-b border-gray-100 mt-4"
                    >
                        <View className="flex-row items-center gap-3">
                            <View className="bg-red-50 p-2 rounded-full">
                                <SignOut size={24} color="#ef4444" weight="bold" />
                            </View>
                            <Text className="flex-1 text-base font-semibold text-red-500 ml-3">
                                Log Out
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <ConfirmLogoutModal
                visible={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
            />

            <TermsModal
                visible={showTermsModal}
                onClose={() => setShowTermsModal(false)}
            />

            <SupportModal
                visible={showSupportModal}
                onClose={() => setShowSupportModal(false)}
            />

            <ChangePasswordModal
                visible={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </View>
    );
}
