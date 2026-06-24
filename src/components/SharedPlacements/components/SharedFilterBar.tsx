import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { CaretDown, X, Check } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";
import { useTranslations } from "@/utils/useTranslations";
export interface FilterOption {
  label: string;
  value: string;
}
export interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  isLoading?: boolean;
}
interface SharedFilterBarProps {
  filters: FilterConfig[];
}
export default function SharedFilterBar({
  filters
}: SharedFilterBarProps) {
  const {
    t
  } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterConfig | null>(null);
  const renderPickerModal = () => {
    
    if (!activeFilter) return null;
    return <Modal transparent visible={true} animationType="slide" onRequestClose={() => setActiveFilter(null)}>
                <TouchableOpacity activeOpacity={1} className="flex-1 bg-black/40 justify-end" onPress={() => setActiveFilter(null)}>
                    <View className="bg-white rounded-t-3xl max-h-[70%] min-h-[40%]">
                        <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
                            <Text className="text-lg text-[#1E293B]" style={{
              fontFamily: fonts.bold
            }}>
                                {t("Select {label}", {
                label: activeFilter.label
              })}
                            </Text>
                            <TouchableOpacity onPress={() => setActiveFilter(null)} className="p-2 bg-slate-50 rounded-full">
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        
                        <FlatList data={activeFilter.options} keyExtractor={item => item.value} contentContainerStyle={{
            padding: 10
          }} renderItem={({
            item
          }) => {
            const isSelected = item.value === activeFilter.selectedValue;
            return <TouchableOpacity onPress={() => {
              activeFilter.onSelect(item.value);
              setActiveFilter(null);
            }} className={`flex-row items-center justify-between p-4 rounded-xl mb-1 ${isSelected ? 'bg-emerald-50' : 'bg-transparent'}`}>
                                        <Text className={`${isSelected ? 'text-[#43C17A]' : 'text-[#334155]'} text-base`} style={{
                 fontFamily: isSelected ? fonts.semiBold : fonts.medium
               }}>
                                             {item.label}
                                         </Text>
                                         {isSelected && <Check size={20} color="#43C17A" weight="bold" />}
                                     </TouchableOpacity>;
           }} />
                     </View>
                 </TouchableOpacity>
             </Modal>;
   };
   return <View className="mb-4">
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{
       paddingRight: 20
     }}>
                 {filters.map(filter => {
         const selectedLabel = filter.options.find(o => o.value === filter.selectedValue)?.label || filter.label;
         return <TouchableOpacity key={filter.id} onPress={() => setActiveFilter(filter)} disabled={filter.isLoading} className={`flex-row items-center bg-white border ${filter.selectedValue && filter.selectedValue !== "All" ? 'border-[#43C17A] bg-emerald-50' : 'border-slate-200'} rounded-full px-4 py-2 mr-3`}>
                             <Text className={`text-sm mr-2 ${filter.selectedValue && filter.selectedValue !== "All" ? 'text-[#43C17A]' : 'text-slate-600'}`} style={{
             fontFamily: fonts.medium
           }}>
                                 {filter.isLoading ? t("Loading...") : selectedLabel}
                             </Text>
                             <CaretDown size={14} color={filter.selectedValue && filter.selectedValue !== "All" ? '#43C17A' : '#64748B'} />
                         </TouchableOpacity>;
       })}
            </ScrollView>
            
            {renderPickerModal()}
        </View>;
}