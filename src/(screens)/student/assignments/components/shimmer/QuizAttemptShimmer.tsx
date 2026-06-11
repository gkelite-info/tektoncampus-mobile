import React, { useEffect, useRef } from "react";
import { View, ScrollView, Animated } from "react-native";

export const QuizAttemptShimmer = () => {
    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.4,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    return (
        <Animated.View
            style={{ opacity: pulseAnim }}
            className="flex-1 bg-[#f4f4f4] p-4 relative"
        >
            <View className="flex-row justify-between items-start mb-6">
                <View className="flex-col gap-2 w-1/2">
                    <View className="h-6 bg-gray-200 rounded w-3/4" />
                    <View className="h-4 bg-gray-200 rounded w-1/2" />
                </View>
                <View className="h-10 w-24 bg-gray-200 rounded-md" />
            </View>

            <View className="h-2.5 w-full bg-gray-200 rounded-full mb-6" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                className="flex-1"
            >
                <View className="gap-4">
                    {[1, 2, 3].map((i) => (
                        <View
                            key={i}
                            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm"
                        >
                            <View className="h-5 bg-gray-200 rounded w-full mb-4" />

                            <View className="gap-3">
                                <View className="h-4 bg-gray-200 rounded w-1/2" />
                                <View className="h-4 bg-gray-200 rounded w-1/3" />
                                <View className="h-4 bg-gray-200 rounded w-1/4" />
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </Animated.View>
    );
};