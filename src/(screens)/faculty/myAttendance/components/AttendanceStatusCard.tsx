import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { FC } from "react";
import { View } from 'react-native';
import { CheckSquare } from "phosphor-react-native";
import { AttendanceStats } from "../types";
import { fonts } from "@/constants/fonts";

interface Props {
  stats: AttendanceStats;
}

export const STATUS_STYLES: Record<string, string> = {
  PRESENT: "bg-[#22C55E]",
  ABSENT: "bg-[#EF4444]",
  LEAVE: "bg-[#60AEFF]",
  LATE: "bg-[#FFBE61]"
};

export const STATUS_COLORS: Record<string, string> = {
  PRESENT: "#22C55E",
  ABSENT: "#EF4444",
  LEAVE: "#60AEFF",
  LATE: "#FFBE61"
};

const AttendanceStatusCard: FC<Props> = ({ stats }) => {const { t } = useTranslation();
  const statusKey = stats.todayStatus?.toUpperCase?.() || "NOT MARKED";
  const iconColor = STATUS_COLORS[statusKey] || "#9CA3AF";

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 w-full md:flex-1 md:w-auto ml-0 md:ml-4 flex-row flex-wrap justify-between md:flex-col md:justify-start">
      <View className="w-1/2 md:w-full mb-3 md:mb-4">
        <Text className="text-[#282828] text-[13px] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.AttendanceStatu", "Attendance Status (Today)")}</Text>
        <View className="flex-row items-center mt-1">
          <CheckSquare size={16} weight="fill" color={iconColor} />
          <Text className="text-gray-700 text-[13px] ml-1.5" style={{ fontFamily: fonts.regular }}>{stats.todayStatus || "Not marked"}</Text>
        </View>
      </View>

      <View className="w-1/2 md:w-full mb-3 md:mb-4">
        <Text className="text-[#282828] text-[13px] mb-0.5" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.TotalWorkingDay", "Total Working Days")}</Text>
        <Text className="text-[#525252] text-[13px]" style={{ fontFamily: fonts.regular }}>{stats.totalWorkingDays}</Text>
      </View>

      <View className="w-1/2 md:w-full mb-3 md:mb-4">
        <Text className="text-[#282828] text-[13px] mb-0.5" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.LeavesTaken", "Leaves Taken")}</Text>
        <Text className="text-[#525252] text-[13px]" style={{ fontFamily: fonts.regular }}>{stats.leavesTaken}</Text>
      </View>

      <View className="w-1/2 md:w-full mb-3 md:mb-0">
        <Text className="text-[#282828] text-[13px] mb-0.5" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.RemainingLeaves", "Remaining Leaves")}</Text>
        <Text className="text-[#525252] text-[13px]" style={{ fontFamily: fonts.regular }}>{stats.remainingLeaves}</Text>
      </View>
    </View>);

};

export default AttendanceStatusCard;