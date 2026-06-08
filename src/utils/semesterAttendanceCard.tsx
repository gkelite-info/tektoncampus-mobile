import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { CalendarCheck } from "phosphor-react-native";

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
      <View className="h-32 flex-1 min-w-[256px] rounded-xl p-3 bg-[#E9FFF0] flex-col justify-between shadow-sm">
        <View className="flex-row justify-between mb-2 items-center">
          <View className="flex-row items-center gap-2">
            <View className="bg-[#43C17A] w-9 h-8 rounded flex items-center justify-center">
              <CalendarCheck size={24} color="#EFEFEF" weight="fill" />
            </View>
            <Text className="text-[#282828] font-semibold">
              {t("Semester Attendance")}
            </Text>
          </View>
          <Text className="text-[#43C17A] text-2xl font-bold">{overallPercent}%</Text>
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
              <Text style={{ color: bar.fill }} className="text-xs mt-1 font-medium">
                {bar.percent}%
              </Text>
            </View>
          ))}
        </View>

        <View className="w-full flex-row justify-between items-center mt-1">
          {bars.map((bar, index) => (
            <View key={index} className="flex-row justify-start items-center gap-1">
              <View style={{ backgroundColor: bar.fill }} className="h-3 w-3 rounded-sm" />
              <Text className="text-xs text-black">{bar.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="w-full rounded-xl p-3 bg-[#E9FFF0] flex-col shadow-sm gap-2">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-2">
          <View className="bg-[#43C17A] w-7 h-7 rounded flex items-center justify-center">
            <CalendarCheck size={18} color="#EFEFEF" weight="fill" />
          </View>
          <Text className="text-[#282828] font-semibold text-sm">
            {t("Semester Attendance")}
          </Text>
        </View>
      </View>

      <View className="flex-col gap-2">

        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 h-2.5 rounded-full overflow-hidden bg-[#BFF5D2]">
            <View
              style={{ width: `${overallPercent}%` }}
              className="h-full rounded-full bg-[#43C17A]"
            />
          </View>
          <Text className="text-[#43C17A] text-xs font-semibold w-10 text-right">
            {overallPercent}%
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 h-2.5 rounded-full overflow-hidden bg-[#FFD6D6]">
            <View
              style={{ width: `${absentPercent}%` }}
              className="h-full rounded-full bg-[#FF2020]"
            />
          </View>
          <Text className="text-[#FF2020] text-xs font-semibold w-10 text-right">
            {absentPercent}%
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 h-2.5 rounded-full overflow-hidden bg-[#FFE7C2]">
            <View
              style={{ width: `${leavePercent}%` }}
              className="h-full rounded-full bg-[#FFBB70]"
            />
          </View>
          <Text className="text-[#FFBB70] text-xs font-semibold w-10 text-right">
            {leavePercent}%
          </Text>
        </View>

      </View>
    </View>
  );
}