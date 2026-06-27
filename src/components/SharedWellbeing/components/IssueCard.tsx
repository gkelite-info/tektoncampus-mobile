import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Text } from '@/components/AppText';
import { ListDashes, PencilSimple, Trash } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import type { StudentWellbeingIssueListItem } from '@/lib/helpers/wellbeingSupportIssues/types';

interface IssueCardProps {
  issue: StudentWellbeingIssueListItem;
  showActions?: boolean;
  onEdit?: (issue: StudentWellbeingIssueListItem) => void;
  onDelete?: (issue: StudentWellbeingIssueListItem) => void;
}

export default function IssueCard({
  issue,
  showActions = false,
  onEdit,
  onDelete,
}: IssueCardProps) {
  const { t } = useTranslation();
  const canShowActions = showActions && issue.canModify !== false; // defaulted to true if not specified

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
        return { bg: '#009B55', text: '#FFFFFF' };
      case 'Rejected':
        return { bg: '#FF2A2A', text: '#FFFFFF' };
      case 'Pending':
      default:
        return { bg: '#FFB067', text: '#FFFFFF' };
    }
  };

  const getContainerBgColor = (status: string) => {
    switch (status) {
      case 'Resolved':
        return '#F0FAF4';
      case 'Rejected':
        return '#FFF2F2';
      case 'Pending':
      default:
        return '#FFF9F2';
    }
  };

  const statusColors = getStatusColor(issue.status);

  return (
    <View
      style={{ backgroundColor: getContainerBgColor(issue.status) }}
      className="w-full rounded-2xl p-4 mb-4"
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-[#E5F3EC] items-center justify-center mr-2">
            <ListDashes size={18} weight="bold" color="#009B55" />
          </View>
          <Text className="font-semibold text-gray-700">
            {t('Wellbeing_module.common.IssueDetails', 'Issue Details')}
          </Text>
        </View>

        <View className="flex-col items-end">
          <View className="flex-row items-center mb-1">
            {canShowActions && (
              <View className="flex-row items-center mr-2">
                <TouchableOpacity
                  onPress={() => onEdit?.(issue)}
                  className="w-8 h-8 rounded-full bg-white items-center justify-center shadow-sm mr-1 border border-gray-100"
                >
                  <PencilSimple size={16} weight="bold" color="#16284F" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDelete?.(issue)}
                  className="w-8 h-8 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100"
                >
                  <Trash size={16} weight="bold" color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
            <View
              style={{ backgroundColor: statusColors.bg }}
              className="px-3 py-1 rounded-sm"
            >
              <Text style={{ color: statusColors.text }} className="text-xs font-bold">
                {t(`Wellbeing_module.common.${issue.status}`, issue.status)}
              </Text>
            </View>
          </View>
          <Text className="text-xs font-semibold text-gray-600">
            {t('Wellbeing_module.common.DateReported', 'Date Reported')} : {issue.dateReported}
          </Text>
        </View>
      </View>

      <Text className="text-lg font-bold text-gray-800 mb-3">{issue.title}</Text>

      <View className="flex-row flex-wrap mb-3">
        <View className="flex-row items-center mr-4 mb-2">
          <Text className="font-semibold text-gray-700 text-sm mr-2">
            {t('Wellbeing_module.common.SubCategory', 'Sub Category')} :
          </Text>
          <View className="px-3 py-1 border border-[#D7D7D7] rounded-sm">
            <Text className="text-gray-700 font-medium text-xs">{issue.subCategory || issue.category || t('Wellbeing_module.common.NA', 'N/A')}</Text>
          </View>
        </View>
        <View className="flex-row items-center mb-2">
          <Text className="font-semibold text-gray-700 text-sm mr-2">
            {t('Wellbeing_module.common.Branch', 'Branch')} :
          </Text>
          <View className="px-3 py-1 border border-[#D7D7D7] rounded-sm">
            <Text className="text-gray-700 font-medium text-xs">{issue.branch || issue.appliesTo || t('Wellbeing_module.common.NA', 'N/A')}</Text>
          </View>
        </View>
      </View>

      <View className="mb-3">
        <Text className="font-semibold text-gray-700 text-sm mb-1">
          {t('Wellbeing_module.common.Description', 'Description')} :
        </Text>
        <Text className="text-gray-500 leading-5 text-sm">
          {issue.description}
        </Text>
      </View>

      {issue.attachments && issue.attachments.length > 0 && (
        <View className="mt-2">
          <Text className="font-semibold text-gray-700 text-sm mb-2">
            {t('Wellbeing_module.common.Attachments', 'Attachments')} :
          </Text>
          <View className="flex-row flex-wrap">
            {issue.attachments.map((file: any, index: number) => (
              <View
                key={index}
                className="flex-row items-center bg-white border border-[#D7D7D7] rounded-sm p-2 mr-3 mb-2"
              >
                <View className="mr-2">
                  <Image
                    source={require('../../../../assets/pdf.png')}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text className="text-xs font-bold text-gray-800" numberOfLines={1} style={{ maxWidth: 120 }}>
                    {file.name}
                  </Text>
                  <Text className="text-[10px] text-gray-500 font-medium">
                    {file.size || t('Wellbeing_module.common.UnknownSize', 'Unknown size')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
