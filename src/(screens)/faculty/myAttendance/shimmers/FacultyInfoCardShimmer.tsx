import React from "react";
import { View } from "react-native";
import Shimmer from "@/components/ui/Shimmer";

export default function FacultyInfoCardShimmer() {
  return (
    <View className="w-full md:flex-1 md:w-auto bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100 flex-col md:flex-row items-start md:items-center">
      <View className="flex-row items-center border-b border-gray-100 pb-4 mb-4 w-full md:border-b-0 md:pb-0 md:mb-0 md:w-auto md:flex-col md:mr-8 md:border-r md:pr-6">
        <View className="mr-4 md:mr-0 md:mb-3">
          <Shimmer width={85} height={85} borderRadius={42.5} />
        </View>
        <Shimmer width={100} height={16} />
      </View>

      <View className="flex-1 flex-row flex-wrap w-full mt-2">
        {[...Array(6)].map((_, i) => (
          <View key={i} className="w-1/2 mb-4 px-1">
            <Shimmer width={80} height={12} className="mb-2" />
            <Shimmer width="80%" height={12} />
          </View>
        ))}
      </View>
    </View>
  );
}
