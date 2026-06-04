import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
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
  const tabs = [
    { name: "All Scheduled", filterValue: "All", icon: CalendarBlank },
    { name: "Meetings", filterValue: "meeting", icon: VideoConference },
    { name: "Classes", filterValue: "class", icon: ChalkboardTeacher },
    { name: "Exams", filterValue: "exam", icon: Exam },
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
                className={`text-sm font-medium ${
                  isActive ? "text-emerald-600" : "text-gray-500"
                }`}
              >
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
