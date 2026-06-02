import React from "react";
import { View } from "react-native";

interface TimetableCardShimmerProps {
    count?: number;
}

export default function TimetableCardShimmer({ count = 6 }: TimetableCardShimmerProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <View
                    key={index}
                    className="w-full bg-white rounded-xl p-4 flex-row gap-3 items-center shadow-sm border border-gray-100 opacity-60"
                >
                    <View className="w-16 flex-col items-center justify-center border-r border-gray-100 pr-2 shrink-0 gap-y-1.5">
                        <View className="h-3 w-12 bg-gray-200 rounded-sm" />
                        <View className="h-2 w-1.5 bg-gray-200 rounded-sm" />
                        <View className="h-3 w-12 bg-gray-200 rounded-sm" />
                    </View>

                    <View className="flex-1 min-w-0 pr-6 relative gap-y-2">
                        <View className="h-4 w-3/4 bg-gray-200 rounded-md" />

                        <View className="h-3 w-1/2 bg-gray-200 rounded-md mt-0.5" />

                        <View className="flex-row items-center gap-x-3 mt-0.5">
                            <View className="h-3 w-14 bg-gray-200 rounded-md" />
                            <View className="h-3 w-20 bg-gray-200 rounded-md" />
                        </View>

                        <View className="absolute right-[-6px] bottom-[6px] rounded-full h-8 w-8 bg-gray-200" />
                    </View>
                </View>
            ))}
        </>
    );
}