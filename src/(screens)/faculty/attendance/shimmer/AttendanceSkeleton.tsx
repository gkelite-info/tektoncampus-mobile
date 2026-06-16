import React from 'react';
import { View, ScrollView } from 'react-native';

export default function AttendanceSkeleton() {
  return (
    <ScrollView className="px-4 pt-28 pb-4 flex-1 bg-white">
      {}
      <View className="flex-col justify-between items-start mb-6">
        <View className="flex-col w-full mb-4">
          <View className="h-8 w-48 bg-gray-200 rounded-md mb-2" />
          <View className="h-4 w-64 bg-gray-200 rounded-md" />
        </View>
        <View className="h-20 w-full bg-gray-200 rounded-xl" />
      </View>

      {}
      <View className="flex-row flex-wrap justify-between w-full mb-6">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="h-20 w-[48%] bg-gray-200 rounded-xl mb-4" />
        ))}
      </View>

      {}
      <View className="flex-row justify-between items-center py-2 mb-4">
        <View className="h-8 w-40 bg-gray-200 rounded-full" />
        <View className="h-8 w-24 bg-gray-200 rounded-lg" />
      </View>

      {}
      <View className="border border-gray-100 rounded-xl overflow-hidden bg-white mb-10">
        {}
        <View className="flex-row items-center p-4 border-b border-gray-100 bg-gray-50">
          <View className="h-4 w-4 bg-gray-200 rounded mr-4" />
          <View className="h-4 w-10 bg-gray-200 rounded mr-4" />
          <View className="h-8 w-8 bg-gray-200 rounded-full mr-4" />
          <View className="h-4 w-24 bg-gray-200 rounded" />
        </View>

        {}
        {[1, 2, 3, 4, 5].map((row) => (
          <View
            key={row}
            className="flex-row items-center p-4 border-b border-gray-50"
          >
            <View className="h-4 w-4 bg-gray-200 rounded mr-4" />
            <View className="h-4 w-10 bg-gray-200 rounded mr-4" />
            <View className="h-8 w-8 bg-gray-200 rounded-full mr-4" />
            <View className="h-4 w-32 bg-gray-200 rounded" />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
