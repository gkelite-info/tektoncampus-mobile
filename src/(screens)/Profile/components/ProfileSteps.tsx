import { Text } from '@/components/AppText';
import { fonts } from '@/constants/fonts';
import React, { useRef, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { CheckCircle } from "phosphor-react-native";

export type StepItem = {
    id: number;
    title: string;
    query: string;
};

export const PROFILE_STEP_DATA: StepItem[] = [
    { id: 1, title: "Profile", query: "profile" },
    { id: 2, title: "Personal Details", query: "personal-details" },
    { id: 3, title: "Education", query: "education" },
    { id: 4, title: "Key Skills", query: "key-skills" },
    { id: 5, title: "Languages", query: "languages" },
    { id: 6, title: "Profile Summary", query: "profile-summary" },
];

type ProfileStepsProps = {
    currentStepId: number;
    onStepChange: (step: StepItem) => void;
    isSchool?: boolean;
};

export default function ProfileSteps({ currentStepId, onStepChange, isSchool }: ProfileStepsProps) {
    const scrollViewRef = useRef<ScrollView>(null);
    const { width: windowWidth } = Dimensions.get('window');

    const stepsToShow = isSchool ? PROFILE_STEP_DATA.filter(s => s.id !== 3 && s.id !== 4) : PROFILE_STEP_DATA;

    useEffect(() => {
        
        const activeIndex = stepsToShow.findIndex(s => s.id === currentStepId);
        if (activeIndex !== -1 && scrollViewRef.current) {
            
            const ITEM_WIDTH = 100;
            const scrollX = Math.max(0, (activeIndex * ITEM_WIDTH) - (windowWidth / 2) + (ITEM_WIDTH / 2));
            scrollViewRef.current.scrollTo({ x: scrollX, animated: true });
        }
    }, [currentStepId, windowWidth]);

    return (
        <View className="w-full p-4 bg-white rounded-xl  mb-4">
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                className="w-full py-1"
                contentContainerStyle={{ paddingHorizontal: 8 }}
            >
                <View className="flex-row items-center">
                    {stepsToShow.map((step, index) => {
                        const isCompleted = step.id < currentStepId;
                        const isActive = step.id === currentStepId;

                        return (
                            <View key={step.id} className="flex-row items-center">
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => onStepChange(step)}
                                    className="items-center justify-center relative w-[80px]"
                                >
                                    <View className="items-center">
                                        {isCompleted ? (
                                            <CheckCircle size={32} weight="fill" color="#74CB64" />
                                        ) : (
                                            <View 
                                                className={`rounded-full border h-8 w-8 items-center justify-center ${isActive ? 'border-[#74CB64]' : 'border-[#878787]'}`}
                                            >
                                                <Text className={`text-xs ${isActive ?'text-[#74CB64] ' : 'text-[#878787]'}`} style={{ fontFamily: fonts.bold }}>
                                                    {step.id}
                                                </Text>
                                            </View>
                                        )}
                                        <Text 
                                            className={`text-[10px] mt-2 text-center w-[80px] ${isActive ?'text-[#74CB64] ' : 'text-[#878787]'}`}
                                            numberOfLines={1}
                                         style={{ fontFamily: fonts.bold }}>
                                            {step.title}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {index !== PROFILE_STEP_DATA.length - 1 && (
                                    <View className="w-[40px] items-center justify-center mb-5 -mx-2 z-[-1]">
                                        {}
                                        <View 
                                            className="h-[2px] w-full"
                                            style={{
                                                backgroundColor: isCompleted ? '#74CB64' : '#E5E7EB',
                                            }}
                                        />
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}
