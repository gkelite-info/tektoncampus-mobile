import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export const AssignmentCardShimmer = () => {
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
            className="bg-white w-full rounded-xl flex-col p-3 gap-y-3 mb-3 border border-gray-100 shadow-sm"
        >
            <View className="h-[139px] w-full rounded-lg bg-gray-300" />

            <View className="w-full flex-col gap-y-4">
                <View className="w-full flex-col gap-y-4">
                    <View className="w-full flex-col pt-1 gap-y-2">
                        <View className="h-5 bg-gray-300 rounded w-3/4" />
                        <View className="h-4 bg-gray-200 rounded w-1/2" />
                        <View className="flex-row items-center gap-x-2 mt-2 pb-2">
                            <View className="rounded-full bg-gray-200 w-7 h-7" />
                            <View className="h-3 bg-gray-200 rounded w-40" />
                        </View>
                    </View>

                    <View className="w-full flex-row items-center justify-between">
                        <View className="flex-row items-center gap-x-3">
                            <View className="rounded-full bg-gray-200 w-8 h-8" />
                            <View className="rounded-full bg-gray-200 w-8 h-8" />
                        </View>
                        <View className="h-4 bg-gray-200 rounded w-20" />
                    </View>
                </View>

                <View className="flex-row flex-wrap items-center justify-between gap-2 mt-2">
                    <View className="flex-row items-center gap-x-2">
                        <View className="rounded-full bg-gray-200 w-7 h-7" />
                        <View className="h-3 bg-gray-200 rounded w-16" />
                    </View>
                    <View className="flex-row items-center gap-x-2">
                        <View className="rounded-full bg-gray-200 w-7 h-7" />
                        <View className="h-3 bg-gray-200 rounded w-24" />
                    </View>
                    <View className="rounded-full bg-gray-200 w-24 h-6" />
                </View>
            </View>
        </Animated.View>
    );
};

export const AssignmentCardSkeletonGroup = ({
    count = 4,
}: {
    count?: number;
}) => {
    return (
        <>
            {[...Array(count)].map((_, i) => (
                <AssignmentCardShimmer key={i} />
            ))}
        </>
    );
};