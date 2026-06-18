import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState } from 'react';
import { View, TouchableOpacity, Image, LayoutAnimation, UIManager, Platform } from 'react-native';
import { Book, CalendarDots, Trash, CaretDown, PencilSimple } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import ConfirmDeleteModal from './ConfirmDeleteModal';


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface Assignment {
  sectionId: string | number | readonly string[] | undefined;
  assignmentId?: number;
  image: string;
  title: string;
  description: string;
  fromDate: string | number;
  toDate: string | number;
  totalSubmissions: string;
  totalSubmitted: string;
  marks: string | number;
}

function formatDate(dateValue: number | string) {
  if (!dateValue) return '';

  const str = dateValue.toString();

  if (/^\d{8}$/.test(str)) {
    const year = str.substring(0, 4);
    const month = str.substring(4, 6);
    const day = str.substring(6, 8);
    return `${day}/${month}/${year}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-');
    return `${day}/${month}/${year}`;
  }

  return str;
}

type AssignmentCardProps = {
  cardProp: Assignment[];
  activeView: 'active' | 'previous';
  onEdit: (assignment: Assignment) => void;
  onDelete: (id: number) => Promise<void> | void;
};

export default function AssignmentCard({
  cardProp,
  activeView,
  onEdit,
  onDelete
}: AssignmentCardProps) {
  const navigation = useNavigation<any>();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View className="flex-col gap-3">
      {cardProp.map((item, index) => {
        const isExpanded = expandedIndex === index;

        return (
          <View key={index} className="w-full bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-3">
            <View className="flex-row gap-3">
              <View className="w-[70px] h-[70px] rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-gray-100">
                <Image
                  source={require('../../../../../assets/icon.png')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover" />
                
              </View>

              <View className="flex-1 flex-col py-0.5 justify-between">
                <View className="flex-row justify-between items-start w-full">
                  <View className="flex-1">
                    <Text className="text-[#282828] font-bold text-[15px] leading-tight" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-gray-800 text-[13px] font-medium mt-0.5 leading-snug" numberOfLines={1}>
                      {item.description}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1.5 shrink-0 ml-2">
                    <TouchableOpacity
                      onPress={() => onEdit(item)}
                      className="w-[24px] h-[24px] rounded-full border border-[#43C17A] flex items-center justify-center">
                      
                      <PencilSimple size={12} color="#43C17A" />
                    </TouchableOpacity>
                    {activeView === 'active' &&
                    <TouchableOpacity
                      onPress={() => setDeleteId(item.assignmentId ?? null)}
                      className="w-[24px] h-[24px] rounded-full border border-red-500 flex items-center justify-center">
                      
                        <Trash size={12} color="#EF4444" />
                      </TouchableOpacity>
                    }
                    <TouchableOpacity
                      onPress={() => toggleExpand(index)}
                      className="w-[24px] h-[24px] rounded-full bg-[#43C17A] flex items-center justify-center shadow-sm">
                      
                      <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
                        <CaretDown size={14} weight="bold" color="white" />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-row justify-between items-center w-full mt-2">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[10px] text-gray-500 font-medium">{t("Auto.Common.Submissions", "Submissions:")}</Text>
                    <View className="bg-[#E2F3E9] px-2 py-0.5 rounded-full">
                      <Text className="text-[#43C17A] text-[10px] font-bold">
                        {item.totalSubmitted} / {item.totalSubmissions}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('AssignmentSubmissions', { assignmentId: item.assignmentId })}>
                    
                    <Text className="text-[#43C17A] text-[11px] font-semibold underline">{t("Auto.Common.ViewSubmissions", "View Submissions")}

                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {isExpanded &&
            <View className="mt-2 border-t border-gray-100 pt-2 w-full flex-row justify-between items-center">
                <View className="flex-row items-center gap-1.5">
                  <CalendarDots size={14} color="#43C17A" />
                  <Text className="text-[10px] text-gray-600">
                    {formatDate(item.fromDate)} - {formatDate(item.toDate)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Text className="font-semibold text-[#16284F] text-[10px]">{t("Auto.Common.TotalMarks", "Total Marks:")}</Text>
                  <View className="bg-[#16284F] px-2 py-0.5 rounded">
                    <Text className="text-white font-bold text-[10px]">{item.marks ?? 0}</Text>
                  </View>
                </View>
              </View>
            }
          </View>);

      })}

      {deleteId !== null &&
      <ConfirmDeleteModal
        open={true}
        isDeleting={isDeleting}
        name="assignment"
        onCancel={() => {
          if (!isDeleting) setDeleteId(null);
        }}
        onConfirm={async () => {
          if (deleteId) {
            setIsDeleting(true);
            await onDelete(deleteId);
            setIsDeleting(false);
            setDeleteId(null);
          }
        }} />

      }
    </View>);

}