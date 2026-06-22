import React from "react";
import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsShimmer() {
  const ShimmerRow = () => (
    <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-gray-200" />
        <View className="ml-3">
          <View className="w-32 h-4 bg-gray-200 rounded-md mb-2" />
          <View className="w-48 h-3 bg-gray-200 rounded-md" />
        </View>
      </View>
      <View className="w-10 h-6 bg-gray-200 rounded-full" />
    </View>
  );

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F4F5F6]">
      <ScrollView className="flex-1 px-4" style={{ paddingTop: Math.max(insets.top, 12) + 120 }}>
        {/* Header Shimmer */}
        <View className="mb-6 mt-2">
          <View className="w-32 h-6 bg-gray-200 rounded-md mb-2" />
          <View className="w-48 h-4 bg-gray-200 rounded-md" />
        </View>

        {/* Group 1 */}
        <View className="bg-white p-4 rounded-2xl border border-[#ECEFF1] shadow-sm mb-6">
          <View className="w-24 h-5 bg-gray-200 rounded-md mb-4" />
          <ShimmerRow />
          <ShimmerRow />
        </View>

        {/* Group 2 */}
        <View className="bg-white p-4 rounded-2xl border border-[#ECEFF1] shadow-sm mb-6">
          <View className="w-24 h-5 bg-gray-200 rounded-md mb-4" />
          <ShimmerRow />
          <ShimmerRow />
          <ShimmerRow />
        </View>
      </ScrollView>
    </View>
  );
}
