import Skeleton from "@/utils/skeleton";
import React from "react";
import { View, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";

export function StudentProgressSkeleton() {
    const headerHeight = useHeaderHeight();

    return (
        <View className="flex-1 bg-[#f4f5f6]" style={{ paddingTop: headerHeight }}>
            <ScrollView
                className="flex-1 p-2"
                contentContainerStyle={{ paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="mb-2">
                    <View className="flex-row p-1 gap-2 items-center justify-between w-full">
                        <View className="flex-1 mr-2">
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="flex-row gap-2 pb-1"
                            >
                                <Skeleton width={80} height={26} style={{ borderRadius: 13 }} />
                                <Skeleton width={60} height={26} style={{ borderRadius: 13 }} />
                                <Skeleton width={70} height={26} style={{ borderRadius: 13 }} />
                                <Skeleton width={75} height={26} style={{ borderRadius: 13 }} />
                            </ScrollView>
                        </View>
                        <Skeleton width={32} height={32} style={{ borderRadius: 16 }} />
                    </View>
                </View>

                <View className="flex-col gap-4">
                    <View className="bg-white rounded-2xl p-4 shadow-sm">
                        <View className="flex-row gap-3 items-center">
                            <Skeleton width={48} height={48} style={{ borderRadius: 24 }} />
                            <View className="flex-1 gap-2">
                                <Skeleton width={120} height={18} />
                                <Skeleton width={80} height={14} />
                                <Skeleton width={100} height={14} />
                            </View>
                        </View>

                        <View className="flex-row gap-2 justify-between mt-5">
                            <Skeleton className="flex-1" height={44} style={{ borderRadius: 10 }} />
                            <Skeleton className="flex-1" height={44} style={{ borderRadius: 10 }} />
                            <Skeleton className="flex-1" height={44} style={{ borderRadius: 10 }} />
                        </View>
                    </View>

                    <View className="bg-white rounded-2xl p-4 shadow-sm items-center">
                        <View className="w-full items-start mb-4">
                            <Skeleton width={140} height={18} />
                        </View>
                        <Skeleton width={160} height={80} style={{ borderTopLeftRadius: 80, borderTopRightRadius: 80 }} />
                        <View className="flex-row gap-6 mt-4 justify-center">
                            <Skeleton width={60} height={14} />
                            <Skeleton width={60} height={14} />
                        </View>
                    </View>

                    <View className="bg-white rounded-2xl p-4 shadow-sm">
                        <Skeleton width={160} height={18} className="mb-5" />
                        <View className="flex-row items-end justify-between gap-4 h-40 px-2">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <Skeleton
                                    key={index}
                                    className="flex-1"
                                    style={{ 
                                        height: `${40 + ((index % 3) + 1) * 18}%`, 
                                        borderTopLeftRadius: 6, 
                                        borderTopRightRadius: 6 
                                    }}
                                />
                            ))}
                        </View>
                    </View>

                    <View className="bg-white rounded-2xl p-4 shadow-sm">
                        <Skeleton width={160} height={18} className="mb-4" />
                        <View className="gap-5">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <View key={index} className="gap-3">
                                    <View className="flex-row justify-between items-center">
                                        <Skeleton width={100} height={16} />
                                        <Skeleton width={50} height={20} style={{ borderRadius: 4 }} />
                                    </View>
                                    <View className="flex-row items-center gap-3">
                                        <Skeleton width={50} height={14} />
                                        <Skeleton className="flex-1" height={10} style={{ borderRadius: 5 }} />
                                        <Skeleton width={40} height={14} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View className="gap-3">
                        <View className="flex-row justify-between items-center mb-1">
                            <Skeleton width={160} height={18} />
                            <Skeleton width={80} height={28} style={{ borderRadius: 6 }} />
                        </View>

                        {Array.from({ length: 2 }).map((_, cardIndex) => (
                            <View
                                key={cardIndex}
                                className="bg-white rounded-xl p-4 border border-gray-100 relative shadow-sm"
                            >
                                <View className="flex-col gap-3">
                                    <View className="flex-row items-center">
                                        <Skeleton width={80} height={14} className="mr-2" />
                                        <Skeleton width={120} height={14} />
                                    </View>
                                    <View className="flex-row items-center">
                                        <Skeleton width={80} height={14} className="mr-2" />
                                        <Skeleton width={40} height={14} />
                                    </View>
                                    <View className="flex-row items-center">
                                        <Skeleton width={80} height={14} className="mr-2" />
                                        <Skeleton width={40} height={14} />
                                    </View>
                                    <View className="flex-row items-center">
                                        <Skeleton width={80} height={14} className="mr-2" />
                                        <Skeleton width={40} height={14} />
                                    </View>
                                    <View className="flex-row items-center">
                                        <Skeleton width={80} height={14} className="mr-2" />
                                        <Skeleton width={40} height={14} />
                                    </View>
                                </View>

                                <View style={{ position: "absolute", right: 12, top: 12 }}>
                                    <Skeleton width={48} height={48} style={{ borderRadius: 24 }} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}