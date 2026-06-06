import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { PencilSimple, X } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";

import { fetchUserSkills, createUserSkill, deleteUserSkill } from "../../../lib/helpers/profile/profileKeyskills";
import AddSkillModal from "@/components/modals/AddSkillModal";

type Skill = { skillId: number; name: string };

export default function ProfileKeySkills() {
    const { userId } = useUser();
    const [technical, setTechnical] = useState<Skill[]>([]);
    const [soft, setSoft] = useState<Skill[]>([]);
    const [tools, setTools] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (!userId) return;
        loadData();
    }, [userId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchUserSkills(userId as number);
            setTechnical(data.filter((d: any) => d.category === "Technical Skills"));
            setSoft(data.filter((d: any) => d.category === "Soft Skills"));
            setTools(data.filter((d: any) => d.category === "Tools & Frameworks"));
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to load skills" });
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (category: string, name: string) => {
        setIsAdding(true);
        try {
            // Map category names back to section
            const categoryMap: Record<string, "technical" | "soft" | "tools"> = {
                "Technical Skills": "technical",
                "Soft Skills": "soft",
                "Tools & Frameworks": "tools",
            };
            const section = categoryMap[category] || "technical";
            
            const success = await createUserSkill(userId as number, section, name);
            if (success) {
                await loadData();
                return true;
            }
            return false;
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to add skill" });
            return false;
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteSkill = async (skillId: number) => {
        try {
            await deleteUserSkill(userId as number, skillId);
            await loadData();
        } catch (err) {
            Toast.show({ type: "error", text1: "Failed to delete skill" });
        }
    };

    const renderPill = (skill: Skill) => (
        <View key={skill.skillId} className="bg-gray-100 rounded-full pl-4 pr-2 py-1.5 m-1 flex-row items-center gap-2 border border-gray-200">
            <Text className="text-gray-700 font-medium text-sm">{skill.name}</Text>
            <TouchableOpacity onPress={() => handleDeleteSkill(skill.skillId)} className="bg-gray-200 rounded-full p-1">
                <X size={12} color="#525252" weight="bold" />
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View className="flex-1 bg-white rounded-xl shadow-sm items-center justify-center p-4">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2">Loading skills...</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-white rounded-xl shadow-sm" contentContainerStyle={{ padding: 16 }}>
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-lg font-semibold text-[#000000]">Skills</Text>
                <View className="flex-row gap-2">
                    <TouchableOpacity onPress={() => setIsAddModalOpen(true)} className="bg-[#43C17A] px-4 py-1.5 rounded-md flex-row items-center justify-center">
                        <Text className="text-white font-medium text-sm">Add +</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-[#43C17A] px-4 py-1.5 rounded-md flex-row items-center justify-center">
                        <Text className="text-white font-medium text-sm">Next</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="gap-6 mb-10">
                {/* Technical Skills */}
                <View>
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-lg text-[#43C17A] font-medium">Technical Skills</Text>
                    </View>
                    <View className="border border-[#C0C0C0] rounded-md p-3 min-h-[68px] flex-row flex-wrap items-center relative pr-12">
                        {technical.map(renderPill)}
                        {technical.length === 0 && <Text className="text-sm text-gray-400">No technical skills added.</Text>}
                    </View>
                </View>

                {/* Soft Skills */}
                <View>
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-lg text-[#43C17A] font-medium">Soft Skills</Text>
                    </View>
                    <View className="border border-[#C0C0C0] rounded-md p-3 min-h-[68px] flex-row flex-wrap items-center relative pr-12">
                        {soft.map(renderPill)}
                        {soft.length === 0 && <Text className="text-sm text-gray-400">No soft skills added.</Text>}
                    </View>
                </View>

                {/* Tools */}
                <View>
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-lg text-[#43C17A] font-medium">Tools & Frameworks</Text>
                    </View>
                    <View className="border border-[#C0C0C0] rounded-md p-3 min-h-[68px] flex-row flex-wrap items-center relative pr-12">
                        {tools.map(renderPill)}
                        {tools.length === 0 && <Text className="text-sm text-gray-400">No tools added.</Text>}
                    </View>
                </View>
            </View>

            <AddSkillModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onAdd={handleAddSkill} 
                isLoading={isAdding} 
            />
        </ScrollView>
    );
}
