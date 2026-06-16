import Skeleton from "@/utils/skeleton";
import React from "react";
import { View, useWindowDimensions } from "react-native";

export function DashboardSkeleton() {
    const { width } = useWindowDimensions();
    const isTabletOrDesktop = width >= 768;

    return (
        <View className="w-full p-2 max-md:p-0">
            <View className="w-full flex-col gap-6 max-md:gap-4">
                {isTabletOrDesktop ? (
                    <View className="flex-row flex-wrap gap-4">
                        <Skeleton className="h-32 flex-1 min-w-[176px] rounded-[20px]" />
                        <Skeleton className="h-32 flex-1 min-w-[176px] rounded-[20px]" />
                        <Skeleton className="h-32 flex-[2] min-w-[176px] rounded-[20px]" />
                    </View>
                ) : (
                    <View className="w-full flex-col gap-3">
                        <View className="flex-row justify-between gap-3 w-full">
                            <Skeleton className="h-[76px] flex-1 rounded-lg" />
                            <Skeleton className="h-[76px] flex-1 rounded-lg" />
                        </View>
                        <Skeleton className="h-32 w-full rounded-lg" />
                    </View>
                )}
            </View>
        </View>
    );
}

export const TableSkeleton = () => {
    const { width } = useWindowDimensions();
    const isTabletOrDesktop = width >= 768;

    return (
        <View className="w-full border border-gray-100 rounded-xl overflow-hidden bg-white p-4 max-md:p-0 max-md:border-none max-md:bg-transparent">
            {isTabletOrDesktop ? (
                <View className="w-full flex-col">
                    {}
                    <View className="flex-row justify-between mb-4 border-b border-gray-100 pb-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-4 w-20 rounded" />
                        ))}
                    </View>

                    {[1, 2, 3, 4, 5].map((row) => (
                        <View
                            key={row}
                            className="flex-row justify-between items-center py-3 border-b border-gray-50"
                        >
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-6 w-6 rounded-full" />
                        </View>
                    ))}
                </View>
            ) : (
                <View className="w-full flex-col gap-2 mt-3">
                    {[1, 2, 3, 4, 5].map((row) => (
                        <View
                            key={row}
                            className="bg-white border-b border-gray-100 py-3 flex-row justify-between items-center"
                        >
                            <View className="flex-col gap-1.5 flex-1 pr-2">
                                <Skeleton className="h-3 w-16 rounded" />
                                <Skeleton className="h-4 w-40 rounded mt-1" />
                            </View>
                            <View className="flex-row items-center gap-2 shrink-0">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-6 w-6 rounded-full" />
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};