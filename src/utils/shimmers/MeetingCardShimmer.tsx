import React from 'react';
import { View } from 'react-native';

export default function MeetingCardShimmer({
    role,
    category,
    type = "upcoming",
    count = 8
}: {
    role?: string | null;
    category?: string | null;
    type?: string;
    count?: number;
}) {
    const isEditable = ["Wellbeing Manager", "Finance"].includes(role || "")
    return (
        <View className="flex flex-col gap-3">
            {Array.from({ length: count }).map((_, index) => (
                <View
                    key={index}
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col"
                >
                    <View className="bg-[#43C17A26] px-4 py-2 flex-row items-center justify-between gap-3 border-b-2 border-dotted border-[#43C17A]">
                        <View className="flex-row gap-2 items-center justify-center">
                            <View className="bg-[#43C17A] w-7 h-7 rounded-full opacity-40"></View>
                            <View className="h-5 w-32 bg-[#43C17A] rounded-md opacity-40"></View>
                        </View>

                        {(type === "upcoming" && isEditable) && (
                            <View className="flex-row gap-2 items-center justify-center">
                                <View className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                                </View>
                                <View className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center">
                                </View>
                            </View>
                        )}
                    </View>

                    <View className="p-4 flex-1 flex flex-col gap-3">
                        <View className="flex-row justify-between items-start">
                            <View className="w-[80%]">
                                <View className="h-6 bg-gray-200 rounded-md w-3/4"></View>
                            </View>

                            {((category && category !== "Admin") || (role && (!["Admin", "Finance"].includes(role)))) && (
                                <View className="h-6 w-20 bg-green-200 rounded-full"></View>
                            )}
                        </View>

                        <View className="space-y-3 mt-1">
                            <View className="flex-row items-center gap-1">
                                <View className="h-5 w-24 bg-gray-200 rounded-md"></View>
                                <View className="h-5 flex-1 bg-gray-100 rounded-md"></View>
                            </View>

                            <View className="flex-row items-center justify-between mt-3">
                                <View className="flex-row items-center gap-1">
                                    <View className="h-5 w-12 bg-gray-200 rounded-md"></View>
                                    <View className="h-6 w-24 bg-gray-200 rounded-full"></View>
                                </View>
                                <View className="h-8 w-28 bg-gray-200 rounded-full"></View>
                            </View>
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
}
