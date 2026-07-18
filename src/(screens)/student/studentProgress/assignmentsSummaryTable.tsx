import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React from "react";
import { View, TouchableOpacity } from 'react-native';
import Svg, { Circle } from "react-native-svg";
import { CaretDown } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";
export type SubjectProgressRow = {
  subject: string;
  subjectKey: string;
  attendance: string;
  assignmentsDone: string;
  quiz: string;
  discussionForum: string;
  progressPercent: number;
};
type SubjectProgressTableProps = {
  rows: SubjectProgressRow[];
  semesterLabel: string;
  isSchool?: boolean;
};
const useTranslations = (namespace: string) => {
  return (key: string) => key;
};
function ProgressRing({
  value
}: {
  value: number;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  const ringColor = safeValue >= 75 ? "#4ABF08" : safeValue >= 50 ? "#F59E0B" : safeValue > 0 ? "#FF3B30" : "#D9DDE3";
  const size = 48;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - safeValue / 100 * circumference;
  return <View style={{
    width: size,
    height: size,
    justifyContent: "center",
    alignItems: "center",
    position: "relative"
  }}>
            <Svg width={size} height={size} style={{
      position: "absolute",
      transform: [{
        rotate: "-90deg"
      }]
    }}>
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="transparent" />
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke={ringColor} strokeWidth={strokeWidth} strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="transparent" />
            </Svg>
            <View style={{
      width: size - strokeWidth * 2,
      height: size - strokeWidth * 2,
      borderRadius: (size - strokeWidth * 2) / 2,
      backgroundColor: "white",
      justifyContent: "center",
      alignItems: "center"
    }}>
                <Text style={{
        fontSize: 10,
        color: ringColor === "#D9DDE3" ? "#9CA3AF" : ringColor,
        fontFamily: fonts.bold
      }}>
                    {safeValue}%
                </Text>
            </View>
        </View>;
}
export function AssignmentsSummaryTable({
  rows,
  semesterLabel,
  isSchool
}: SubjectProgressTableProps) {
  const {
    t
  } = useTranslation();
  return <View className="w-full bg-transparent">
            <View className="mb-3 flex-col gap-3">
                <View className="flex-row items-center justify-between">
                    <Text className="text-[14.5px] tracking-tight text-gray-800" style={{
          fontFamily: fonts.bold
        }}>
                        {t("Dashboard.student.Class Progress Overview", "Class Progress Overview")}
                    </Text>
                    {!isSchool && (
                      <TouchableOpacity activeOpacity={0.7} className="flex-row items-center gap-1.5 rounded-md bg-[#43C17A] px-3 py-1.5 shadow-sm">
                          <Text className="text-xs text-white" style={{
              fontFamily: fonts.medium
            }}>
                              {semesterLabel}
                          </Text>
                          <CaretDown size={14} weight="bold" color="white" />
                      </TouchableOpacity>
                    )}
                </View>
            </View>

            <View className="flex-col gap-3">
                {rows.length === 0 ? <View className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                        <Text className="text-sm text-gray-500 text-center" style={{
          fontFamily: fonts.regular
        }}>
                            {t("Dashboard.student.No subject progress data available for this semester", "No subject progress data available for this semester")}
                        </Text>
                    </View> : rows.map((row, index) => {
        
        return <View key={`${row.subject}-${index}`} className="bg-white rounded-xl p-4 border border-gray-100 relative shadow-sm">
                            <View className="flex-col gap-2.5">
                                <View className="flex-row items-start">
                                    <Text className="w-[125px] text-[#282828] text-[13px]" style={{
                fontFamily: fonts.semiBold
              }}>
                                        {t("Dashboard.student.Subject", "Subject")} :
                                    </Text>
                                    <Text className="flex-1 text-[#525252] text-[13px] pr-14" numberOfLines={1} style={{
                fontFamily: fonts.regular
              }}>
                                        {row.subject}
                                    </Text>
                                </View>

                                <View className="flex-row items-center">
                                    <Text className="w-[125px] text-[#282828] text-[13px]" style={{
                fontFamily: fonts.semiBold
              }}>
                                        {t("Dashboard.student.Attendance", "Attendance")} :
                                    </Text>
                                    <Text className="flex-1 text-[#525252] text-[13px]" style={{
                fontFamily: fonts.regular
              }}>
                                        {row.attendance}
                                    </Text>
                                </View>

                                <View className="flex-row items-center">
                                    <Text className="w-[125px] text-[#282828] text-[13px]" style={{
                fontFamily: fonts.semiBold
              }}>
                                        {t("Dashboard.student.Assignments Done", "Assignments Done")} :
                                    </Text>
                                    <Text className="flex-1 text-[#525252] text-[13px]" style={{
                fontFamily: fonts.regular
              }}>
                                        {row.assignmentsDone}
                                    </Text>
                                </View>

                                <View className="flex-row items-center">
                                    <Text className="w-[125px] text-[#282828] text-[13px]" style={{
                fontFamily: fonts.semiBold
              }}>
                                        {t("Dashboard.student.Quiz", "Quiz")} :
                                    </Text>
                                    <Text className="flex-1 text-[#525252] text-[13px]" style={{
                fontFamily: fonts.regular
              }}>
                                        {row.quiz}
                                    </Text>
                                </View>

                                <View className="flex-row items-center">
                                    <Text className="w-[125px] text-[#282828] text-[13px]" style={{
                fontFamily: fonts.semiBold
              }}>
                                        {t("Dashboard.student.Discussion Forum", "Discussion Forum")} :
                                    </Text>
                                    <Text className="flex-1 text-[#525252] text-[13px]" style={{
                fontFamily: fonts.regular
              }}>
                                        {row.discussionForum}
                                    </Text>
                                </View>
                            </View>

                            <View style={{
            position: "absolute",
            right: 12,
            top: 12
          }}>
                                <ProgressRing value={row.progressPercent} />
                            </View>
                        </View>;
      })}
            </View>
        </View>;
}