import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useUser } from "@/utils/context/UserContext";
import Toast from "react-native-toast-message";
import { FilePdf, CaretRight, Palette } from "phosphor-react-native";

import { fetchAllResumeData } from "../../../lib/helpers/resume/Resumedatafetcher";
import { generateResumePdf } from "../../../lib/helpers/resume/resumeDownloadAPI";
import { generateStandardTemplate, generateModernTemplate } from "../../../lib/helpers/resume/templateGenerators";

type TemplateType = "standard" | "modern";

export default function ResumeTemplates() {
    const { studentId } = useUser();
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("standard");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!studentId) return;
        setIsGenerating(true);
        try {
            Toast.show({ type: "info", text1: "Gathering profile data..." });
            const resumeData = await fetchAllResumeData(studentId);

            Toast.show({ type: "info", text1: "Generating PDF..." });
            const html = selectedTemplate === "standard" 
                ? generateStandardTemplate(resumeData) 
                : generateModernTemplate(resumeData);
                
            await generateResumePdf(html, `Resume_${resumeData.personal?.fullName?.replace(/\s/g, '_') || 'Student'}.pdf`);
            Toast.show({ type: "success", text1: "PDF Ready!" });
        } catch (e) {
            Toast.show({ type: "error", text1: "Failed to generate PDF" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-[#f6f7f9] p-4">
            <View className="bg-white rounded-lg p-6  mb-10">
                <View className="flex-row items-center mb-6">
                    <Palette size={24} color="#43C17A" weight="bold" />
                    <Text className="text-lg font-semibold text-[#000000] ml-2">Export Resume</Text>
                </View>

                <Text className="text-sm text-gray-600 mb-4">
                    Choose a template to format your profile data. Once generated, you can save the PDF to your device or share it directly.
                </Text>

                <View className="gap-3 mb-6">
                    <TouchableOpacity 
                        onPress={() => setSelectedTemplate("standard")}
                        className={`p-4 rounded-lg border-2 flex-row items-center justify-between ${selectedTemplate === "standard" ? 'border-[#43C17A] bg-[#eefaf3]' : 'border-gray-200 bg-white'}`}
                    >
                        <View>
                            <Text className={`font-bold text-base ${selectedTemplate === "standard" ? 'text-[#43C17A]' : 'text-gray-800'}`}>Standard Template</Text>
                            <Text className="text-xs text-gray-500 mt-1">Clean, classic, and ATS-friendly design.</Text>
                        </View>
                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selectedTemplate === "standard" ? 'border-[#43C17A]' : 'border-gray-300'}`}>
                            {selectedTemplate === "standard" && <View className="w-3 h-3 rounded-full bg-[#43C17A]" />}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => setSelectedTemplate("modern")}
                        className={`p-4 rounded-lg border-2 flex-row items-center justify-between ${selectedTemplate === "modern" ? 'border-[#43C17A] bg-[#eefaf3]' : 'border-gray-200 bg-white'}`}
                    >
                        <View>
                            <Text className={`font-bold text-base ${selectedTemplate === "modern" ? 'text-[#43C17A]' : 'text-gray-800'}`}>Modern Template</Text>
                            <Text className="text-xs text-gray-500 mt-1">Elegant and contemporary with sleek headers.</Text>
                        </View>
                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selectedTemplate === "modern" ? 'border-[#43C17A]' : 'border-gray-300'}`}>
                            {selectedTemplate === "modern" && <View className="w-3 h-3 rounded-full bg-[#43C17A]" />}
                        </View>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    onPress={handleDownload} 
                    disabled={isGenerating}
                    className={`bg-[#43C17A] flex-row justify-center items-center py-4 rounded-lg  ${isGenerating ? 'opacity-50' : ''}`}
                >
                    {isGenerating ? (
                        <>
                            <ActivityIndicator size="small" color="#ffffff" />
                            <Text className="text-white font-bold ml-2 text-base">Generating PDF...</Text>
                        </>
                    ) : (
                        <>
                            <FilePdf size={20} color="#ffffff" weight="bold" />
                            <Text className="text-white font-bold ml-2 text-base">Download / Share PDF</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
