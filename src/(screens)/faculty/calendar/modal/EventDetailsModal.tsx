import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/AppText';
import React from "react";
import { useUser } from "@/utils/context/UserContext";
import { isSchoolEducation } from '@/lib/helpers/admin/academicSetup/schoolHelper';
import { View, TouchableOpacity, Modal, Linking } from 'react-native';
import { CalendarBlank, X } from "phosphor-react-native";
import { CalendarEvent } from "../types";

type Props = {
  open: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
};

export default function EventDetailsModal({ open, event, onClose }: Props) {
  const { t } = useTranslation();
  const { collegeEducationType } = useUser();
  const isSchool = isSchoolEducation(collegeEducationType);

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
          {}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 rounded-full bg-purple-100 items-center justify-center">
                <CalendarBlank size={20} color="#9333ea" weight="fill" />
              </View>
              <Text className="text-lg text-gray-900" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.EventDetails", "Event Details")}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 -mr-2 rounded-full bg-gray-50">
              <X size={18} color="#6b7280" weight="bold" />
            </TouchableOpacity>
          </View>

          {}
          <Text className="text-base mb-1 text-gray-900 leading-tight" style={{ fontFamily: fonts.semiBold }}>
            {event.type.charAt(0).toUpperCase() + event.type.slice(1)} -{" "}
            {event.subjectName && event.subjectName !== "-" ?
            event.subjectName :
            t("Calendar.faculty.general", "General")}{" "}
            {event.subjectKey &&
            <Text className="text-gray-500" style={{ fontFamily: fonts.medium }}>[{event.subjectKey}]</Text>
            }
          </Text>

          {event.rawFormData?.topicTitle &&
          <Text className="text-sm text-gray-600 mb-2 leading-tight" style={{ fontFamily: fonts.regular }}>
              <Text className="text-gray-800" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.EventTopic", "Event Topic:")}</Text>{" "}
              {event.rawFormData.topicTitle}
            </Text>
          }

          {event.type === "meeting" && event.title &&
          <Text className="text-sm text-gray-600 mb-2 leading-tight" style={{ fontFamily: fonts.regular }}>
              <Text className="text-gray-800" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.MeetingTitle", "Meeting Title:")}</Text> {event.title}
            </Text>
          }

          {}
          <View className="mt-3 space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <DetailRow
              label={t("Auto.Common.Type", "Type")}
              value={event.type.charAt(0).toUpperCase() + event.type.slice(1)} />
            
            <DetailRow label={t("Auto.Common.Date", "Date")} value={dateStr} />
            <DetailRow label={t("Auto.Attr.Roomno", "Room no")} value={event.rawFormData?.roomNo || "-"} />
            <DetailRow label={t("Auto.Attr.Time", "Time")} value={timeStr} />

            {event.type === "meeting" &&
            <>
                {event.rawFormData?.meetingLink &&
              <DetailRow
                label={t("Auto.Attr.Link", "Link")}
                value={event.rawFormData.meetingLink}
                isLink />

              }
                {event.rawFormData?.meetingId &&
              <DetailRow label={t("Auto.Attr.ZoomID", "Zoom ID")} value={event.rawFormData.meetingId} />
              }
                {event.rawFormData?.meetingPassword &&
              <DetailRow
                label={t("Auto.Common.Password", "Password")}
                value={event.rawFormData.meetingPassword} />

              }
              </>
            }

            <View className="mt-3 pt-3 border-t border-gray-200 gap-y-2">
              {!isSchool && (
                <DetailRow label={t("Auto.Common.Branch", "Branch")} value={event.branch} />
              )}
              <DetailRow label={t("Auto.Common.Year", "Year")} value={event.year} />
              <DetailRow label={t("Auto.Common.Section", "Section")} value={event.section} />
            </View>
          </View>
        </View>
      </View>
    </Modal>);

}

const DetailRow = ({ label, value, isLink }: {label: string;value?: string;isLink?: boolean;}) => {
  return (
    <View className="flex-row items-start mb-1.5">
      <Text className="w-24 text-gray-500 text-[13px]" style={{ fontFamily: fonts.medium }}>{label}:</Text>
      {isLink && value && value !== "-" ?
      <TouchableOpacity
        onPress={() => Linking.openURL(value.startsWith("http") ? value : `https://${value}`)}
        className="flex-1">
        
          <Text className="text-[13px] text-blue-600 underline" numberOfLines={1} style={{ fontFamily: fonts.medium }}>
            {value}
          </Text>
        </TouchableOpacity> :

      <Text className="flex-1 text-[13px] text-gray-800" style={{ fontFamily: fonts.semiBold }}>
          {value || "-"}
        </Text>
      }
    </View>);

};