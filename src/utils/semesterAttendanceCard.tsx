import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
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
  overallPercent = 0,
}: SemesterAttendanceCardProps) {
  const t = useTranslations("Attendance.student");

  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 768;

  const bars = [
    {
      label: t("Present"),
      percent: presentPercent,
      bg: "#BFF5D2",
      fill: "#43C17A",
    },
    {
      label: t("Absent"),
      percent: absentPercent,
      bg: "#FFD6D6",
      fill: "#FF2020",
    },
    {
      label: t("Leave"),
      percent: leavePercent,
      bg: "#FFE7C2",
      fill: "#FFBB70",
    },
  ];

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
          {bars.map((bar, index) => (
            <View key={index} className="flex-1">
              <View
                style={{ backgroundColor: bar.bg }}
                className="h-2 w-full rounded-full overflow-hidden"
              >
                <View
                  style={{
                    width: `${bar.percent}%`,
                    backgroundColor: bar.fill,
                  }}
                  className="h-full rounded-full"
                />
              </View>
              <Text style={{ color: bar.fill, fontFamily: fonts.medium }} className="text-xs mt-1">
                {bar.percent}%
              </Text>
            </View>
          ))}
        </View>

        <View className="w-full flex-row justify-between items-center mt-1">
          {bars.map((bar, index) => (
            <View key={index} className="flex-row justify-start items-center gap-1">
              <View style={{ backgroundColor: bar.fill }} className="h-3 w-3 rounded-sm" />
              <Text className="text-xs text-black" style={{ fontFamily: fonts.regular }}>{bar.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="w-full rounded-xl p-4 bg-[#E9FFF0] flex-col shadow-sm gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="bg-[#43C17A] w-11 h-11 rounded-full items-center justify-center">
            <CalendarCheck size={22} color="#FFFFFF" weight="fill" />
          </View>
          <View className="flex-col justify-center">
            <Text className="text-[#282828] text-[15px] leading-tight" style={{ fontFamily: fonts.bold }}>
              Semester
            </Text>
            <Text className="text-[#282828] text-[15px] leading-tight" style={{ fontFamily: fonts.bold }}>
              Attendance
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-col gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 h-3 rounded-full overflow-hidden bg-[#BFF5D2]">
            <View
              style={{ width: `${overallPercent}%` }}
              className="h-full rounded-full bg-[#43C17A]"
            />
          </View>
          <Text className="text-[#43C17A] text-[15px] w-12 text-right" style={{ fontFamily: fonts.bold }}>
            {overallPercent}%
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 h-3 rounded-full overflow-hidden bg-[#FFD6D6]">
            <View
              style={{ width: `${absentPercent}%` }}
              className="h-full rounded-full bg-[#FF2020]"
            />
          </View>
          <Text className="text-[#FF2020] text-[15px] w-12 text-right" style={{ fontFamily: fonts.bold }}>
            {absentPercent}%
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 h-3 rounded-full overflow-hidden bg-[#FFE7C2]">
            <View
              style={{ width: `${leavePercent}%` }}
              className="h-full rounded-full bg-[#FFBB70]"
            />
          </View>
          <Text className="text-[#FFBB70] text-[15px] w-12 text-right" style={{ fontFamily: fonts.bold }}>
            {leavePercent}%
          </Text>
        </View>
      </View>
    </View>
  );
}