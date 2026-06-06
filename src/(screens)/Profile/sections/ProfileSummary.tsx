import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";
import {
    getUserProfileSummary,
    createProfileSummary,
    updateProfileSummary,
} from "@/lib/helpers/profile/profileProfileSummary";

export default function ProfileSummary() {
    const [description, setDescription] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [summaryId, setSummaryId] = useState<number | null>(null);
    const { userId } = useUser();

    useEffect(() => {
        if (!userId) return;
        setLoading(true);

        getUserProfileSummary(Number(userId))
            .then((data) => {
                if (data?.summary) {
                    setDescription(data.summary);
                    setSummaryId(data.summaryId);
                }
            })
            .catch(() => {
                Toast.show({ type: "error", text1: "Error", text2: "Failed to load summary" });
            })
            .finally(() => setLoading(false));
    }, [userId]);

    const handleSubmit = async () => {
        if (!userId) return;
        const trimmed = description.trim();

        if (!trimmed) {
            Toast.show({ type: "error", text1: "Error", text2: "Please write a summary before submitting." });
            return;
        }

        try {
            setIsSubmitting(true);
            if (summaryId) {
                await updateProfileSummary(Number(userId), trimmed);
            } else {
                const result = await createProfileSummary(Number(userId), trimmed);
                setSummaryId(result?.summaryId);
            }
            Toast.show({ type: "success", text1: "Success", text2: "Profile Summary Saved Successfully" });
        } catch (error) {
            Toast.show({ type: "error", text1: "Error", text2: "Failed to submit summary. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center p-8 bg-white rounded-xl mt-4">
                <ActivityIndicator size="large" color="#43C17A" />
            </View>
        );
    }

    return (
        <View className="bg-white rounded-xl shadow-sm p-6 mt-4">
            <Text className="text-xl font-bold text-[#282828] mb-6">Profile Summary</Text>

            <View>
                <Text className="text-base font-medium text-[#282828] mb-1">
                    Write Your Professional Summary
                </Text>
                <Text className="text-sm text-[#525252] mb-4">
                    Share a short overview of your education, skills, and career goals what drives you and where you see your future.
                </Text>

                <View className="relative mb-4">
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        maxLength={1000}
                        placeholder="A passionate Computer Science student with a strong interest in software development and problem-solving. Eager to apply technical skills to real-world projects and grow as a developer."
                        textAlignVertical="top"
                        className="w-full border border-[#CCCCCC] rounded-lg p-4 text-sm text-[#525252] min-h-[160px] bg-white"
                    />
                    <Text className="absolute bottom-3 right-4 text-xs text-gray-400">
                        {description.length}/1000
                    </Text>
                </View>

                <View className="flex-row justify-end">
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        className={`bg-[#43C17A] px-6 py-3 rounded-lg flex-row items-center justify-center ${
                            isSubmitting ? "opacity-50" : ""
                        }`}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                        ) : null}
                        <Text className="text-white font-bold">
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
