import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export const StudentDiscussionCardShimmer = () => {
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
            className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm flex-col gap-y-4"
        >
            <View className="flex-col gap-y-4">
                <View className="flex-col gap-y-2 w-full">
                    <View className="h-6 bg-gray-300 rounded-md w-3/4" />
                    <View className="flex-col gap-y-2 mt-1">
                        <View className="h-4 bg-gray-200 rounded-md w-full" />
                        <View className="h-4 bg-gray-200 rounded-md w-5/6" />
                    </View>
                </View>
                <View className="h-9 bg-gray-300 rounded-md w-full" />
            </View>

            <View className="flex-col gap-y-5 mt-1">
                <View className="flex-col gap-y-3">
                    {[...Array(3)].map((_, i) => (
                        <View key={i} className="flex-row items-center gap-x-2">
                            <View className="bg-gray-200 rounded-full p-1">
                                <View className="w-4 h-4 bg-gray-300 rounded-full" />
                            </View>
                            <View className="flex-1 flex-row items-center gap-x-2">
                                <View className="h-3 bg-gray-200 rounded-md w-20" />
                                <View className="h-3 bg-gray-300 rounded-md w-24" />
                            </View>
                        </View>
                    ))}
                </View>

                <View className="flex-col gap-y-3">
                    <View className="h-4 bg-gray-200 rounded-md w-32" />
                    <View className="flex-row gap-x-2 flex-wrap">
                        {[...Array(2)].map((_, i) => (
                            <View key={i} className="h-8 bg-gray-200 rounded-md w-32 mb-1" />
                        ))}
                    </View>
                    <View className="h-4 bg-gray-200 rounded-md w-32 mt-1" />
                    <View className="flex-row gap-x-2 flex-wrap">
                        {[...Array(1)].map((_, i) => (
                            <View key={i} className="h-8 bg-gray-200 rounded-md w-32 mb-1" />
                        ))}
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

export const StudentDiscussionCardSkeletonGroup = ({ count = 3 }: { count?: number }) => {
    return (
        <>
            {[...Array(count)].map((_, i) => (
                <StudentDiscussionCardShimmer key={i} />
            ))}
        </>
    );
};