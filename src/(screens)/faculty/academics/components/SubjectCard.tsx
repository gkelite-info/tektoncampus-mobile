import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CardProps } from '@/lib/types/faculty';

type SubjectCardProps = {
  item: CardProps;
  onViewDetails: () => void;
};

export default function SubjectCard({ item, onViewDetails }: SubjectCardProps) {
  const percentage = item.percentage ?? 0;

  return (
    <View className="bg-white rounded-xl p-4 flex-col gap-3 shadow-sm border border-gray-100 mb-4 mx-4">
      <View className="flex-row justify-between items-center">
        <Text className="text-[#282828] font-semibold text-lg flex-1 mr-3" numberOfLines={2}>
          {item.subjectTitle} – {item.year}
        </Text>
        <TouchableOpacity 
          onPress={onViewDetails}
          className="bg-[#7051E1] px-3 py-1.5 rounded-md"
        >
          <Text className="text-white font-medium text-xs">View Details</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap gap-x-6 gap-y-2 mt-1">
        <View className="flex-row items-center">
          <Text className="font-bold text-[#282828] text-sm mr-1">Units:</Text>
          <Text className="text-[#525252] text-sm">{item.units.toString().padStart(2, "0")}</Text>
        </View>
        <View className="flex-row items-center">
          <Text className="font-bold text-[#282828] text-sm mr-1">Topics Covered:</Text>
          <Text className="text-[#525252] text-sm">{item.topicsCovered}</Text>
        </View>
        <View className="flex-row items-center w-full">
          <Text className="font-bold text-[#282828] text-sm mr-1">Next lesson:</Text>
          <Text className="text-[#525252] text-sm" numberOfLines={1}>{item.nextLesson}</Text>
        </View>
        <View className="flex-row items-center">
          <Text className="font-bold text-[#282828] text-sm mr-1">Students:</Text>
          <Text className="text-[#525252] text-sm">{item.students}</Text>
        </View>
      </View>

      <View className="mt-3 relative w-full h-3 bg-gray-200 rounded-full overflow-visible">
        <View 
          className="absolute top-0 left-0 h-full bg-[#7051E1] rounded-full" 
          style={{ width: percentage > 0 ? `${percentage}%` : "0%" }}
        />
        {percentage > 0 && (
          <View 
            className="absolute top-1/2 -translate-y-1/2 bg-white rounded-full shadow-sm"
            style={{
              left: percentage >= 100 ? 'calc(100% - 10px)' : `calc(${percentage}% - 5px)`,
              height: 10,
              width: 10,
            }}
          />
        )}
      </View>
      <View className="relative w-full mt-1 flex-row">
         <Text 
           className="text-[#7153E1] font-bold text-[10px]"
           style={{ 
              marginLeft: percentage > 90 ? 'auto' : percentage < 10 ? 0 : `${percentage}%`,
              transform: percentage > 90 || percentage < 10 ? [] : [{ translateX: -10 }]
           }}
         >
           {percentage}%
         </Text>
      </View>
    </View>
  );
}
