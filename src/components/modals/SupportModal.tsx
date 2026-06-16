import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, SafeAreaView, TextInput } from "react-native";
import { ArrowLeft, ClockCounterClockwise, Hourglass, CheckCircle, User, CaretDown, CloudArrowUp } from "phosphor-react-native";
import { useUser } from "@/utils/context/UserContext";

type Props = {
    visible: boolean;
    onClose: () => void;
};

export default function SupportModal({ visible, onClose }: Props) {
    const { role } = useUser();
    const [priority, setPriority] = useState("Medium");
    const [issueRelated, setIssueRelated] = useState("");
    const [description, setDescription] = useState("");
    
    // In a real app we would use a Picker component, but for simplicity we'll just mock the dropdown here
    const [showIssueDropdown, setShowIssueDropdown] = useState(false);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView className="flex-1 bg-[#F3F4F6]">
                <View className="flex-row items-center border-b border-gray-200 bg-white p-4">
                    <TouchableOpacity onPress={onClose} className="mr-3 p-1">
                        <ArrowLeft size={24} color="#282828" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-[#282828]">Tekton Campus Support</Text>
                </View>

                <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text className="text-[#525252] text-sm mb-6">
                        Fill in the details below. Every submission is tracked and resolved transparently.
                    </Text>

                    {}
                    <View className="flex-row justify-between mb-6">
                        <View className="flex-1 bg-[#E5E0FF] rounded-xl p-3 mr-2 items-center">
                            <View className="bg-white rounded-full p-1.5 mb-2">
                                <ClockCounterClockwise weight="fill" size={16} color="#6C5CE7" />
                            </View>
                            <Text className="text-[#6C5CE7] text-2xl font-bold">15</Text>
                            <Text className="text-xs text-[#525252]">Previous</Text>
                        </View>
                        <View className="flex-1 bg-[#F5E6CA] rounded-xl p-3 mx-1 items-center">
                            <View className="bg-white rounded-full p-1.5 mb-2">
                                <Hourglass weight="fill" size={16} color="#F39C12" />
                            </View>
                            <Text className="text-[#F39C12] text-2xl font-bold">05</Text>
                            <Text className="text-xs text-[#525252]">Pending</Text>
                        </View>
                        <View className="flex-1 bg-[#D2EBE0] rounded-xl p-3 ml-2 items-center">
                            <View className="bg-white rounded-full p-1.5 mb-2">
                                <CheckCircle weight="fill" size={16} color="#27AE60" />
                            </View>
                            <Text className="text-[#27AE60] text-2xl font-bold">10</Text>
                            <Text className="text-xs text-[#525252]">Resolved</Text>
                        </View>
                    </View>

                    {}
                    <View className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        {}
                        <View className="mb-4">
                            <Text className="text-xs font-bold text-[#515151] mb-1">Role</Text>
                            <View className="flex-row items-center bg-[#EEF2ED] border border-[#CCCCCC] rounded-md px-3 py-2.5">
                                <User size={18} color="#888888" />
                                <Text className="ml-2 text-[#525252]">{role || "Student"}</Text>
                            </View>
                        </View>

                        {}
                        <View className="mb-4">
                            <Text className="text-xs font-bold text-[#515151] mb-1">Issue Related</Text>
                            <TouchableOpacity 
                                onPress={() => setShowIssueDropdown(!showIssueDropdown)}
                                className="flex-row justify-between items-center bg-white border border-[#CCCCCC] rounded-md px-3 py-3"
                            >
                                <Text className={issueRelated ? "text-[#525252]" : "text-gray-400"}>
                                    {issueRelated || "Select Issue Type"}
                                </Text>
                                <CaretDown size={16} color="#525252" />
                            </TouchableOpacity>
                            {showIssueDropdown && (
                                <View className="mt-1 border border-gray-200 rounded-md bg-white">
                                    {['Academic', 'Financial', 'Technical'].map(item => (
                                        <TouchableOpacity 
                                            key={item}
                                            className="p-3 border-b border-gray-100"
                                            onPress={() => {
                                                setIssueRelated(item);
                                                setShowIssueDropdown(false);
                                            }}
                                        >
                                            <Text className="text-[#525252]">{item}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {}
                        <View className="mb-4">
                            <Text className="text-xs font-bold text-[#515151] mb-1">Description</Text>
                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Provide detailed information about the issue you're facing..."
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                className="bg-white border border-[#CCCCCC] rounded-md p-3 text-[#525252] min-h-[100px]"
                            />
                        </View>

                        {}
                        <View className="mb-5">
                            <Text className="text-xs font-bold text-[#515151] mb-2">Priority Level</Text>
                            <View className="flex-row justify-between gap-2">
                                <TouchableOpacity
                                    onPress={() => setPriority("Low")}
                                    className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-md border ${
                                        priority === "Low" ? "border-[#43C17A] bg-[#F4FAF6]" : "border-[#CCCCCC] bg-white"
                                    }`}
                                >
                                    <View className="w-2 h-2 rounded-full bg-[#27AE60]" />
                                    <Text className={`text-xs font-bold ${priority === "Low" ? "text-[#282828]" : "text-[#515151]"}`}>Low</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setPriority("Medium")}
                                    className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-md border ${
                                        priority === "Medium" ? "border-[#43C17A] bg-[#F4FAF6]" : "border-[#CCCCCC] bg-white"
                                    }`}
                                >
                                    <View className="w-2 h-2 rounded-full bg-[#F39C12]" />
                                    <Text className={`text-xs font-bold ${priority === "Medium" ? "text-[#282828]" : "text-[#515151]"}`}>Medium</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setPriority("High")}
                                    className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-md border ${
                                        priority === "High" ? "border-[#43C17A] bg-[#F4FAF6]" : "border-[#CCCCCC] bg-white"
                                    }`}
                                >
                                    <View className="w-2 h-2 rounded-full bg-[#B87333]" />
                                    <Text className={`text-xs font-bold ${priority === "High" ? "text-[#282828]" : "text-[#515151]"}`}>High</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {}
                        <View className="mb-4">
                            <Text className="text-xs font-bold text-[#515151] mb-1">Upload Proof (Images/Video)</Text>
                            <TouchableOpacity className="border-2 border-dashed border-[#A8D5BA] bg-[#F8FCF9] rounded-xl p-8 items-center justify-center">
                                <View className="mb-2"><CloudArrowUp size={32} color="#888888" /></View>
                                <Text className="text-sm text-[#282828] mb-1">
                                    Tap to <Text className="text-[#27AE60] font-bold">browse</Text>
                                </Text>
                                <Text className="text-xs text-[#888888]">Support: JPG, PNG, PDF</Text>
                            </TouchableOpacity>
                        </View>

                        {}
                        <TouchableOpacity className="bg-[#43C17A] py-3.5 rounded-xl items-center mt-2">
                            <Text className="text-white font-bold text-base">Submit Request</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}
