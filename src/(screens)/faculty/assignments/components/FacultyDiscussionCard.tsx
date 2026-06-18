import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React from 'react';
import { View, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { PencilSimple, Trash, CalendarBlank, File } from 'phosphor-react-native';

interface DiscussionCardProps {
  data: any;
  discussionView?: 'active' | 'completed';
  onEdit?: (discussionId: number) => void;
  onDelete?: (discussionId: number) => void;
  onViewSubmissions?: (discussionId: number) => void;
}

export default function FacultyDiscussionCard({
  data,
  discussionView = 'active',
  onEdit,
  onDelete,
  onViewSubmissions
}: DiscussionCardProps) {const { t } = useTranslation();
  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-col gap-3 mb-4 w-full">
      <View className="flex-col gap-1">
        <Text className="text-[15px] font-bold text-[#282828] leading-tight">{data.title}</Text>
        <Text className="text-[13px] text-[#111827] leading-relaxed mt-1">{data.description}</Text>
      </View>

      <View className="flex-col gap-2 pt-2 border-t border-gray-50">
        <View className="flex-row items-center gap-2">
          <View className="p-1 rounded-full bg-[#43C07A24]">
            <CalendarBlank size={14} color="#43C17A" weight="regular" />
          </View>
          <Text className="font-bold text-[#282828] text-[13px]">{t("Auto.Common.UploadedOn", "Uploaded On :")}</Text>
          <Text className="text-gray-600 text-[13px]">
            {data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-GB') : '—'}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="p-1 rounded-full bg-[#43C07A24]">
            <CalendarBlank size={14} color="#EF4444" weight="regular" />
          </View>
          <Text className="font-bold text-[#282828] text-[13px]">{t("Auto.Common.Deadline", "Deadline :")}</Text>
          <Text className="text-gray-600 text-[13px]">
            {data.deadline ? new Date(data.deadline).toLocaleDateString('en-GB') : '—'}
          </Text>
        </View>
      </View>

      {data.discussion_file_uploads && data.discussion_file_uploads.length > 0 &&
      <View className="flex-col gap-2 pt-2 border-t border-gray-50">
          <Text className="font-bold text-[#282828] text-[13px]">{t("Auto.Common.Attachments", "Attachments")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row w-full pb-1">
            {data.discussion_file_uploads.map((file: {fileUrl: string;}, idx: number) =>
          <TouchableOpacity
            key={idx}
            onPress={() => Linking.openURL(file.fileUrl)}
            className="flex-row items-center gap-2 bg-[#16284F38] px-2.5 py-1.5 rounded-md mr-2">
            
                <View className="bg-[#16284F] rounded-full p-1 items-center justify-center">
                  <File size={12} color="white" weight="fill" />
                </View>
                <Text className="text-[#16284F] text-[11px] font-medium" numberOfLines={1}>
                  {file.fileUrl.split('/').pop()?.split('_').slice(1).join('_') || 'Document'}
                </Text>
              </TouchableOpacity>
          )}
          </ScrollView>
        </View>
      }

      <View className="flex-row justify-between items-center pt-3 border-t border-gray-50 mt-1">
        {discussionView === 'active' ?
        <View className="flex-row gap-2">
            <TouchableOpacity
            onPress={() => onEdit?.(data.discussionId)}
            className="bg-[#16284F38] p-2 rounded-full items-center justify-center">
            
              <PencilSimple size={16} color="#16284F" weight="fill" />
            </TouchableOpacity>
            <TouchableOpacity
            onPress={() => onDelete?.(data.discussionId)}
            className="bg-red-50 p-2 rounded-full items-center justify-center">
            
              <Trash size={16} color="#EF4444" weight="fill" />
            </TouchableOpacity>
          </View> :

        <View />
        }
        <TouchableOpacity
          onPress={() => onViewSubmissions?.(data.discussionId)}
          className="bg-[#43C17A] px-4 py-2 rounded-md ml-auto">
          
          <Text className="text-white text-[13px] font-bold">{t("Auto.Common.ViewSubmissions", "View Submissions")}</Text>
        </TouchableOpacity>
      </View>
    </View>);

}