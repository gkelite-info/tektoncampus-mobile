import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import { fonts } from '@/constants/fonts';
import React from "react";
import { View, TouchableOpacity, ScrollView } from 'react-native';
import {
  CalendarBlank,
  ChalkboardTeacher,
  Exam,
  VideoConference,
} from "phosphor-react-native";

interface CalendarToolbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { t } = useTranslation();
  const tabs = [
    { name: t("Calendar.faculty.allScheduled", "All Scheduled"), filterValue: "All", icon: CalendarBlank },
    { name: t("Calendar.faculty.meetings", "Meetings"), filterValue: "meeting", icon: VideoConference },
    { name: t("Calendar.faculty.classes", "Classes"), filterValue: "class", icon: ChalkboardTeacher },
    { name: t("Calendar.faculty.exams", "Exams"), filterValue: "exam", icon: Exam },
  ];

  return (
    <View className="bg-gray-50/50 rounded-xl border border-gray-200 px-4 py-2 mb-2">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16 }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.filterValue;
          const IconComponent = tab.icon;
          
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => setActiveTab(tab.filterValue)}
              className={`flex-row items-center gap-2 pb-1 border-b-2 ${
                isActive ? "border-emerald-500" : "border-transparent"
              }`}
            >
              <IconComponent
                size={18}
                color={isActive ? "#059669" : "#6B7280"}
                weight={isActive ? "fill" : "regular"}
              />
              <Text 
                className={`text-sm  ${
                  isActive ? "text-emerald-600" : "text-gray-500"
                }`}
               style={{ fontFamily: fonts.medium }}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default CalendarToolbar;
