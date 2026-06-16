import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PencilSimple, Trash } from 'phosphor-react-native';

interface FacultyQuizCardProps {
  data: any;
  onViewSubmissions?: (quizId: number) => void;
  onEdit?: (quizId: number) => void;
  onDelete?: (quizId: number) => void;
  onPublish?: (quizId: number) => void;
}

export default function FacultyQuizCard({
  data,
  onViewSubmissions,
  onEdit,
  onDelete,
  onPublish,
}: FacultyQuizCardProps) {
  return (
    <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex-col gap-3 relative mb-3">
      {}
      <View className="absolute top-4 right-4 flex-row items-center gap-3 z-10">
        {onEdit && (
          <TouchableOpacity onPress={() => onEdit(data.quizId)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <PencilSimple size={18} color="#9CA3AF" weight="bold" />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(data.quizId)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Trash size={18} color="#9CA3AF" weight="bold" />
          </TouchableOpacity>
        )}
      </View>

      <View className="pr-16">
        <Text className="text-base font-bold text-[#282828] leading-tight">{data.title}</Text>
        <Text className="text-sm font-medium text-gray-500 mt-0.5">{data.subtitle}</Text>
      </View>

      <View className="flex-col gap-2.5 mt-2">
        <View className="flex-row items-center gap-4">
          <Text className="font-bold text-[#282828] w-28 text-sm">Duration</Text>
          <View className="bg-[#F3F0FF] px-2 py-0.5 rounded-md">
            <Text className="text-[#8B5CF6] text-xs font-semibold">{data.duration}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4">
          <Text className="font-bold text-[#282828] w-28 text-sm">Total Questions</Text>
          <Text className="text-gray-600 font-medium text-sm">{data.totalQuestions}</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <Text className="font-bold text-[#282828] w-28 text-sm">Total Marks</Text>
            <Text className="text-gray-600 font-medium text-sm">{data.totalMarks}</Text>
          </View>

          {data.status === 'Draft' ? (
            <TouchableOpacity onPress={() => onPublish?.(data.quizId)}>
              <Text className="text-[#8B5CF6] font-semibold text-sm underline">Publish</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => onViewSubmissions?.(data.quizId)}>
              <Text className="text-[#43C17A] font-semibold text-sm underline">View Submissions</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
