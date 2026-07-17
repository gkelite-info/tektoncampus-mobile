import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts';import { Text } from '@/components/AppText';
import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Plus, CaretDown, CaretUp } from 'phosphor-react-native';

type CalendarHeaderProps = {
  onAddClick: () => void;
  currentDate: Date;
  onMonthYearChange: (month: number, year: number) => void;
};

const getMonths = (t: any) => [
  t("Calendar.faculty.january", "January"), t("Calendar.faculty.february", "February"), t("Calendar.faculty.march", "March"), t("Calendar.faculty.april", "April"), t("Calendar.faculty.may", "May"), t("Calendar.faculty.june", "June"),
  t("Calendar.faculty.july", "July"), t("Calendar.faculty.august", "August"), t("Calendar.faculty.september", "September"), t("Calendar.faculty.october", "October"), t("Calendar.faculty.november", "November"), t("Calendar.faculty.december", "December")
];


const CalendarHeader = ({
  onAddClick,
  currentDate,
  onMonthYearChange
}: CalendarHeaderProps) => {const { t } = useTranslation();
  const MONTHS = getMonths(t);
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const BASE_YEAR = 2026;
  const currentRealYear = new Date().getFullYear();
  const endYear = currentRealYear + 3;

  const years = Array.from(
    { length: endYear - BASE_YEAR + 1 },
    (_, i) => BASE_YEAR + i
  );

  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);

  return (
    <View className="flex-row items-center justify-between gap-2 mb-4">
            <View className="flex-row items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                
                {}
                <TouchableOpacity
          className="flex-row items-center justify-between px-3 py-1.5"
          onPress={() => setIsMonthModalOpen(true)}>
          
                    <Text className="text-sm text-gray-700 mr-2" style={{ fontFamily: fonts.semiBold }}>
                        {MONTHS[currentMonth]}
                    </Text>
                    <CaretDown size={14} color="#6B7280" weight="bold" />
                </TouchableOpacity>

                <View className="w-px h-5 bg-gray-300 mx-1" />

                {}
                <TouchableOpacity
          className="flex-row items-center justify-between px-3 py-1.5"
          onPress={() => setIsYearModalOpen(true)}>
          
                    <Text className="text-sm text-gray-700 mr-2" style={{ fontFamily: fonts.semiBold }}>
                        {currentYear}
                    </Text>
                    <CaretDown size={14} color="#6B7280" weight="bold" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
        onPress={onAddClick}
        className="flex-row items-center gap-1.5 px-4 py-2 bg-[#43C17A] rounded-lg shadow-sm">
        
                <Plus size={16} color="white" weight="bold" />
                <Text className="text-white text-sm" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.AddNew", "Add New")}</Text>
            </TouchableOpacity>

            {}
            <Modal visible={isMonthModalOpen} transparent animationType="fade">
                <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setIsMonthModalOpen(false)}>
          
                    <View className="bg-white w-4/5 rounded-xl max-h-[60%]">
                        <FlatList
              data={MONTHS}
              keyExtractor={(item) => item}
              renderItem={({ item, index }) =>
              <TouchableOpacity
                className={`p-4 border-b border-gray-100 ${index === currentMonth ? 'bg-emerald-50' : ''}`}
                onPress={() => {
                  onMonthYearChange(index, currentYear);
                  setIsMonthModalOpen(false);
                }}>
                
                                    <Text className={`text-center ${index === currentMonth ?'text-emerald-600 ' : 'text-gray-700'}`} style={{ fontFamily: fonts.bold }}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
              } />
            
                    </View>
                </TouchableOpacity>
            </Modal>

            {}
            <Modal visible={isYearModalOpen} transparent animationType="fade">
                <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setIsYearModalOpen(false)}>
          
                    <View className="bg-white w-4/5 rounded-xl max-h-[60%]">
                        <FlatList
              data={years}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) =>
              <TouchableOpacity
                className={`p-4 border-b border-gray-100 ${item === currentYear ? 'bg-emerald-50' : ''}`}
                onPress={() => {
                  onMonthYearChange(currentMonth, item);
                  setIsYearModalOpen(false);
                }}>
                
                                    <Text className={`text-center ${item === currentYear ?'text-emerald-600 ' : 'text-gray-700'}`} style={{ fontFamily: fonts.bold }}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
              } />
            
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>);

};

export default CalendarHeader;