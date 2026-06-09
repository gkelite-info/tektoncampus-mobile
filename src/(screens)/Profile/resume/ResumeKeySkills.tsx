import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";

import {
  getGroupedSkills,
  getStudentResumeSkillIds,
  saveStudentResumeSkills,
  GroupedSkills
} from "../../../lib/helpers/resume/Studentresumeskillsapi";

export default function ResumeKeySkills() {
    const { studentId } = useUser();
    const [groupedSkills, setGroupedSkills] = useState<GroupedSkills[]>([]);
    const [selectedSkillIds, setSelectedSkillIds] = useState<Set<number>>(new Set());
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!studentId) return;
        loadData();
    }, [studentId]);

    const loadData = async () => {
        setIsPageLoading(true);
        try {
            const [grouped, savedIds] = await Promise.all([
                getGroupedSkills(),
                getStudentResumeSkillIds(studentId!)
            ]);
            setGroupedSkills(grouped);
            setSelectedSkillIds(new Set(savedIds));
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to load skills" });
        } finally {
            setIsPageLoading(false);
        }
    };

    const toggleSkill = (skillId: number) => {
        setSelectedSkillIds(prev => {
            const next = new Set(prev);
            if (next.has(skillId)) {
                next.delete(skillId);
            } else {
                next.add(skillId);
            }
            return next;
        });
    };

    const handleSave = async () => {
        if (!studentId) return;
        setIsSaving(true);
        try {
            await saveStudentResumeSkills(studentId, Array.from(selectedSkillIds));
            Toast.show({ type: "success", text1: "Skills saved successfully!" });
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to save skills" });
        } finally {
            setIsSaving(false);
        }
    };

    if (isPageLoading) {
        return (
            <View className="flex-1 bg-white rounded-xl  items-center justify-center p-4">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2">Loading skills...</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-[#f6f7f9] p-4">
            <View className="bg-white rounded-lg p-6  mb-10">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-lg font-semibold text-[#000000]">Key Skills</Text>
                    <TouchableOpacity 
                        onPress={handleSave} 
                        disabled={isSaving}
                        className={`bg-[#43C17A] px-6 py-2 rounded-lg ${isSaving ? 'opacity-50' : ''}`}
                    >
                        <Text className="text-white font-bold">{isSaving ? "Saving..." : "Save"}</Text>
                    </TouchableOpacity>
                </View>

                <View className="gap-6">
                    {groupedSkills.map((group) => {
                        // Skip rendering category if it has no skills
                        if (group.skills.length === 0) return null;

                        return (
                            <View key={group.category.resumeSkillCategoryId}>
                                <Text className="text-sm font-medium text-[#43C17A] mb-3">
                                    {group.category.name}
                                </Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {group.skills.map(skill => {
                                        const isSelected = selectedSkillIds.has(skill.resumeSkillId);
                                        return (
                                            <TouchableOpacity
                                                key={skill.resumeSkillId}
                                                onPress={() => toggleSkill(skill.resumeSkillId)}
                                                className={`border rounded-full px-4 py-2 ${
                                                    isSelected 
                                                    ? 'bg-[#43C17A] border-[#43C17A]' 
                                                    : 'bg-white border-gray-300'
                                                }`}
                                            >
                                                <Text className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-gray-600'}`}>
                                                    {skill.name}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}
                </View>
                
                {groupedSkills.length === 0 && (
                    <Text className="text-center text-gray-500 mt-4">No skills available.</Text>
                )}
            </View>
        </ScrollView>
    );
}
