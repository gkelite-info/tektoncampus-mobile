import React, { useRef, useEffect, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { CheckCircle, CaretLeft, CaretRight } from "phosphor-react-native";
import { useUser } from "@/utils/context/UserContext";

export type ResumeStepItem = {
    id: number;
    title: string;
    query: string;
};

export const RESUME_STEP_DATA: ResumeStepItem[] = [
    { id: 1,  title: "Personal Details",      query: "personal-details" },
    { id: 2,  title: "Education",             query: "education" },
    { id: 3,  title: "Key Skills",            query: "key-skills" },
    { id: 4,  title: "Languages",             query: "languages" },
    { id: 5,  title: "Internships",           query: "internships" },
    { id: 6,  title: "Projects",              query: "projects" },
    { id: 7,  title: "Accomplishments",       query: "accomplishments" },
    { id: 8,  title: "Competitive Exams",     query: "competitive-exams" },
    { id: 9,  title: "Employment",            query: "employment" },
    { id: 10, title: "Academic Achievements", query: "academic-achievements" },
    { id: 11, title: "Profile Summary",       query: "profile-summary" },
    { id: 12, title: "Export Resume",         query: "export-resume" },
];

interface ResumeStepsProps {
    currentStepId: number;
    onStepChange: (step: ResumeStepItem) => void;
}

export default function ResumeSteps({ currentStepId, onStepChange }: ResumeStepsProps) {
    const scrollViewRef = useRef<ScrollView>(null);
    const [workStatus, setWorkStatus] = useState<string | null>(null);

    // Filter out employment if fresher (can connect to actual user state later)
    const filteredSteps = useMemo(() => {
        if (!workStatus) return RESUME_STEP_DATA;
        if (workStatus.toLowerCase() === "fresher") {
            return RESUME_STEP_DATA.filter(step => step.query !== "employment");
        }
        return RESUME_STEP_DATA;
    }, [workStatus]);

    const activeIndex = filteredSteps.findIndex(s => s.id === currentStepId);

    // Auto-scroll logic could go here based on step width (~80px per step)
    useEffect(() => {
        if (scrollViewRef.current && activeIndex >= 0) {
            scrollViewRef.current.scrollTo({
                x: Math.max(0, activeIndex * 80 - Dimensions.get("window").width / 2 + 40),
                animated: true,
            });
        }
    }, [activeIndex]);

    const handlePrev = () => {
        if (activeIndex > 0) {
            onStepChange(filteredSteps[activeIndex - 1]);
        }
    };

    const handleNext = () => {
        if (activeIndex < filteredSteps.length - 1) {
            onStepChange(filteredSteps[activeIndex + 1]);
        }
    };

    return (
        <View className="w-full bg-white rounded-xl shadow-sm p-4 mb-4">
            <View className="flex-row items-center gap-2">
                {/* Left Arrow */}
                <TouchableOpacity
                    onPress={handlePrev}
                    disabled={activeIndex === 0}
                    className={`w-7 h-7 items-center justify-center rounded-full border border-[#C0C0C0] ${activeIndex === 0 ? "opacity-30" : ""}`}
                >
                    <CaretLeft size={14} color="#525252" />
                </TouchableOpacity>

                {/* Scrollable steps */}
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: 8, alignItems: "center" }}
                >
                    <View className="flex-row items-center gap-1">
                        {filteredSteps.map((step, index) => {
                            const isCompleted = index < activeIndex;
                            const isActive = index === activeIndex;

                            return (
                                <View key={step.id} className="flex-row items-center">
                                    <TouchableOpacity
                                        onPress={() => onStepChange(step)}
                                        className="items-center justify-center w-[80px]"
                                    >
                                        <View className={`items-center transition-all ${isActive ? "scale-110" : ""}`}>
                                            {isCompleted ? (
                                                <CheckCircle size={32} color="#74CB64" weight="fill" />
                                            ) : (
                                                <View className="rounded-full border border-[#878787] h-8 w-8 items-center justify-center">
                                                    <Text className="text-xs text-[#878787]">{index + 1}</Text>
                                                </View>
                                            )}

                                            <Text
                                                numberOfLines={2}
                                                className={`text-xs mt-2 text-center ${isActive ? "text-[#74CB64] font-medium" : "text-[#878787]"}`}
                                            >
                                                {step.title}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    {index !== filteredSteps.length - 1 && (
                                        <View className="w-8 h-[2px] mx-1 overflow-hidden">
                                            <View className={`w-full h-full border-t-2 border-dashed ${isCompleted ? "border-[#74CB64]" : "border-[#878787]"}`} />
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Right Arrow */}
                <TouchableOpacity
                    onPress={handleNext}
                    disabled={activeIndex === filteredSteps.length - 1}
                    className={`w-7 h-7 items-center justify-center rounded-full border border-[#C0C0C0] ${activeIndex === filteredSteps.length - 1 ? "opacity-30" : ""}`}
                >
                    <CaretRight size={14} color="#525252" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
