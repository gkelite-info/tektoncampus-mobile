import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";


import { fetchResumePersonalDetails, saveResumePersonalDetails } from "@/lib/helpers/resume/Resumepersonaldetailsapi";
import { supabase } from "@/lib/supabaseClient";

export default function ResumePersonalDetails({ onNext }: { onNext?: () => void }) {
    const { userId, studentId, collegeId, fullName: ctxFullName, mobile: ctxMobile, email: ctxEmail } = useUser();

    const [fullName, setFullName] = useState("");
    const [linkedIn, setLinkedIn] = useState("");
    const [currentCity, setCurrentCity] = useState("");
    const [workStatus, setWorkStatus] = useState<"experienced" | "fresher" | "intern">("fresher");
    const [collegeCode, setCollegeCode] = useState("");
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");
    const [resumePersonalDetailsId, setResumePersonalDetailsId] = useState<number | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);

    useEffect(() => {
        if (!studentId || !collegeId) return;
        loadData();
    }, [studentId, collegeId]);

    const loadData = async () => {
        if (!studentId || !collegeId) return;
        setIsPageLoading(true);
        try {
            setFullName(ctxFullName || "");
            setMobile(ctxMobile || "");
            setEmail(ctxEmail || "");

            const [pdRes, collegeRes] = await Promise.all([
                fetchResumePersonalDetails(studentId),
                supabase.from("colleges").select("collegeCode").eq("collegeId", collegeId).single(),
            ]);

            if (pdRes?.data) {
                setResumePersonalDetailsId(pdRes.data.resumePersonalDetailsId);
                setLinkedIn(pdRes.data.linkedInId || "");
                setCurrentCity(pdRes.data.currentCity || "");
                setWorkStatus(pdRes.data.workStatus || "fresher");
                setFullName(pdRes.data.fullName || ctxFullName || "");
                setMobile(pdRes.data.mobile || ctxMobile || "");
                setEmail(pdRes.data.email || ctxEmail || "");
            }
            if (collegeRes?.data) {
                setCollegeCode(collegeRes.data.collegeCode || "");
            }
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to load personal details" });
        } finally {
            setIsPageLoading(false);
        }
    };

    const nameRegex = /^[A-Za-z. ]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const linkedInRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/.+$/;
    const mobileRegex = /^\+?\d{10,15}$/;

    const sanitizeCity = (value: string) => {
        let clean = value.replace(/[^A-Za-z ]/g, "");
        clean = clean.replace(/\s+/g, " ");
        return clean.replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const sanitizeName = (value: string) => {
        let clean = value.replace(/[^A-Za-z. ]/g, "");
        return clean;
    };

    const sanitizeLinkedIn = (value: string) => value.replace(/[^a-zA-Z0-9:/._-]/g, "");

    const sanitizeMobile = (value: string) => {
        const hasPlus = value.startsWith("+");
        const digitsOnly = value.replace(/\D/g, "");
        const digits = hasPlus ? digitsOnly.slice(0, 12) : digitsOnly.slice(0, 10);
        return hasPlus ? "+" + digits : digits;
    };

    const sanitizeEmail = (value: string) => value.replace(/[^A-Za-z0-9@.]/g, "");

    const handleSave = async (navigateNext: boolean) => {
        if (!studentId || !collegeId) return;
        const formattedName = sanitizeName(fullName).trim();
        const trimmedMobile = mobile.trim();
        const trimmedEmail = email.trim();

        if (!formattedName) return Toast.show({ type: "error", text1: "Full Name is required!" });
        if (!nameRegex.test(formattedName)) return Toast.show({ type: "error", text1: "Name should contain only letters, dots and spaces" });
        if (!trimmedMobile) return Toast.show({ type: "error", text1: "Mobile number is required!" });
        if (!mobileRegex.test(trimmedMobile)) return Toast.show({ type: "error", text1: "Enter valid mobile number" });
        if (!trimmedEmail) return Toast.show({ type: "error", text1: "Email is required!" });
        if (!emailRegex.test(trimmedEmail)) return Toast.show({ type: "error", text1: "Enter valid email" });
        if (linkedIn && !linkedInRegex.test(linkedIn)) return Toast.show({ type: "error", text1: "Enter valid LinkedIn URL" });

        setIsLoading(true);
        try {
            const isUpdate = !!resumePersonalDetailsId;
            const res = await saveResumePersonalDetails({
                resumePersonalDetailsId: resumePersonalDetailsId || undefined,
                studentId,
                collegeId,
                fullName: formattedName,
                mobile: trimmedMobile,
                email: trimmedEmail,
                linkedInId: linkedIn || null,
                currentCity: currentCity.trim(),
                workStatus,
            });

            if (!res.success) {
                Toast.show({ type: "error", text1: typeof res.error === "string" ? res.error : "Failed to save details" });
                setIsLoading(false);
                return;
            }

            if (res.resumePersonalDetailsId) {
                setResumePersonalDetailsId(res.resumePersonalDetailsId);
            }

            Toast.show({ type: "success", text1: isUpdate ? "Details updated successfully" : "Details saved successfully" });
            
            if (navigateNext && onNext) {
                onNext();
            }
        } catch (error) {
            Toast.show({ type: "error", text1: "Failed to save details" });
        } finally {
            setIsLoading(false);
        }
    };

    if (isPageLoading) {
        return (
            <View className="flex-1 bg-white rounded-xl  items-center justify-center p-4">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2">Loading details...</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-white rounded-xl " contentContainerStyle={{ padding: 16 }}>
            <Text className="text-lg font-semibold text-[#000000] mb-6">Personal Details</Text>

            <View className="gap-5">
                {}
                <View>
                    <Text className="text-sm font-medium text-[#282828] mb-1">
                        Full Name<Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
                        placeholder="Enter Full Name"
                        value={fullName}
                        onChangeText={(t) => setFullName(sanitizeName(t))}
                        editable={!isLoading}
                    />
                </View>

                {}
                <View>
                    <Text className="text-sm font-medium text-[#282828] mb-1">
                        Mobile Number<Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
                        placeholder="Enter Mobile Number"
                        value={mobile}
                        onChangeText={(t) => setMobile(sanitizeMobile(t))}
                        keyboardType="phone-pad"
                        editable={!isLoading}
                    />
                </View>

                {}
                <View>
                    <Text className="text-sm font-medium text-[#282828] mb-1">
                        Email ID<Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
                        placeholder="Enter Email ID"
                        value={email}
                        onChangeText={(t) => setEmail(sanitizeEmail(t))}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!isLoading}
                    />
                </View>

                {}
                <View>
                    <Text className="text-sm font-medium text-[#282828] mb-1">LinkedIn ID</Text>
                    <TextInput
                        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
                        placeholder="Enter LinkedIn ID"
                        value={linkedIn}
                        onChangeText={(t) => setLinkedIn(sanitizeLinkedIn(t))}
                        autoCapitalize="none"
                        keyboardType="url"
                        editable={!isLoading}
                    />
                </View>

                {}
                <View>
                    <Text className="text-sm font-medium text-[#282828] mb-1">Current City</Text>
                    <TextInput
                        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
                        placeholder="Enter Current City"
                        value={currentCity}
                        onChangeText={(t) => setCurrentCity(sanitizeCity(t))}
                        editable={!isLoading}
                    />
                </View>

                {}
                <View className="mt-2">
                    <Text className="text-sm font-medium text-[#282828] mb-2">Work Status</Text>
                    <View className="gap-3">
                        <TouchableOpacity
                            onPress={() => !isLoading && setWorkStatus("experienced")}
                            className={`border rounded-md p-4 flex-row ${workStatus === "experienced" ? "border-[#43C17A] bg-[#eefaf3]" : "border-[#CCCCCC]"}`}
                        >
                            <View className="flex-1">
                                <Text className={`font-medium ${workStatus === "experienced" ? "text-[#43C17A]" : "text-[#282828]"}`}>
                                    I'm experienced
                                </Text>
                                <Text className="text-xs mt-1 text-[#525252]">
                                    I have work experience (excluding internships)
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => !isLoading && setWorkStatus("fresher")}
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

                <View className="mt-6 mb-10 flex-row justify-end gap-3">
                    <TouchableOpacity
                        onPress={() => handleSave(false)}
                        disabled={isLoading}
                        className={`bg-[#43C17A] px-6 py-2.5 rounded-lg ${isLoading ? "opacity-50" : ""}`}
                    >
                        <Text className="text-white font-bold">{isLoading ? "Saving..." : "Save"}</Text>
                    </TouchableOpacity>
                    
                    {onNext && (
                        <TouchableOpacity
                            onPress={() => handleSave(true)}
                            disabled={isLoading}
                            className={`bg-[#43C17A] px-6 py-2.5 rounded-lg ${isLoading ? "opacity-50" : ""}`}
                        >
                            <Text className="text-white font-bold">{isLoading ? "Saving..." : "Next"}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}
