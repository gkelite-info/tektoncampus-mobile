import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState } from "react";
import { View, TouchableOpacity, Modal, Linking } from 'react-native';
import { Laptop, PencilSimple, Trash, X } from "phosphor-react-native";
import PillTag from "./PillTag";
import { Avatar } from "@/components/Avatar";
import { useTranslations } from "@/utils/useTranslations";
import { isSchoolEducation } from "@/lib/helpers/admin/academicSetup/schoolHelper";

const formatToAMPM = (timeStr: string) => {
  if (!timeStr) return "";
  const [hourStr, minuteStr] = timeStr.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${minuteStr} ${ampm}`;
};

export default function MeetingCard({
  data,
  onDelete,
  role,
  category,
  onEdit






}: {data: any;onDelete?: (meeting: any) => void;role: string | null;category?: string | null;onEdit?: (meeting: number, sectionId: number | null) => void;}) {const { t } = useTranslation();
  const [fromTime, toTime] = data.timeRange.split(" - ");
  const formattedTimeRange = `${formatToAMPM(fromTime)} - ${formatToAMPM(toTime)}`;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isSchool = isSchoolEducation(data.educationType);

  const isEditable = ["Wellbeing Manager", "Finance"].includes(role || "");

  const handleJoinMeeting = () => {
    if (data.meetingLink) {
      Linking.openURL(data.meetingLink);
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsModalOpen(true)}
        className="bg-gray-50 rounded-t-xl rounded-b-md border border-gray-100 overflow-hidden flex-col mb-3">
        
        <View className="bg-[#43C17A26] px-3 py-2 flex-row items-center justify-between border-b-2 border-dotted border-[#43C17A]">
          <View className="flex-row gap-2 items-center justify-center">
            <View className="bg-[#43C17A] p-1 rounded-full">
              <Laptop size={18} weight="fill" color="#E9E9E9" />
            </View>
            <Text className="text-[#11934A] font-medium text-[15px]">
              {formattedTimeRange}
            </Text>
          </View>

          <View className="bg-[#43C17A] px-3 py-0.5 rounded-full">
            <Text className="text-white text-xs font-medium">{data.date}</Text>
          </View>

          {data.type === "upcoming" && isEditable &&
          <View className="flex-row gap-1.5 items-center justify-center">
              <TouchableOpacity
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white"
              onPress={() => {
                onEdit?.(data.financeMeetingId, data.financeMeetingSectionsId);
              }}>
              
                <PencilSimple size={14} weight="fill" color="#43C17A" />
              </TouchableOpacity>
              <TouchableOpacity
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white"
              onPress={() => {
                onDelete?.(data);
              }}>
              
                <Trash size={14} weight="fill" color="#FF0000" />
              </TouchableOpacity>
            </View>
          }
        </View>

        <View className="p-3 flex-1 flex-col gap-2">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-2">
              <Text className="text-[#43C17A] font-semibold text-base" numberOfLines={1}>
                {data.title}
              </Text>
            </View>

            {(category && category !== "Admin" ||
            role && !["Admin", "Finance"].includes(role)) &&
            <View className="bg-[#22c55e] px-2 py-0.5 rounded-full">
                <Text className="text-[#ffffff] text-[10px]">
                  {data.branch} - {data.section}
                </Text>
              </View>
            }
          </View>

          <View className="flex-col gap-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-[#303030] text-sm">{t("Auto.Common.By", "By :")}</Text>
              <View className="flex-row items-center gap-1.5 bg-[#E2E6ED] pl-1 pr-2.5 py-0.5 rounded-full">
                <Avatar
                  src={(data as any).hostImage || null}
                  alt={(data as any).hostName || "Dr. Anil Kumar"}
                  size={16} />
                
                <Text className="text-xs text-[#16284F]">
                  {(data as any).hostName || "Dr. Anil Kumar"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between mt-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-[#303030] text-sm">{t("Auto.Common.Subject", "Subject :")}</Text>
                <View className="bg-[#E2E6ED] px-2.5 py-1 rounded-full">
                  <Text className="text-[#16284F] text-[11px] font-medium">
                    {(data as any).subject || t("SharedMeetings.subject.general", "General")}
                  </Text>
                </View>
              </View>
              {role !== "Wellbeing Manager" &&
              <TouchableOpacity
                className={`px-4 py-1.5 rounded-full items-center justify-center ${
                data.type === "previous" ? "bg-[#CDCDCD]" : "bg-[#16284F]"}`
                }
                onPress={() => {
                  if (data.type !== "previous") {
                    handleJoinMeeting();
                  }
                }}>
                
                  <Text
                  className={`text-xs font-semibold ${
                  data.type === "previous" ? "text-[#414141]" : "text-white"}`
                  }>
                  
                    {data.type === "previous" ? t("SharedMeetings.status.completed", "Completed") : t("SharedMeetings.status.joinMeeting", "Join Meeting")}
                  </Text>
                </TouchableOpacity>
              }
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <Modal visible={isModalOpen} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsModalOpen(false)}
          className="flex-1 items-center justify-center px-4"
          style={{ backgroundColor: "rgba(62, 61, 61, 0.64)" }}>
          
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-xl w-full max-w-lg overflow-hidden relative p-5 py-4"
            style={{ elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10 }}>
            
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-[#282828]">
                {data.title}
              </Text>

              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                className="p-1 rounded-full">
                
                <X size={20} weight="bold" color="#282828" />
              </TouchableOpacity>
            </View>
            <Text className="text-sm text-[#282828] mb-6">
              {data.description}
            </Text>

            <View className="flex-col gap-y-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-[#303030] font-medium text-sm">
                  {t("SharedMeetings.details.role", "Role :")}
                </Text>
                <PillTag label={(t("SharedMeetings.category." + (data as any).category, (data as any).category) as string) || (t("SharedMeetings.details.na", "N/A") as string)} />
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-[#303030] font-medium text-sm">
                  {t("SharedMeetings.details.date", "Date :")}
                </Text>
                <PillTag label={data.date || t("SharedMeetings.details.na", "N/A")} />
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[#303030] font-medium text-sm">
                  {t("SharedMeetings.details.time", "Time :")}
                </Text>
                <PillTag label={formattedTimeRange} />
              </View>

              {(category && category !== "Admin" ||
              role && !["Admin", "Finance"].includes(role)) &&
              <>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[#303030] font-medium text-sm">
                      {isSchool ? t("SharedMeetings.details.school", "School :") : t("SharedMeetings.details.branch", "Branch :")}
                    </Text>
                    <PillTag label={data.branch || t("SharedMeetings.details.na", "N/A")} />
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[#303030] font-medium text-sm">
                      {isSchool ? t("SharedMeetings.details.class", "Class :") : t("SharedMeetings.details.year", "Year :")}
                    </Text>
                    <PillTag label={data.year || t("SharedMeetings.details.na", "N/A")} />
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-[#303030] font-medium text-sm">
                      {t("SharedMeetings.details.section", "Section :")}
                    </Text>
                    <PillTag label={data.section || t("SharedMeetings.details.na", "N/A")} />
                  </View>
                </>
              }
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>);

}