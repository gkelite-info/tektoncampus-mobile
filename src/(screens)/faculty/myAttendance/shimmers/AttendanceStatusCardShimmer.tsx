import React from "react";
import { View } from "react-native";
import Shimmer from "@/components/ui/Shimmer";

export default function AttendanceStatusCardShimmer() {
  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 w-full md:flex-1 md:w-auto ml-0 md:ml-4 flex-row flex-wrap justify-between md:flex-col md:justify-start">
      <View className="w-1/2 md:w-full mb-3 md:mb-4 pr-2">
        <Shimmer width={140} height={14} className="mb-2" />
        <View className="flex-row items-center mt-1">
          <Shimmer width={16} height={16} borderRadius={2} />
          <Shimmer width={60} height={12} className="ml-1.5" />
        </View>
      </View>

      <View className="w-1/2 md:w-full mb-3 md:mb-4 pl-2">
        <Shimmer width={120} height={14} className="mb-2" />
        <Shimmer width={40} height={14} />
      </View>

      <View className="w-1/2 md:w-full mb-3 md:mb-4 pr-2">
        <Shimmer width={100} height={14} className="mb-2" />
        <Shimmer width={40} height={14} />
      </View>

      <View className="w-1/2 md:w-full mb-3 md:mb-0 pl-2">
        <Shimmer width={120} height={14} className="mb-2" />
        <Shimmer width={40} height={14} />
      </View>
    </View>
  );
}
