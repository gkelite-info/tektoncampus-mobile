import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";

// Assumed API bindings based on NextJS helpers
import {
  primaryEducationAPI,
  secondaryEducationAPI,
  undergraduateEducationAPI,
  phdEducationAPI,
} from "../../../lib/helpers/profile/profileEducationAPI";
import { PrimaryEducationForm, SecondaryEducationForm, UndergraduateEducationForm, PhdEducationForm } from "./EducationForms";

export type EducationType = "primary" | "secondary" | "undergraduate" | "phd";

export default function ProfileEducation() {
    const { userId, collegeId } = useUser();
    const [addedForms, setAddedForms] = useState<EducationType[] | null>(null);
    const [dataState, setDataState] = useState<Record<string, any>>({});
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        if (!userId) return;
        loadData();
    }, [userId]);

    const loadData = async () => {
        setIsPageLoading(true);
        try {
            const [primary, secondary, undergraduate, phd] = await Promise.all([
                primaryEducationAPI.fetch(userId as number),
                secondaryEducationAPI.fetch(userId as number),
                undergraduateEducationAPI.fetch(userId as number),
                phdEducationAPI.fetch(userId as number),
            ]);

            const detected: EducationType[] = ["primary"];
            const fetchedData: Record<string, any> = { primary: primary.data };

            if (secondary.success && secondary.data) { detected.push("secondary"); fetchedData.secondary = secondary.data; }
            if (undergraduate.success && undergraduate.data) { detected.push("undergraduate"); fetchedData.undergraduate = undergraduate.data; }
            if (phd.success && phd.data) { detected.push("phd"); fetchedData.phd = phd.data; }

            setDataState(fetchedData);
            setAddedForms(detected);
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to load education details" });
        } finally {
            setIsPageLoading(false);
        }
    };

    const addForm = (type: EducationType) => {
        if (addedForms && !addedForms.includes(type)) {
            setAddedForms([...addedForms, type]);
        }
        setShowOptions(false);
    };

    const handleDelete = async (api: any, type: EducationType, id?: number) => {
        if (id) {
            await api.delete(id, userId as number);
        }
        setAddedForms((prev) => prev?.filter((t) => t !== type) || null);
    };

    if (isPageLoading || addedForms === null) {
        return (
            <View className="flex-1 bg-white rounded-xl shadow-sm items-center justify-center p-4">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2">Loading education...</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-[#f6f7f9] p-4">
            <View className="bg-white rounded-lg p-6 shadow-sm mb-10">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-lg font-semibold text-[#000000]">Education</Text>
                    {/* The router handles 'Next' logic in ProfileDashboard/ProfileContainer but we'll leave placeholder for now */}
                </View>

                <View className="gap-4">
                    {addedForms.includes("primary") && (
                        <PrimaryEducationForm 
                            data={dataState.primary} 
                            userId={userId as number} 
                            onSave={async (p) => { await primaryEducationAPI.save(p); await loadData(); }} 
                        />
                    )}
                    {addedForms.includes("secondary") && (
                        <SecondaryEducationForm 
                            data={dataState.secondary} 
                            userId={userId as number} 
                            onSave={async (p) => { await secondaryEducationAPI.save(p); await loadData(); }} 
                            onDelete={async () => handleDelete(secondaryEducationAPI, "secondary", dataState.secondary?.secondaryEducationId)}
                        />
                    )}
                    {addedForms.includes("undergraduate") && (
                        <UndergraduateEducationForm 
                            data={dataState.undergraduate} 
                            userId={userId as number} 
                            onSave={async (p) => { await undergraduateEducationAPI.save(p); await loadData(); }} 
                            onDelete={async () => handleDelete(undergraduateEducationAPI, "undergraduate", dataState.undergraduate?.undergraduateEducationId)}
                        />
                    )}
                    {addedForms.includes("phd") && (
                        <PhdEducationForm 
                            data={dataState.phd} 
                            userId={userId as number} 
                            onSave={async (p) => { await phdEducationAPI.save(p); await loadData(); }} 
                            onDelete={async () => handleDelete(phdEducationAPI, "phd", dataState.phd?.phdeducationId)}
                        />
                    )}

                    {!showOptions ? (
                        <TouchableOpacity 
                            onPress={() => setShowOptions(true)} 
                            className="border-2 border-dashed border-[#43C17A] rounded-lg p-4 items-center justify-center bg-[#43C17A]/5"
                        >
                            <Text className="text-[#43C17A] font-bold">+ Add Education</Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="border border-gray-200 rounded-lg p-2 bg-white mt-2 shadow-sm">
                            {!addedForms.includes("secondary") && (
                                <TouchableOpacity onPress={() => addForm("secondary")} className="p-3 border-b border-gray-100">
                                    <Text className="text-[#282828] font-medium">Secondary Education</Text>
                                </TouchableOpacity>
                            )}
                            {!addedForms.includes("undergraduate") && (
                                <TouchableOpacity onPress={() => addForm("undergraduate")} className="p-3 border-b border-gray-100">
                                    <Text className="text-[#282828] font-medium">Undergraduate Degree</Text>
                                </TouchableOpacity>
                            )}
                            {!addedForms.includes("phd") && (
                                <TouchableOpacity onPress={() => addForm("phd")} className="p-3">
                                    <Text className="text-[#282828] font-medium">PhD</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => setShowOptions(false)} className="p-3 bg-gray-100 rounded-md mt-2 items-center">
                                <Text className="text-gray-500 font-bold">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}
