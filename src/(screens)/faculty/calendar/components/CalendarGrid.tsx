import { Text } from '@/components/AppText';
import { fonts } from '@/constants/fonts';
import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { CaretLeft, CaretRight } from "phosphor-react-native";
import { CalendarEvent, WeekDay } from "../types";
import { getEventStyle, getOverlappingEvents } from "../utils";
import EventCard from "./EventCard";
import { TIME_SLOTS } from "../calenderData";

interface CalendarGridProps {
  events: CalendarEvent[];
  weekDays: WeekDay[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  activeTab: string;
  onDeleteRequest: (event: CalendarEvent) => void;
  onEditRequest: (event: CalendarEvent) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  events,
  weekDays,
  onPrevWeek,
  onNextWeek,
  activeTab,
  onDeleteRequest,
  onEditRequest,
  onEventClick,
}) => {
  const matchesFilter = (event: CalendarEvent): boolean => {
    if (activeTab === "All") {
      return true;
    }
    return event.type.toLowerCase() === activeTab.toLowerCase();
  };

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const todayIndex = weekDays.findIndex((wd) => wd.fullDate === todayStr);
    setSelectedDayIndex(todayIndex !== -1 ? todayIndex : 0);
  }, [weekDays]);

  const handlePrevDay = () => {
    if (selectedDayIndex > 0) {
      setSelectedDayIndex(prev => prev - 1);
    } else {
      onPrevWeek();
      setSelectedDayIndex(weekDays.length - 1);
    }
  };

  const handleNextDay = () => {
    if (selectedDayIndex < weekDays.length - 1) {
      setSelectedDayIndex(prev => prev + 1);
    } else {
      onNextWeek();
      setSelectedDayIndex(0);
    }
  };

  const selectedDayObj = weekDays[selectedDayIndex];

  return (
    <View className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {}
      <View className="flex-row items-center border-b border-gray-200 py-3 bg-gray-50">
        <TouchableOpacity onPress={handlePrevDay} className="p-3 mx-2">
          <CaretLeft size={20} color="#374151" weight="bold" />
        </TouchableOpacity>
        
        <View className="flex-1 flex-row items-center justify-center px-1">
          <Text 
            className="text-sm uppercase tracking-wider text-slate-800 text-center"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
           style={{ fontFamily: fonts.bold }}>
            {selectedDayObj?.day} {selectedDayObj?.date}
          </Text>
        </View>

        <TouchableOpacity onPress={handleNextDay} className="p-3 mx-2">
          <CaretRight size={20} color="#374151" weight="bold" />
        </TouchableOpacity>
      </View>

      {}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="flex-row min-h-[720px]">
          {}
          <View className="w-16 border-r border-gray-200 bg-white">
            {TIME_SLOTS.map((time, i) => (
              <View
                key={time}
                className="h-[120px] items-center pt-2 border-b border-gray-100 border-dashed"
              >
                <Text className="text-[10px] text-gray-400" style={{ fontFamily: fonts.medium }}>
                  {time}
                </Text>
              </View>
            ))}
          </View>

          {}
          <View className="flex-1 relative">
            {}
            <View className="absolute inset-0 z-0">
              {TIME_SLOTS.map((_, i) => (
                <View
                  key={i}
                  className="h-[120px] w-full border-b border-gray-200"
                />
              ))}
            </View>

            {}
            {selectedDayObj && (
              <View className="absolute inset-0 z-10">
                {getOverlappingEvents(
                  Array.from(
                    new Map(
                      events
                        .filter((e) => e.startTime.startsWith(selectedDayObj.fullDate))
                        .filter(matchesFilter)
                        .map((e) => [
                          `${e.id}-${e.startTime}-${e.endTime}`,
                          e,
                        ])
                    ).values()
                  )
                ).map((event) => {
                  const position = getEventStyle(event);
                  const baseWidth = 100 / event.overlapTotal;
                  let width = baseWidth;
                  let left = baseWidth * event.overlapIndex;

                  return (
                    <View
                      key={`${event.id}-${event.startTime}-${event.endTime}`}
                      style={{
                        position: "absolute",
                        top: Number(position.top),
                        height: Number(position.height),
                        width: `${width}%`,
                        left: `${left}%`,
                      }}
                      className="px-0.5 py-0.5"
                    >
                      <EventCard
                        event={event}
                        onDelete={() => onDeleteRequest(event)}
                        onEdit={() => onEditRequest(event)}
                        onClick={() => onEventClick(event)}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default CalendarGrid;
