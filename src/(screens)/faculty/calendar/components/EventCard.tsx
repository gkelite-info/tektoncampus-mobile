import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  ChalkboardTeacher,
  Exam,
  Question,
  Trash,
  PencilSimple,
  VideoConference,
} from "phosphor-react-native";
import { CalendarEvent, EventType } from "../types";

const EVENT_STYLES: Record<
  EventType,
  { solidBg: string; lightBg: string; text: string; Icon: any }
> = {
  meeting: {
    solidBg: "#E2DAFF",
    lightBg: "#E2DAFF8F",
    text: "#6C20CA",
    Icon: VideoConference,
  },
  class: {
    solidBg: "#96CAFF",
    lightBg: "#D9EBFF",
    text: "#0056AD",
    Icon: ChalkboardTeacher,
  },
  exam: {
    solidBg: "#FFD8AF",
    lightBg: "#FFEDDA",
    text: "#FB8000",
    Icon: Exam,
  },
  quiz: {
    solidBg: "#BFE8D5",
    lightBg: "#E6F6EF",
    text: "#1E7F5C",
    Icon: Question,
  },
};

const EventCard = ({
  event,
  onDelete,
  onEdit,
  onClick,
}: {
  event: CalendarEvent;
  onDelete: () => void;
  onEdit: () => void;
  onClick: () => void;
}) => {
  const style =
    EVENT_STYLES[event.type.toLowerCase() as EventType] ||
    EVENT_STYLES.meeting;

  const Icon = style.Icon;

  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  const formatTime = (d: Date) => {
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
  };

  const timeStr = `${formatTime(start)} - ${formatTime(end)}`;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onClick}
      className="flex-1 rounded-md overflow-hidden"
    >
      {}
      <View
        className="flex-row items-center p-2 border-b border-dashed"
        style={{
          backgroundColor: style.solidBg,
          borderColor: style.text,
        }}
      >
        <View
          className="w-5 h-5 rounded-full items-center justify-center mr-1.5"
          style={{ backgroundColor: style.text }}
        >
          <Icon size={12} weight="fill" color="#ffffff" />
        </View>

        <Text 
          className="text-[10px] font-bold tracking-wide uppercase"
          style={{ color: style.text }}
        >
          {timeStr}
        </Text>

        <View className="flex-row ml-auto gap-2">
            <TouchableOpacity 
              onPress={(e) => {
                onEdit();
              }}
              className="bg-white/50 rounded-full p-1"
            >
              <PencilSimple size={12} color="#2563EB" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={(e) => {
                onDelete();
              }}
              className="bg-white/50 rounded-full p-1"
            >
              <Trash size={12} color="#DC2626" />
            </TouchableOpacity>
        </View>
      </View>

      {}
      <View
        className="flex-1 p-2"
        style={{ backgroundColor: style.lightBg }}
      >
        <Text
          className="text-xs font-semibold leading-tight mb-2"
          numberOfLines={2}
          style={{ color: style.text }}
        >
          {event.title}
        </Text>

        <View
          className="w-full border-t mb-1"
          style={{ borderColor: style.text, opacity: 0.3 }}
        />

        <Text 
          className="text-[10px] font-medium" 
          numberOfLines={1}
          style={{ color: style.text }}
        >
          {event.branch} {event.year ? `- ${event.year}` : ''} {event.section ? `- ${event.section}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default EventCard;
