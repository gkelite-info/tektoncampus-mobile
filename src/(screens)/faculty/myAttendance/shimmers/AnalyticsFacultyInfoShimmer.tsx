import React from "react";
import { View } from "react-native";
import Shimmer from "@/components/ui/Shimmer";

export default function AnalyticsFacultyInfoShimmer() {
  return (
    <View className="w-full mb-5 px-1">
      <Shimmer width={150} height={18} className="mb-4" />

      <View className="flex-row flex-wrap w-full mt-2">
        {[...Array(6)].map((_, i) => (
          <View key={i} className="w-1/2 md:w-1/3 mb-4 pr-2">
            <Shimmer width={100} height={14} className="mb-2" />
            <Shimmer width="80%" height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}
