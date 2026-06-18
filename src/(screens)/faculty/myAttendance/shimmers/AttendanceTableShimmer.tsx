import React from "react";
import { View } from "react-native";
import Shimmer from "@/components/ui/Shimmer";

export default function AttendanceTableShimmer() {
  return (
    <View className="w-full mt-4 flex-1">
      <View className="flex-row justify-between items-center mb-3">
        <Shimmer width={150} height={18} />
        <Shimmer width={100} height={32} borderRadius={8} />
      </View>

      <View className="bg-white rounded-lg shadow-sm border border-gray-100 flex-1 overflow-hidden">
        <View className="flex-row bg-[#F2F2F2] px-2 py-3 border-b border-gray-200">
          <Shimmer width={60} height={14} className="mr-4" />
          <Shimmer width={60} height={14} className="mr-4" />
          <Shimmer width={60} height={14} className="mr-4" />
          <Shimmer width={60} height={14} className="mr-4" />
          <Shimmer width={60} height={14} />
        </View>

        <View className="p-2">
          {[...Array(6)].map((_, idx) => (
            <View key={idx} className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0">
              <Shimmer width={60} height={12} className="mr-4" />
              <Shimmer width={50} height={12} className="mr-4" />
              <Shimmer width={50} height={12} className="mr-4" />
              <Shimmer width={60} height={12} className="mr-4" />
              <Shimmer width={40} height={16} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
