import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React from "react";
import { View } from 'react-native';
import { User } from "phosphor-react-native";
import { Avatar } from "@/utils/Avatar";
import { fonts } from "@/constants/fonts";

export type ProfileCardProps = {
  name: string;
  department: string;
  studentId: string;
  avatarUrl: string | null;
  attendancePercentage: number;
  attendanceCount: number;
  absentCount: number;
  leaveCount: number;
};

export const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  department,
  studentId,
  avatarUrl,
  attendancePercentage,
  attendanceCount,
  absentCount,
  leaveCount
}) => {const { t } = useTranslation();

  return (
    <View className="bg-white w-full rounded-2xl p-3">

            <View className="flex-row items-center mb-4 gap-3">
                <Avatar
          src={avatarUrl}
          size={48}
          alt={name} />
        

                <View className="flex-1 flex-row flex-wrap items-center gap-1.5">
                    <Text className="text-[15px] text-gray-800 w-full" style={{ fontFamily: fonts.bold }}>
                        {name}
                    </Text>

                    {department && department !== "N/A" && (
                        <View className="bg-green-100 px-2 py-0.5 rounded-full">
                            <Text className="text-green-600 text-[9px]" style={{ fontFamily: fonts.semiBold }}>
                                {department}
                            </Text>
                        </View>
                    )}

                    <View className="bg-green-100 px-2 py-0.5 rounded-full">
                        <Text className="text-green-600 text-[9px]" style={{ fontFamily: fonts.semiBold }}>
                            {studentId}
                        </Text>
                    </View>
                </View>
            </View>

            <View className="flex-row gap-2 justify-between">
                <View className="flex-1 bg-green-50 rounded-lg p-2 flex-row items-center gap-2">
                    <View className="bg-green-500 w-8 h-8 rounded-md items-center justify-center shrink-0">
                        <User size={16} weight="fill" color="white" />
                    </View>
                    <View className="flex-1 justify-center">
                        <View className="flex-row items-center flex-wrap gap-1">
                            <Text className="text-[11px] text-gray-800 leading-tight" style={{ fontFamily: fonts.bold }}>
                            {attendanceCount} {t("Dashboard.student.Present", "Present")}
              </Text>
                            <Text className="text-[10px] text-[#43C17A] leading-tight" style={{ fontFamily: fonts.semiBold }}>
                                {attendancePercentage}%
                            </Text>
                        </View>
                        <Text className="text-gray-600 text-[8px] leading-tight mt-0.5" style={{ fontFamily: fonts.medium }}>
                            {t("Dashboard.student.Total Attendance", "Total Attendance")}
                        </Text>
                    </View>
                </View>

                <View className="flex-1 bg-orange-50 rounded-lg p-2 flex-row items-center gap-2">
                    <View className="bg-orange-400 w-8 h-8 rounded-md items-center justify-center shrink-0">
                        <User size={16} weight="fill" color="white" />
                    </View>
                    <View className="flex-1 justify-center">
                        <Text className="text-[11px] text-gray-800 leading-tight" style={{ fontFamily: fonts.bold }}>
                            {absentCount} {t("Dashboard.student.Absent", "Absent")}
            </Text>
                        <Text className="text-gray-600 text-[8px] leading-tight mt-0.5" style={{ fontFamily: fonts.medium }}>
                            {t("Dashboard.student.Total Absent", "Total Absent")}
                        </Text>
                    </View>
                </View>

                <View className="flex-1 bg-blue-50 rounded-lg p-2 flex-row items-center gap-2">
                    <View className="bg-blue-400 w-8 h-8 rounded-md items-center justify-center shrink-0">
                        <User size={16} weight="fill" color="white" />
                    </View>
                    <View className="flex-1 justify-center">
                        <Text className="text-[11px] text-gray-800 leading-tight" style={{ fontFamily: fonts.bold }}>
                            {leaveCount} {t("Dashboard.student.Leave", "Leave")}
            </Text>
                        <Text className="text-gray-600 text-[8px] leading-tight mt-0.5" style={{ fontFamily: fonts.medium }}>
                            {t("Dashboard.student.Total Leave", "Total Leave")}
                        </Text>
                    </View>
                </View>
            </View>
        </View>);

};