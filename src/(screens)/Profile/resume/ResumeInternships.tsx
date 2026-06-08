import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";

import {
  fetchResumeInternships,
  upsertResumeInternship,
  deleteResumeInternship
} from "../../../lib/helpers/resume/resumeInternshipsAPI";

function InternshipFormItem({ item, studentId, onSaved, onDelete }: any) {
    const [organizationName, setOrganizationName] = useState(item.organizationName || "");
    const [role, setRole] = useState(item.role || "");
    const [startDate, setStartDate] = useState(item.startDate || "");
    const [endDate, setEndDate] = useState(item.endDate || "");
    const [projectName, setProjectName] = useState(item.projectName || "");
    const [projectUrl, setProjectUrl] = useState(item.projectUrl || "");
    const [location, setLocation] = useState(item.location || "");
    const [domain, setDomain] = useState(item.domain || "");
    const [description, setDescription] = useState(item.description || "");
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!organizationName.trim() || !role.trim() || !startDate.trim()) {
            Toast.show({ type: "error", text1: "Organization, Role, and Start Date are required" });
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                resumeInternshipId: item.resumeInternshipId,
                studentId,
                organizationName: organizationName.trim(),
                role: role.trim(),
                startDate,
                endDate: endDate ? endDate : null,
                projectName: projectName.trim(),
                projectUrl: projectUrl.trim(),
                location: location.trim(),
                domain: domain.trim(),
                description: description.trim(),
            };

            await upsertResumeInternship(payload);
            Toast.show({ type: "success", text1: "Internship saved successfully" });
            onSaved();
        } catch (e) {
            Toast.show({ type: "error", text1: "Failed to save internship" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert("Delete", "Are you sure you want to delete this?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", style: "destructive", 
                onPress: async () => {
                    if (item.resumeInternshipId) {
                        setIsLoading(true);
                        try {
                            await deleteResumeInternship(item.resumeInternshipId);
                            Toast.show({ type: "success", text1: "Deleted successfully" });
                            onDelete();
                        } catch (e) {
                            Toast.show({ type: "error", text1: "Failed to delete" });
                        } finally {
                            setIsLoading(false);
                        }
                    } else {
                        onDelete();
                    }
                }
            }
        ]);
    };

    return (
        <View className="border border-gray-200 rounded-xl p-4 bg-white mb-4 shadow-sm">
            <Text className="text-sm font-medium text-[#282828] mb-1">Organization Name *</Text>
            <TextInput
                className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-3"
                placeholder="E.g. Microsoft"
                value={organizationName}
                onChangeText={setOrganizationName}
            />

            <Text className="text-sm font-medium text-[#282828] mb-1">Role *</Text>
            <TextInput
                className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-3"
                placeholder="E.g. Software Engineering Intern"
                value={role}
                onChangeText={setRole}
            />

            <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                    <Text className="text-sm font-medium text-[#282828] mb-1">Start Date *</Text>
                    <TextInput
                        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
                        placeholder="YYYY-MM-DD"
                        value={startDate}
                        onChangeText={setStartDate}
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-medium text-[#282828] mb-1">End Date</Text>
                    <TextInput
                        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
                        placeholder="YYYY-MM-DD (Leave empty if current)"
                        value={endDate}
                        onChangeText={setEndDate}
                    />
                </View>
            </View>

            <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                    <Text className="text-sm font-medium text-[#282828] mb-1">Project Name</Text>
                    <TextInput
                        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
                        placeholder="Project Name"
                        value={projectName}
                        onChangeText={setProjectName}
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-medium text-[#282828] mb-1">Project URL</Text>
                    <TextInput
                        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
                        placeholder="Project Link"
                        value={projectUrl}
                        onChangeText={setProjectUrl}
                    />
                </View>
            </View>

            <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                    <Text className="text-sm font-medium text-[#282828] mb-1">Domain</Text>
                    <TextInput
                        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
                        placeholder="E.g. Web Development"
                        value={domain}
                        onChangeText={setDomain}
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-medium text-[#282828] mb-1">Location</Text>
                    <TextInput
                        className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828]"
                        placeholder="E.g. Remote"
                        value={location}
                        onChangeText={setLocation}
                    />
                </View>
            </View>

            <Text className="text-sm font-medium text-[#282828] mb-1">Description</Text>
            <TextInput
                className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-4"
                placeholder="What did you do?"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
            />

            <View className="flex-row justify-end gap-3">
                <TouchableOpacity onPress={handleDelete} disabled={isLoading} className="px-4 py-2 bg-red-50 rounded-lg">
                    <Text className="text-red-500 font-medium">Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={isLoading} className="px-4 py-2 bg-[#43C17A] rounded-lg">
                    <Text className="text-white font-medium">{isLoading ? "Saving..." : "Save"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function ResumeInternships() {
    const { studentId } = useUser();
    const [internships, setInternships] = useState<any[]>([]);
    const [isPageLoading, setIsPageLoading] = useState(true);

    useEffect(() => {
        if (studentId) loadData();
    }, [studentId]);

    const loadData = async () => {
        setIsPageLoading(true);
        try {
            const data = await fetchResumeInternships(studentId!);
            setInternships(data);
        } catch (e) {
            Toast.show({ type: "error", text1: "Failed to load internships" });
        } finally {
            setIsPageLoading(false);
        }
    };

    const handleAdd = () => {
        setInternships([...internships, { isNew: true }]);
    };

    if (isPageLoading) {
        return (
            <View className="flex-1 bg-white rounded-xl shadow-sm items-center justify-center p-4">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2">Loading internships...</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-[#f6f7f9] p-4">
            <View className="bg-white rounded-lg p-6 shadow-sm mb-10">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-lg font-semibold text-[#000000]">Internships</Text>
                </View>

                {internships.map((item, index) => (
                    <InternshipFormItem 
                        key={item.resumeInternshipId || `new-${index}`} 
                        item={item} 
                        studentId={studentId} 
                        onSaved={loadData}
                        onDelete={loadData}
                    />
                ))}

                <TouchableOpacity 
                    onPress={handleAdd} 
                    className="border-2 border-dashed border-[#43C17A] rounded-lg p-4 items-center justify-center bg-[#43C17A]/5 mt-2"
                >
                    <Text className="text-[#43C17A] font-bold">+ Add Internship</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
