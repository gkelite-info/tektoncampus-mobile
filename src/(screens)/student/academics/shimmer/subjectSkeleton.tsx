import React from "react";
import { View, ScrollView } from "react-native";

export default function SubjectSkeleton() {
    const skeletonItems = Array.from({ length: 6 });

    return (
        <ScrollView
            className="flex-1 bg-gray-50/50"
            showsVerticalScrollIndicator={false}
        >
            <View className="mb-4 flex-col gap-3 px-1">
                <View className="flex-row flex-wrap gap-4">
                    {[1, 2, 3].map((i) => (
                        <View key={i} className="flex-row items-center gap-2">
                            <View className="h-6 w-24 bg-gray-200 rounded-full opacity-60" />
                        </View>
                    ))}
                </View>
            </View>

            <View className="flex-row flex-wrap justify-between gap-y-3 px-1">
                {skeletonItems.map((_, index) => (
                    <View
                        key={index}
                        className="bg-white rounded-xl w-full min-h-[220px] p-4 flex-col justify-between shadow-sm border border-gray-100 opacity-70"
                    >
                        <View className="flex-col justify-start gap-3">
                            <View className="flex-row items-center justify-between gap-3">
                                <View className="flex-row items-center gap-2 flex-1">
                                    <View className="h-5 bg-gray-200 rounded w-2/3" />
                                    <View className="h-4 w-12 bg-gray-200 rounded-full" />
                                </View>
                                <View className="h-5 w-16 bg-gray-200 rounded-md" />
                            </View>

                            <View className="flex-col gap-3 mt-1">
                                <View className="flex-row items-center gap-2">
                                    <View className="h-3 w-10 bg-gray-200 rounded" />
                                    <View className="h-7 w-7 bg-gray-200 rounded-full" />
                                    <View className="h-3 w-28 bg-gray-200 rounded" />
                                </View>

                                <View className="flex-row items-center gap-4">
                                    <View className="h-3 w-14 bg-gray-200 rounded" />
                                    <View className="h-3 w-20 bg-gray-200 rounded" />
                                </View>

                                <View className="h-3 w-3/4 bg-gray-200 rounded" />
                            </View>
                        </View>

                        <View className="flex-col justify-end mt-4 gap-2">
                            <View className="w-full h-2.5 bg-gray-200 rounded-full" />

                            <View className="flex-row justify-between items-center mt-1">
                                <View className="h-2.5 w-6 bg-gray-200 rounded" />
                                <View className="h-2.5 w-24 bg-gray-200 rounded" />
                            </View>
                        </View>

                    </View>
                ))}
            </View>
        </ScrollView>
    );
}