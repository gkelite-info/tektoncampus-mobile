import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";

import { getProfileSummary, insertProfileSummary, updateProfileSummary } from "../../../lib/helpers/resume/profileSummaryAPI";
import { generateFiveProfileSummaries, suggestSkillsFromJDWithDemand } from "../../../lib/helpers/resume/Profilesummaryactionai";
import { fetchAllResumeData } from "../../../lib/helpers/resume/Resumedatafetcher";
import { calculateATSScore, ATSResult } from "../../../lib/helpers/resume/atsScoreCalculator";

export default function ResumeProfileSummary() {
    const { studentId } = useUser();
    const [summary, setSummary] = useState("");
    const [resumeSummaryId, setResumeSummaryId] = useState<number | null>(null);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // AI Generation states
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedOptions, setGeneratedOptions] = useState<string[]>([]);
    const [showOptions, setShowOptions] = useState(false);

    // ATS States
    const [atsResult, setAtsResult] = useState<ATSResult | null>(null);

    // JD Gap States
    const [jobDescription, setJobDescription] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [gapAnalysis, setGapAnalysis] = useState<{
        matching: Array<{ name: string; demand: "high" | "medium" }>;
        missing: Array<{ name: string; demand: "high" | "medium" }>;
    } | null>(null);

    useEffect(() => {
        if (studentId) loadData();
    }, [studentId]);

    const loadData = async () => {
        setIsPageLoading(true);
        try {
            const data = await getProfileSummary(studentId!);
            if (data) {
                setSummary(data.summary || "");
                setResumeSummaryId(data.resumeSummaryId);
            }

            // Load ATS Data
            const allResumeData = await fetchAllResumeData(studentId!);
            const score = calculateATSScore(allResumeData);
            setAtsResult(score);

        } catch (e) {
            Toast.show({ type: "error", text1: "Failed to load profile data" });
        } finally {
            setIsPageLoading(false);
        }
    };

    const handleSave = async () => {
        if (!studentId) return;
        setIsSaving(true);
        try {
            if (resumeSummaryId) {
                await updateProfileSummary(resumeSummaryId, summary);
            } else {
                const res = await insertProfileSummary(studentId, summary);
                if (res?.resumeSummaryId) {
                    setResumeSummaryId(res.resumeSummaryId);
                }
            }
            Toast.show({ type: "success", text1: "Summary saved successfully" });
            
            // Reload ATS after save
            const allResumeData = await fetchAllResumeData(studentId);
            setAtsResult(calculateATSScore(allResumeData));
        } catch (e) {
            Toast.show({ type: "error", text1: "Failed to save summary" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!studentId) return;
        setIsGenerating(true);
        setShowOptions(false);
        setGeneratedOptions([]);
        
        try {
            const options = await generateFiveProfileSummaries(studentId, jobDescription);
            if (options && options.length > 0) {
                setGeneratedOptions(options);
                setShowOptions(true);
                Toast.show({ type: "success", text1: "AI Generated 5 options!" });
            } else {
                Toast.show({ type: "error", text1: "AI generation failed, please try again." });
            }
        } catch (e) {
            Toast.show({ type: "error", text1: "AI generation failed" });
        } finally {
            setIsGenerating(false);
        }
    };

    const selectOption = (opt: string) => {
        setSummary(opt);
        setShowOptions(false);
    };

    const handleAnalyzeJD = async () => {
        if (!studentId || !jobDescription.trim()) {
            Toast.show({ type: "error", text1: "Please enter a Job Description" });
            return;
        }
        setIsAnalyzing(true);
        try {
            const allResumeData = await fetchAllResumeData(studentId);
            const skillsFlat = allResumeData.skillGroups.flatMap((g: any) => g.skills);
            const result = await suggestSkillsFromJDWithDemand(jobDescription, skillsFlat);
            setGapAnalysis(result);
            Toast.show({ type: "success", text1: "Gap Analysis Complete" });
        } catch (e) {
            Toast.show({ type: "error", text1: "Failed to analyze JD" });
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (isPageLoading) {
        return (
            <View className="flex-1 bg-white rounded-xl shadow-sm items-center justify-center p-4">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2">Loading ATS Engine...</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-[#f6f7f9] p-4">
            {/* ATS Score Card */}
            {atsResult && (
                <View className="bg-white rounded-lg p-6 shadow-sm mb-4 border border-gray-100 flex-row justify-between items-center">
                    <View className="flex-1">
                        <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Resume ATS Score</Text>
                        <Text className="text-3xl font-bold mt-1" style={{ color: atsResult.color }}>{atsResult.total}/100</Text>
                        <Text className="text-sm font-medium mt-1" style={{ color: atsResult.color }}>{atsResult.label} Match</Text>
                    </View>
                    <View className="flex-1 ml-4">
                        <Text className="text-xs text-gray-500 mb-1">Top Improvement Tips:</Text>
                        {atsResult.tips.slice(0, 2).map((tip, idx) => (
                            <Text key={idx} className="text-xs text-gray-700 mb-1">• {tip}</Text>
                        ))}
                    </View>
                </View>
            )}

            <View className="bg-white rounded-lg p-6 shadow-sm mb-4">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-semibold text-[#000000]">Profile Summary</Text>
                    <TouchableOpacity onPress={handleSave} disabled={isSaving} className={`bg-[#43C17A] px-6 py-2 rounded-lg ${isSaving ? 'opacity-50' : ''}`}>
                        <Text className="text-white font-bold">{isSaving ? "Saving..." : "Save"}</Text>
                    </TouchableOpacity>
                </View>

                <TextInput
                    className="border border-[#CCCCCC] rounded-md px-3 py-3 text-[#282828] min-h-[120px] mb-4 bg-gray-50"
                    placeholder="Write a brief professional summary about yourself..."
                    value={summary}
                    onChangeText={setSummary}
                    multiline
                    textAlignVertical="top"
                />

                <TouchableOpacity 
                    onPress={handleGenerateAI} 
                    disabled={isGenerating}
                    className={`border-2 border-dashed border-[#43C17A] rounded-lg p-4 items-center justify-center flex-row ${isGenerating ? 'bg-[#43C17A]/10' : 'bg-[#43C17A]/5'}`}
                >
                    {isGenerating ? (
                        <>
                            <ActivityIndicator size="small" color="#43C17A" />
                            <Text className="text-[#43C17A] font-bold ml-2">Generating with AI...</Text>
                        </>
                    ) : (
                        <Text className="text-[#43C17A] font-bold">✨ Generate Summary with AI</Text>
                    )}
                </TouchableOpacity>

                {showOptions && generatedOptions.length > 0 && (
                    <View className="mt-4">
                        <Text className="text-sm font-semibold text-[#43C17A] mb-2">AI Suggestions (Tap to apply)</Text>
                        {generatedOptions.map((opt, idx) => (
                            <TouchableOpacity 
                                key={idx} 
                                onPress={() => selectOption(opt)}
                                className="border border-[#43C17A] rounded-lg p-3 mb-2 bg-[#eefaf3]"
                            >
                                <Text className="text-gray-800 text-sm leading-5">{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* JD Gap Analysis */}
            <View className="bg-white rounded-lg p-6 shadow-sm mb-10 border border-purple-100">
                <View className="flex-row items-center mb-2">
                    <Text className="text-lg font-semibold text-purple-700">🎯 ATS JD Gap Analyzer</Text>
                </View>
                <Text className="text-sm text-gray-500 mb-4">Paste a Job Description to see missing skills and tailor your profile summary to match.</Text>

                <TextInput
                    className="border border-purple-200 rounded-md px-3 py-3 text-[#282828] min-h-[100px] mb-4 bg-purple-50"
                    placeholder="Paste the target Job Description here..."
                    value={jobDescription}
                    onChangeText={setJobDescription}
                    multiline
                    textAlignVertical="top"
                />

                <TouchableOpacity 
                    onPress={handleAnalyzeJD} 
                    disabled={isAnalyzing}
                    className={`bg-purple-600 rounded-lg p-3 items-center justify-center flex-row ${isAnalyzing ? 'opacity-50' : ''}`}
                >
                    {isAnalyzing ? (
                        <>
                            <ActivityIndicator size="small" color="white" />
                            <Text className="text-white font-bold ml-2">Analyzing JD...</Text>
                        </>
                    ) : (
                        <Text className="text-white font-bold">Scan Resume against JD</Text>
                    )}
                </TouchableOpacity>

                {gapAnalysis && (
                    <View className="mt-6">
                        <Text className="text-sm font-semibold text-green-600 mb-2">✅ Matching Skills</Text>
                        <View className="flex-row flex-wrap gap-2 mb-4">
                            {gapAnalysis.matching.map((skill, i) => (
                                <View key={i} className="bg-green-100 border border-green-300 rounded-full px-3 py-1">
                                    <Text className="text-green-800 text-xs font-medium">{skill.name}</Text>
                                </View>
                            ))}
                            {gapAnalysis.matching.length === 0 && <Text className="text-xs text-gray-400">No matching skills found.</Text>}
                        </View>

                        <Text className="text-sm font-semibold text-red-500 mb-2">❌ Missing Skills (Add these!)</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {gapAnalysis.missing.map((skill, i) => (
                                <View key={i} className="bg-red-100 border border-red-300 rounded-full px-3 py-1">
                                    <Text className="text-red-800 text-xs font-medium">{skill.name} ({skill.demand})</Text>
                                </View>
                            ))}
                            {gapAnalysis.missing.length === 0 && <Text className="text-xs text-gray-400">No missing skills detected.</Text>}
                        </View>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
