import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";

import {
  resumePrimaryEducationAPI,
  resumeSecondaryEducationAPI,
  resumeUndergraduateEducationAPI,
  resumeMastersEducationAPI,
  resumePhdEducationAPI,
  EducationLevel
} from "../../../lib/helpers/resume/Resumeeducationapi";

import { 
  ResumePrimaryEducationForm, 
  ResumeSecondaryEducationForm, 
  ResumeUndergraduateEducationForm, 
  ResumeMastersEducationForm,
  ResumePhdEducationForm 
} from "./ResumeEducationForms";

export default function ResumeEducation() {
    const { studentId, collegeId } = useUser();
    const [addedForms, setAddedForms] = useState<EducationLevel[] | null>(null);
    const [dataState, setDataState] = useState<Record<string, any>>({});
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        if (!studentId) return;
        loadData();
    }, [studentId]);

    const loadData = async () => {
        if (!studentId) return;
        setIsPageLoading(true);
        try {
            const [primary, secondary, undergraduate, masters, phd] = await Promise.all([
                resumePrimaryEducationAPI.fetch(studentId),
                resumeSecondaryEducationAPI.fetch(studentId),
                resumeUndergraduateEducationAPI.fetch(studentId),
                resumeMastersEducationAPI.fetch(studentId),
                resumePhdEducationAPI.fetch(studentId),
            ]);

            const detected: EducationLevel[] = ["primary"];
            const fetchedData: Record<string, any> = { primary: primary.data };

            if (secondary.success && secondary.data) { detected.push("secondary"); fetchedData.secondary = secondary.data; }
            if (undergraduate.success && undergraduate.data) { detected.push("undergraduate"); fetchedData.undergraduate = undergraduate.data; }
            if (masters.success && masters.data) { detected.push("masters"); fetchedData.masters = masters.data; }
            if (phd.success && phd.data) { detected.push("phd"); fetchedData.phd = phd.data; }

            setDataState(fetchedData);
            setAddedForms(detected);
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to load education details" });
        } finally {
            setIsPageLoading(false);
        }
    };

    const addForm = (type: EducationLevel) => {
        if (addedForms && !addedForms.includes(type)) {
            setAddedForms([...addedForms, type]);
        }
        setShowOptions(false);
    };

    const handleDelete = async (api: any, type: EducationLevel, id?: number) => {
        if (id && studentId) {
            await api.delete(id); // Resume API delete only takes id usually
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
                </View>

                <View className="gap-4">
                    {addedForms.includes("primary") && (
                        <ResumePrimaryEducationForm 
                            data={dataState.primary} 
                            studentId={studentId!} 
                            collegeId={collegeId!}
                            onSave={async (p) => { await resumePrimaryEducationAPI.save(p); await loadData(); }} 
                        />
                    )}
                    {addedForms.includes("secondary") && (
                        <ResumeSecondaryEducationForm 
                            data={dataState.secondary} 
                            studentId={studentId!} 
                            collegeId={collegeId!}
                            onSave={async (p) => { await resumeSecondaryEducationAPI.save(p); await loadData(); }} 
                            onDelete={async () => handleDelete(resumeSecondaryEducationAPI, "secondary", dataState.secondary?.resumeEducationDetailId)}
                        />
                    )}
                    {addedForms.includes("undergraduate") && (
                        <ResumeUndergraduateEducationForm 
                            data={dataState.undergraduate} 
                            studentId={studentId!} 
                            collegeId={collegeId!}
                            onSave={async (p) => { await resumeUndergraduateEducationAPI.save(p); await loadData(); }} 
                            onDelete={async () => handleDelete(resumeUndergraduateEducationAPI, "undergraduate", dataState.undergraduate?.resumeEducationDetailId)}
                        />
                    )}
                    {addedForms.includes("masters") && (
                        <ResumeMastersEducationForm 
                            data={dataState.masters} 
                            studentId={studentId!} 
                            collegeId={collegeId!}
                            onSave={async (p: any) => { await resumeMastersEducationAPI.save(p); await loadData(); }} 
                            onDelete={async () => handleDelete(resumeMastersEducationAPI, "masters", dataState.masters?.resumeEducationDetailId)}
                        />
                    )}
                    {addedForms.includes("phd") && (
                        <ResumePhdEducationForm 
                            data={dataState.phd} 
                            studentId={studentId!} 
                            collegeId={collegeId!}
                            onSave={async (p) => { await resumePhdEducationAPI.save(p); await loadData(); }} 
                            onDelete={async () => handleDelete(resumePhdEducationAPI, "phd", dataState.phd?.resumeEducationDetailId)}
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
                            {!addedForms.includes("masters") && (
                                <TouchableOpacity onPress={() => addForm("masters")} className="p-3 border-b border-gray-100">
                                    <Text className="text-[#282828] font-medium">Masters Degree</Text>
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
