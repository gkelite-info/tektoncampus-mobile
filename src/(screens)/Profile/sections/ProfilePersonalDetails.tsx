import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Lock } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";

// Make sure these API calls exist, or we assume they do because they were ported / shared
import { fetchCollegeCode, fetchPersonalDetails, savePersonalDetails, updateUserBasic } from "../../../lib/helpers/profile/profilePersonalDetailsAPI";

export default function ProfilePersonalDetails() {
    const { userId, fullName: ctxFullName, setFullName: setCtxFullName, mobile, email, collegeId, role } = useUser();

    const [fullName, setFullName] = useState("");
    const [linkedIn, setLinkedIn] = useState("");
    const [currentCity, setCurrentCity] = useState("");
    const [workStatus, setWorkStatus] = useState<"experience" | "fresher">("fresher");
    const [collegeCode, setCollegeCode] = useState("");
    const [personalDetailsId, setPersonalDetailsId] = useState<number | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const isSuperAdmin = role === "SuperAdmin";

    useEffect(() => {
        if (!userId) return;
        setFullName(ctxFullName || "");
    }, [userId, ctxFullName]);

    useEffect(() => {
        loadData();
    }, [userId, collegeId]);

    const loadData = async () => {
        if (!userId) return;
        setIsPageLoading(true);
        try {
            const [pdRes, collegeRes] = await Promise.all([
                fetchPersonalDetails(userId),
                collegeId ? fetchCollegeCode(collegeId) : Promise.resolve(null),
            ]);
            if (pdRes?.data) {
                setPersonalDetailsId(pdRes.data.personalDetailsId);
                setLinkedIn(pdRes.data.linkedIn || "");
                setCurrentCity(pdRes.data.currentCity || "");
                setWorkStatus(pdRes.data.workStatus);
            }
            if (collegeRes?.success && collegeRes.data) {
                setCollegeCode(collegeRes.data.collegeCode || "");
            }
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to load personal details" });
        } finally {
            setIsPageLoading(false);
        }
    };

    const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+){0,3}$/;
    const emailAllowed = /^[a-z0-9@.]+$/;
    const linkedInRegex = /^https:\/\/(www\.)?linkedin\.com\/.+$/;

    const sanitizeCity = (value: string) => {
        let clean = value.replace(/[^A-Za-z ]/g, "");
        clean = clean.replace(/\s+/g, " ");
        return clean.replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const sanitizeName = (value: string) => {
        let clean = value.replace(/[^A-Za-z ]/g, "");
        clean = clean.replace(/\s+/g, " ");
        clean = clean.trim();
        return clean;
    };

    const sanitizeLinkedIn = (value: string) => value.replace(/[^a-zA-Z0-9:/._-]/g, "");

    const handleSubmit = async () => {
        if (!userId) return;
        const formattedName = sanitizeName(fullName);
        if (!formattedName) return Toast.show({ type: "error", text1: "Full Name is required!" });
        if (!nameRegex.test(formattedName)) return Toast.show({ type: "error", text1: "Name should contain only letters and spaces" });
        if (!mobile) return Toast.show({ type: "error", text1: "Mobile number is required!" });
        if (!email) return Toast.show({ type: "error", text1: "Email is required!" });
        if ((email.match(/@/g) || []).length !== 1) return Toast.show({ type: "error", text1: "Email must contain exactly one '@'!" });
        if (linkedIn && !linkedInRegex.test(linkedIn)) return Toast.show({ type: "error", text1: "Enter valid LinkedIn URL" });
        if (!isSuperAdmin) {
            if (!collegeId) return Toast.show({ type: "error", text1: "College ID is required!" });
            if (!collegeCode) return Toast.show({ type: "error", text1: "College Code is required" });
        }

        setIsLoading(true);
        try {
            const [userRes, pdRes] = await Promise.all([
                updateUserBasic({ userId, fullName: formattedName }),
                savePersonalDetails({
                    personalDetailsId: personalDetailsId || undefined,
                    userId,
                    workStatus,
                    currentCity,
                    linkedIn,
                }),
            ]);

            if (!userRes.success || !pdRes.success) {
                Toast.show({ type: "error", text1: "Failed to update personal details. Please try again." });
                return;
            }
            setCtxFullName(formattedName);
            Toast.show({ type: "success", text1: "Personal details updated successfully" });
            await loadData();
        } catch (error) {
            Toast.show({ type: "error", text1: "Failed to save details" });
        } finally {
            setIsLoading(false);
        }
    };

    if (isPageLoading) {
        return (
            <View className="flex-1 bg-white rounded-xl shadow-sm items-center justify-center p-4">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2">Loading details...</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-white rounded-xl shadow-sm" contentContainerStyle={{ padding: 16 }}>
            <Text className="text-lg font-semibold text-[#000000] mb-6">Personal Details</Text>

            <View className="gap-5">
                {/* Full Name */}
                <View>
                    <Text className="text-sm font-medium text-[#282828] mb-1">
                        Full Name<Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
                        placeholder="Enter Full Name"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                </View>

                {/* Mobile */}
                <View>
                    <Text className="text-sm font-medium text-[#282828] mb-1">
                        Mobile Number<Text className="text-red-500">*</Text>
                    </Text>
                    <View className="relative justify-center">
                        <TextInput
                            className="bg-gray-50 border border-gray-200 text-gray-500 rounded-md px-3 py-2 pr-10"
                            value={mobile || ""}
                            editable={false}
                        />
                        <View className="absolute right-3">
                            <Lock size={16} color="#9ca3af" />
                        </View>
                    </View>
                </View>

                {/* Email */}
                <View>
                    <Text className="text-sm font-medium text-[#282828] mb-1">
                        Email ID<Text className="text-red-500">*</Text>
                    </Text>
                    <View className="relative justify-center">
                        <TextInput
                            className="bg-gray-50 border border-gray-200 text-gray-500 rounded-md px-3 py-2 pr-10"
                            value={email || ""}
                            editable={false}
                        />
                        <View className="absolute right-3">
                            <Lock size={16} color="#9ca3af" />
                        </View>
                    </View>
                </View>

                {/* College Code */}
                {!isSuperAdmin && (
                    <View>
                        <Text className="text-sm font-medium text-[#282828] mb-1">College Code</Text>
                        <View className="relative justify-center">
                            <TextInput
                                className="bg-gray-50 border border-gray-200 text-gray-500 rounded-md px-3 py-2 pr-10"
                                value={collegeCode}
                                editable={false}
                            />
                            <View className="absolute right-3">
                                <Lock size={16} color="#9ca3af" />
                            </View>
                        </View>
                    </View>
                )}

                {/* LinkedIn */}
                <View>
                    <Text className="text-sm font-medium text-[#282828] mb-1">LinkedIn ID</Text>
                    <TextInput
                        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
                        placeholder="Enter LinkedIn ID"
                        value={linkedIn}
                        onChangeText={(t) => setLinkedIn(sanitizeLinkedIn(t))}
                        autoCapitalize="none"
                        keyboardType="url"
                    />
                </View>

                {/* Current City */}
                <View>
                    <Text className="text-sm font-medium text-[#282828] mb-1">Current City</Text>
                    <TextInput
                        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
                        placeholder="Enter Current City"
                        value={currentCity}
                        onChangeText={(t) => setCurrentCity(sanitizeCity(t))}
                    />
                </View>

                {/* College ID */}
                {!isSuperAdmin && (
                    <View>
                        <Text className="text-sm font-medium text-[#282828] mb-1">
                            College ID<Text className="text-red-500">*</Text>
                        </Text>
                        <View className="relative justify-center">
                            <TextInput
                                className="bg-gray-50 border border-gray-200 text-gray-500 rounded-md px-3 py-2 pr-10"
                                value={collegeId ? String(collegeId) : ""}
                                editable={false}
                            />
                            <View className="absolute right-3">
                                <Lock size={16} color="#9ca3af" />
                            </View>
                        </View>
                    </View>
                )}

                {/* Work Status */}
                {role !== "Parent" && (
                    <View className="mt-2">
                        <Text className="text-sm font-medium text-[#282828] mb-2">Work Status</Text>
                        <View className="gap-3">
                            <TouchableOpacity
                                onPress={() => setWorkStatus("experience")}
                                className={`border rounded-md p-4 flex-row ${workStatus === "experience" ? "border-[#43C17A] bg-[#eefaf3]" : "border-[#CCCCCC]"}`}
                            >
                                <View className="flex-1">
                                    <Text className={`font-medium ${workStatus === "experience" ? "text-[#43C17A]" : "text-[#282828]"}`}>
                                        I'm experienced
                                    </Text>
                                    <Text className="text-xs mt-1 text-[#525252]">
                                        I have work experience (excluding internships)
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setWorkStatus("fresher")}
                                className={`border rounded-md p-4 flex-row ${workStatus === "fresher" ? "border-[#43C17A] bg-[#eefaf3]" : "border-[#CCCCCC]"}`}
                            >
                                <View className="flex-1">
                                    <Text className={`font-medium ${workStatus === "fresher" ? "text-[#43C17A]" : "text-[#282828]"}`}>
                                        I'm a fresher
                                    </Text>
                                    <Text className="text-xs mt-1 text-[#525252]">
                                        I am a student/Haven't worked after graduation
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View className="mt-6 mb-10 flex-row justify-end">
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isLoading}
                        className={`bg-[#43C17A] px-6 py-2.5 rounded-lg ${isLoading ? "opacity-50" : ""}`}
                    >
                        <Text className="text-white font-bold">{isLoading ? "Submitting..." : "Submit"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}
