import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts';import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Lock } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";


import { fetchCollegeCode, fetchPersonalDetails, savePersonalDetails, updateUserBasic } from "../../../lib/helpers/profile/profilePersonalDetailsAPI";

export default function ProfilePersonalDetails() {const { t } = useTranslation();
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
      collegeId ? fetchCollegeCode(collegeId) : Promise.resolve(null)]
      );
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
        linkedIn
      })]
      );

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
      <View className="flex-1 bg-white rounded-xl  items-center justify-center p-4">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Loadingdetails", "Loading details...")}</Text>
            </View>);

  }

  return (
    <ScrollView className="flex-1 bg-white rounded-xl " contentContainerStyle={{ padding: 16 }}>
            <Text className="text-lg text-[#000000] mb-6" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.PersonalDetails", "Personal Details")}</Text>

            <View className="gap-5">
                {}
                <View>
                    <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.FullName", "Full Name")}
            <Text className="text-red-500" style={{ fontFamily: fonts.regular }}>*</Text>
                    </Text>
                    <TextInput
            className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
            placeholder={t("Auto.Attr.EnterFullName", "Enter Full Name")}
            value={fullName}
            onChangeText={setFullName} />
          
                </View>

                {}
                <View>
                    <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.MobileNumber", "Mobile Number")}
            <Text className="text-red-500" style={{ fontFamily: fonts.regular }}>*</Text>
                    </Text>
                    <View className="relative justify-center">
                        <TextInput
              className="bg-gray-50 border border-gray-200 text-gray-500 rounded-md px-3 py-2 pr-10"
              value={mobile || ""}
              editable={false} />
            
                        <View className="absolute right-3">
                            <Lock size={16} color="#9ca3af" />
                        </View>
                    </View>
                </View>

                {}
                <View>
                    <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.EmailID", "Email ID")}
            <Text className="text-red-500" style={{ fontFamily: fonts.regular }}>*</Text>
                    </Text>
                    <View className="relative justify-center">
                        <TextInput
              className="bg-gray-50 border border-gray-200 text-gray-500 rounded-md px-3 py-2 pr-10"
              value={email || ""}
              editable={false} />
            
                        <View className="absolute right-3">
                            <Lock size={16} color="#9ca3af" />
                        </View>
                    </View>
                </View>

                {}
                {!isSuperAdmin &&
        <View>
                        <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.CollegeCode", "College Code")}</Text>
                        <View className="relative justify-center">
                            <TextInput
              className="bg-gray-50 border border-gray-200 text-gray-500 rounded-md px-3 py-2 pr-10"
              value={collegeCode}
              editable={false} />
            
                            <View className="absolute right-3">
                                <Lock size={16} color="#9ca3af" />
                            </View>
                        </View>
                    </View>
        }

                {}
                <View>
                    <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.LinkedInID", "LinkedIn ID")}</Text>
                    <TextInput
            className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
            placeholder={t("Auto.Attr.EnterLinkedInID", "Enter LinkedIn ID")}
            value={linkedIn}
            onChangeText={(t) => setLinkedIn(sanitizeLinkedIn(t))}
            autoCapitalize="none"
            keyboardType="url" />
          
                </View>

                {}
                <View>
                    <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.CurrentCity", "Current City")}</Text>
                    <TextInput
            className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
            placeholder={t("Auto.Attr.EnterCurrentCit", "Enter Current City")}
            value={currentCity}
            onChangeText={(t) => setCurrentCity(sanitizeCity(t))} />
          
                </View>

                {}
                {!isSuperAdmin &&
        <View>
                        <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.CollegeID", "College ID")}
            <Text className="text-red-500" style={{ fontFamily: fonts.regular }}>*</Text>
                        </Text>
                        <View className="relative justify-center">
                            <TextInput
              className="bg-gray-50 border border-gray-200 text-gray-500 rounded-md px-3 py-2 pr-10"
              value={collegeId ? String(collegeId) : ""}
              editable={false} />
            
                            <View className="absolute right-3">
                                <Lock size={16} color="#9ca3af" />
                            </View>
                        </View>
                    </View>
        }

                {}
                {role !== "Parent" &&
        <View className="mt-2">
                        <Text className="text-sm text-[#282828] mb-2" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.WorkStatus", "Work Status")}</Text>
                        <View className="gap-3">
                            <TouchableOpacity
              onPress={() => setWorkStatus("experience")}
              className={`border rounded-md p-4 flex-row ${workStatus === "experience" ? "border-[#43C17A] bg-[#eefaf3]" : "border-[#CCCCCC]"}`}>
              
                                <View className="flex-1">
                                    <Text className={`${workStatus ==="experience" ? "text-[#43C17A]" : "text-[#282828]"}`} style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Imexperienced", "I'm experienced")}

                </Text>
                                    <Text className="text-xs mt-1 text-[#525252]" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Ihaveworkexperi", "I have work experience (excluding internships)")}

                </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
              onPress={() => setWorkStatus("fresher")}
              className={`border rounded-md p-4 flex-row ${workStatus === "fresher" ? "border-[#43C17A] bg-[#eefaf3]" : "border-[#CCCCCC]"}`}>
              
                                <View className="flex-1">
                                    <Text className={`${workStatus ==="fresher" ? "text-[#43C17A]" : "text-[#282828]"}`} style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Imafresher", "I'm a fresher")}

                </Text>
                                    <Text className="text-xs mt-1 text-[#525252]" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.IamastudentHave", "I am a student/Haven't worked after graduation")}

                </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
        }

                <View className="mt-6 mb-10 flex-row justify-end">
                    <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className={`bg-[#43C17A] px-6 py-2.5 rounded-lg ${isLoading ? "opacity-50" : ""}`}>
            
                        <Text className="text-white" style={{ fontFamily: fonts.bold }}>{isLoading ? t("Dashboard.profile.Submitting", "Submitting...") : t("Dashboard.profile.Submit", "Submit")}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>);

}