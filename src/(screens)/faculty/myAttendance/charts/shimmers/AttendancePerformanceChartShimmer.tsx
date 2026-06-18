import React from "react";
import { View } from "react-native";
import Shimmer from "@/components/ui/Shimmer";

export default function AttendancePerformanceChartShimmer() {
  return (
    <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 w-full">
      <Shimmer width={200} height={18} className="mb-6" />

      <View className="h-[220px] w-full flex-row items-end justify-between px-2">
        {[...Array(6)].map((_, i) => (
          <Shimmer 
            key={i} 
            width={30} 
            height={Math.max(40, Math.random() * 200)} 
            borderRadius={4} 
          />
        ))}
      </View>

      <View className="flex-row justify-center items-center mt-6">
        <Shimmer width={80} height={14} className="mr-6" />
        <Shimmer width={80} height={14} />
      </View>
    </View>
  );
}
