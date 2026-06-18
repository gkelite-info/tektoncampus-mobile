import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React from "react";
import { View, useWindowDimensions } from 'react-native';
import { CalendarCheck } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";

const useTranslations = (namespace: string) => {
  return (key: string) => key;
};

interface SemesterAttendanceCardProps {
  presentPercent?: number;
  absentPercent?: number;
  leavePercent?: number;
  overallPercent?: number;
}

export default function SemesterAttendanceCard({
  presentPercent = 0,
  absentPercent = 0,
  leavePercent = 0,
  overallPercent = 0
}: SemesterAttendanceCardProps) {const { t } = useTranslation();

  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;

  const bars = [
  {
    label: t("Present"),
    percent: presentPercent,
    bg: "#BFF5D2",
    fill: "#43C17A"
  },
  {
    label: t("Absent"),
    percent: absentPercent,
    bg: "#FFD6D6",
    fill: "#FF2020"
  },
  {
    label: t("Leave"),
    percent: leavePercent,
    bg: "#FFE7C2",
    fill: "#FFBB70"
  }];


  if (isTabletOrDesktop) {
    return (
      <View className="h-32 flex-1 min-w-[256px] p-3 bg-[#E9FFF0] flex-col justify-between shadow-sm">
        <View className="flex-row justify-between mb-2 items-center">
          <View className="flex-row items-center gap-2">
            <View className="bg-[#43C17A] w-9 h-8 rounded flex items-center justify-center">
              <CalendarCheck size={24} color="#EFEFEF" weight="fill" />
            </View>
            <Text className="text-[#282828] font-semibold" style={{ fontFamily: fonts.bold }}>
              {t("Semester Attendance")}
            </Text>
          </View>
          <Text className="text-[#43C17A] text-2xl font-bold" style={{ fontFamily: fonts.bold }}>{overallPercent}%</Text>
        </View>

        <View className="flex-row items-end justify-between gap-2">
          {bars.map((bar, index) =>
          <View key={index} className="flex-1">
              <View
              style={{ backgroundColor: bar.bg }}
              className="h-2 w-full rounded-full overflow-hidden">
              
                <View
                style={{
                  width: `${bar.percent}%`,
                  backgroundColor: bar.fill
                }}
                className="h-full rounded-full" />
              
              </View>
              <Text style={{ color: bar.fill, fontFamily: fonts.medium }} className="text-xs mt-1">
                {bar.percent}%
              </Text>
            </View>
          )}
        </View>

        <View className="w-full flex-row justify-between items-center mt-1">
          {bars.map((bar, index) =>
          <View key={index} className="flex-row justify-start items-center gap-1">
              <View style={{ backgroundColor: bar.fill }} className="h-3 w-3 rounded-sm" />
              <Text className="text-xs text-black" style={{ fontFamily: fonts.regular }}>{bar.label}</Text>
            </View>
          )}
        </View>
      </View>);

  }

  return (
    <View className="w-full rounded-xl p-4 bg-[#E9FFF0] flex-col shadow-sm gap-4">
      {}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="bg-[#43C17A] w-10 h-10 rounded-full items-center justify-center">
            <CalendarCheck size={20} color="#FFFFFF" weight="fill" />
          </View>
          <Text className="text-[#282828] text-[15px]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.SemesterAttenda", "Semester Attendance")}

          </Text>
        </View>
        <Text className="text-[#43C17A] text-[20px]" style={{ fontFamily: fonts.bold }}>
          {overallPercent}%
        </Text>
      </View>

      {}
      <View className="flex-row gap-3">
        {}
        <View className="flex-1 flex-col gap-1">
          <View className="flex-row justify-between items-center">
            <Text className="text-[#43C17A] text-[11px]" style={{ fontFamily: fonts.bold }}>
              {t("Present")}
            </Text>
            <Text className="text-[#282828] text-[11px]" style={{ fontFamily: fonts.medium }}>
              {presentPercent}%
            </Text>
          </View>
          <View className="h-2 w-full rounded-full overflow-hidden bg-[#BFF5D2]">
            <View
              style={{ width: `${presentPercent}%` }}
              className="h-full rounded-full bg-[#43C17A]" />
            
          </View>
        </View>

        {}
        <View className="flex-1 flex-col gap-1">
          <View className="flex-row justify-between items-center">
            <Text className="text-[#FF2020] text-[11px]" style={{ fontFamily: fonts.bold }}>
              {t("Absent")}
            </Text>
            <Text className="text-[#282828] text-[11px]" style={{ fontFamily: fonts.medium }}>
              {absentPercent}%
            </Text>
          </View>
          <View className="h-2 w-full rounded-full overflow-hidden bg-[#FFD6D6]">
            <View
              style={{ width: `${absentPercent}%` }}
              className="h-full rounded-full bg-[#FF2020]" />
            
          </View>
        </View>

        {}
        <View className="flex-1 flex-col gap-1">
          <View className="flex-row justify-between items-center">
            <Text className="text-[#FFBB70] text-[11px]" style={{ fontFamily: fonts.bold }}>
              {t("Leave")}
            </Text>
            <Text className="text-[#282828] text-[11px]" style={{ fontFamily: fonts.medium }}>
              {leavePercent}%
            </Text>
          </View>
          <View className="h-2 w-full rounded-full overflow-hidden bg-[#FFE7C2]">
            <View
              style={{ width: `${leavePercent}%` }}
              className="h-full rounded-full bg-[#FFBB70]" />
            
          </View>
        </View>
      </View>
    </View>);

}