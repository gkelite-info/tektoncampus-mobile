import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export const QuizCardShimmer = () => {
    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const pulse = Animated.sequence([
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
        ]);

        Animated.loop(pulse).start();
    }, [pulseAnim]);

    return (
        <Animated.View
            style={{ opacity: pulseAnim }}
            className="p-3.5 bg-white rounded-2xl mb-4 border border-gray-100 shadow-sm flex-col"
        >
            <View className="flex-col gap-y-4 w-full">
                <View className="rounded-lg bg-gray-300 w-full h-32" />

                <View className="flex-col gap-y-4 w-full">
                    <View className="flex-col gap-y-3">
                        <View className="flex-col gap-y-2 w-full">
                            <View className="h-6 bg-gray-300 rounded-md w-48" />
                            <View className="h-4 bg-gray-200 rounded-md w-40" />
                        </View>
                        <View className="h-9 bg-gray-300 rounded-md w-full" />
                    </View>

                    <View className="flex-col gap-y-2.5">
                        {[...Array(4)].map((_, i) => (
                            <View key={i} className="flex-row items-center gap-x-2">
                                <View className="bg-gray-200 rounded-full p-1">
                                    <View className="w-4 h-4 bg-gray-300 rounded-full" />
                                </View>
                                <View className="flex-1">
                                    <View className="h-3 bg-gray-200 rounded-md w-3/4" />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

export const QuizCardSkeletonGroup = ({ count = 3 }: { count?: number }) => {
    return (
        <>
            {[...Array(count)].map((_, i) => (
                <QuizCardShimmer key={i} />
            ))}
        </>
    );
};