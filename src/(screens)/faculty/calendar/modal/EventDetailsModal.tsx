import React from "react";
import { View, Text, TouchableOpacity, Modal, Linking } from "react-native";
import { CalendarBlank, X } from "phosphor-react-native";
import { CalendarEvent } from "../types";

type Props = {
  open: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
};

export default function EventDetailsModal({ open, event, onClose }: Props) {
  if (!open || !event) return null;

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

  const dateStr = `${start.getDate().toString().padStart(2, '0')}/${(start.getMonth() + 1).toString().padStart(2, '0')}/${start.getFullYear()}`;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-center items-center px-4">
        <View className="w-full max-w-[420px] bg-white rounded-2xl p-5 shadow-xl">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 rounded-full bg-purple-100 items-center justify-center">
                <CalendarBlank size={20} color="#9333ea" weight="fill" />
              </View>
              <Text className="text-lg font-semibold text-gray-900">Event Details</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 -mr-2 rounded-full bg-gray-50">
              <X size={18} color="#6b7280" weight="bold" />
            </TouchableOpacity>
          </View>

          {/* Title / Subject */}
          <Text className="font-semibold text-base mb-1 text-gray-900 leading-tight">
            {event.type.charAt(0).toUpperCase() + event.type.slice(1)} -{" "}
            {event.subjectName && event.subjectName !== "-"
              ? event.subjectName
              : "General"}{" "}
            {event.subjectKey && (
              <Text className="text-gray-500 font-medium">[{event.subjectKey}]</Text>
            )}
          </Text>

          {event.rawFormData?.topicTitle && (
            <Text className="text-sm text-gray-600 mb-2 leading-tight">
              <Text className="font-medium text-gray-800">Event Topic:</Text>{" "}
              {event.rawFormData.topicTitle}
            </Text>
          )}

          {event.type === "meeting" && event.title && (
            <Text className="text-sm text-gray-600 mb-2 leading-tight">
              <Text className="font-medium text-gray-800">Meeting Title:</Text> {event.title}
            </Text>
          )}

          {/* Details Box */}
          <View className="mt-3 space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <DetailRow
              label="Type"
              value={event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            />
            <DetailRow label="Date" value={dateStr} />
            <DetailRow label="Room no" value={event.rawFormData?.roomNo || "-"} />
            <DetailRow label="Time" value={timeStr} />

            {event.type === "meeting" && (
              <>
                {event.rawFormData?.meetingLink && (
                  <DetailRow
                    label="Link"
                    value={event.rawFormData.meetingLink}
                    isLink
                  />
                )}
                {event.rawFormData?.meetingId && (
                  <DetailRow label="Zoom ID" value={event.rawFormData.meetingId} />
                )}
                {event.rawFormData?.meetingPassword && (
                  <DetailRow
                    label="Password"
                    value={event.rawFormData.meetingPassword}
                  />
                )}
              </>
            )}

            <View className="mt-3 pt-3 border-t border-gray-200 gap-y-2">
              <DetailRow label="Branch" value={event.branch} />
              <DetailRow label="Year" value={event.year} />
              <DetailRow label="Section" value={event.section} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const DetailRow = ({ label, value, isLink }: { label: string; value?: string; isLink?: boolean }) => {
  return (
    <View className="flex-row items-start mb-1.5">
      <Text className="w-24 text-gray-500 font-medium text-[13px]">{label}:</Text>
      {isLink && value && value !== "-" ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(value.startsWith("http") ? value : `https://${value}`)}
          className="flex-1"
        >
          <Text className="text-[13px] font-medium text-blue-600 underline" numberOfLines={1}>
            {value}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text className="flex-1 text-[13px] font-semibold text-gray-800">
          {value || "-"}
        </Text>
      )}
    </View>
  );
};
