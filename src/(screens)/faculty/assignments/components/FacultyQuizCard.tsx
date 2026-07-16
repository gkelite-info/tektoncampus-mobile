import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts';import { Text } from '@/components/AppText';
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
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
  onPublish
}: FacultyQuizCardProps) {const { t } = useTranslation();
  return (
    <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex-col gap-3 relative mb-3">
      {}
      <View className="absolute top-4 right-4 flex-row items-center gap-3 z-10">
        {onEdit &&
        <TouchableOpacity onPress={() => onEdit(data.quizId)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <PencilSimple size={18} color="#9CA3AF" weight="bold" />
          </TouchableOpacity>
        }
        {onDelete &&
        <TouchableOpacity onPress={() => onDelete(data.quizId)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Trash size={18} color="#9CA3AF" weight="bold" />
          </TouchableOpacity>
        }
      </View>

      <View className="pr-16">
        <Text className="text-base text-[#282828] leading-tight" style={{ fontFamily: fonts.bold }}>{data.title}</Text>
        <Text className="text-sm text-gray-500 mt-0.5" style={{ fontFamily: fonts.medium }}>{data.subtitle}</Text>
      </View>

      <View className="flex-col gap-2.5 mt-2">
        <View className="flex-row items-center gap-4">
          <Text className="text-[#282828] w-28 text-sm" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Duration", "Duration")}</Text>
          <View className="bg-[#F3F0FF] px-2 py-0.5 rounded-md">
            <Text className="text-[#8B5CF6] text-xs" style={{ fontFamily: fonts.semiBold }}>{data.duration}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4">
          <Text className="text-[#282828] w-28 text-sm" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.TotalQuestions", "Total Questions")}</Text>
          <Text className="text-gray-600 text-sm" style={{ fontFamily: fonts.medium }}>{data.totalQuestions}</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <Text className="text-[#282828] w-28 text-sm" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.TotalMarks", "Total Marks")}</Text>
            <Text className="text-gray-600 text-sm" style={{ fontFamily: fonts.medium }}>{data.totalMarks}</Text>
          </View>

          {data.status === 'Draft' ?
          <TouchableOpacity onPress={() => onPublish?.(data.quizId)}>
              <Text className="text-[#8B5CF6] text-sm underline" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Publish", "Publish")}</Text>
            </TouchableOpacity> :

          <TouchableOpacity onPress={() => onViewSubmissions?.(data.quizId)}>
              <Text className="text-[#43C17A] text-sm underline" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.ViewSubmissions", "View Submissions")}</Text>
            </TouchableOpacity>
          }
        </View>
      </View>
    </View>);

}