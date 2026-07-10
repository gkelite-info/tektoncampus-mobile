import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ScrollView, DimensionValue } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";

function ShimmerBlock({ width, height, className }: { width?: DimensionValue; height?: DimensionValue; className?: string }) {
    const shimmerAnimatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnimatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnimatedValue, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [shimmerAnimatedValue]);

    const translateX = shimmerAnimatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-64, 300], 
    });

    return (
        <View style={[{ width, height }, styles.blockBase]} className={className}>
            <Animated.View
                style={[
                    styles.shimmerLine,
                    { transform: [{ translateX }] },
                ]}
                className="absolute top-0 bottom-0 w-16 bg-white opacity-40"
            />
        </View>
    );
}

export default function PaymentsSkeleton() {
    const headerHeight = useHeaderHeight();

    return (
        <ScrollView 
            className="flex-1 bg-[#F5F5F7]"
            contentContainerStyle={{ paddingTop: headerHeight + 16, paddingBottom: 100 }}
        >
            <View className="p-4 lg:p-2">
                {/* Header Shimmer */}
                <View className="mb-6">
                    <ShimmerBlock height={24} width={288} className="rounded mb-3 max-md:w-48 bg-gray-300" />
                    <ShimmerBlock height={16} width={520} className="rounded max-md:hidden bg-gray-200" />
                </View>

                {/* Profile Card Shimmer */}
                <View className="flex-row rounded-xl bg-white p-4 md:p-6 shadow-sm mb-6 items-center gap-6 overflow-hidden">
                    <ShimmerBlock height={80} width={80} className="rounded-full shrink-0 bg-gray-200" />
                    
                    <View className="flex-1 space-y-3 gap-y-3">
                        <ShimmerBlock height={24} width={208} className="rounded-md bg-gray-300" />
                        <View className="flex-row items-center gap-2">
                            <ShimmerBlock height={16} width={64} className="rounded bg-gray-200" />
                            <ShimmerBlock height={16} width={160} className="rounded bg-gray-200" />
                        </View>
                        <View className="flex-row items-center gap-2">
                            <ShimmerBlock height={16} width={48} className="rounded bg-gray-200" />
                            <ShimmerBlock height={16} width={96} className="rounded bg-gray-200" />
                        </View>
                        <View className="flex-row items-center gap-2">
                            <ShimmerBlock height={16} width={64} className="rounded bg-gray-200" />
                            <ShimmerBlock height={16} width={128} className="rounded bg-gray-200" />
                        </View>
                    </View>
                </View>

                {/* Dashboard Shimmer */}
                <View className="bg-white rounded-xl p-4 md:p-8 shadow-sm min-h-[600px] gap-y-6">
                    {/* Tabs */}
                    <View className="flex-row justify-center md:justify-start mb-6">
                        <View className="flex-row items-center bg-gray-100 p-2 rounded-full gap-3">
                            <ShimmerBlock height={36} width={96} className="rounded-full bg-gray-300" />
                            <ShimmerBlock height={36} width={112} className="rounded-full bg-gray-200" />
                            <ShimmerBlock height={36} width={96} className="rounded-full bg-gray-200" />
                        </View>
                    </View>

                    <ShimmerBlock height={20} width={160} className="rounded bg-gray-300" />

                    {/* Active Plan Card Header */}
                    <View className="bg-emerald-50/50 rounded-lg p-4 flex-row justify-between items-center border border-emerald-100/50">
                        <View className="space-y-2 gap-y-2">
                            <ShimmerBlock height={16} width={144} className="rounded bg-emerald-200/50" />
                            <ShimmerBlock height={12} width={96} className="rounded bg-emerald-100" />
                        </View>
                        <ShimmerBlock height={16} width={64} className="rounded bg-emerald-200/50" />
                    </View>

                    {/* Breakdown List */}
                    <View className="space-y-4 gap-y-4 max-w-2xl mt-2">
                        {[1, 2, 3].map((i) => (
                            <View key={i} className="flex-row justify-between">
                                <ShimmerBlock height={16} width={128} className="rounded bg-gray-200" />
                                <ShimmerBlock height={16} width={64} className="rounded bg-gray-300" />
                            </View>
                        ))}
                        <View className="flex-row justify-between pt-2 border-t border-gray-100">
                            <ShimmerBlock height={16} width={160} className="rounded bg-gray-300" />
                            <ShimmerBlock height={16} width={80} className="rounded bg-gray-300" />
                        </View>
                    </View>

                    {/* Roadmap Boxes */}
                    <View className="mt-8 space-y-4 gap-y-4">
                        <ShimmerBlock height={80} width="100%" className="rounded-xl bg-gray-100" />
                        <ShimmerBlock height={80} width="100%" className="rounded-xl bg-gray-50" />
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    blockBase: {
        overflow: "hidden",
        position: "relative",
    },
    shimmerLine: {
        transform: [{ skewX: "-20deg" }],
    },
});
