import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React from 'react';
import { View } from 'react-native';
const MockScreen = ({
  name
}: {
  name: string;
}) => {
  const {
    t
  } = useTranslation();
  return <View className="flex-1 items-center justify-center bg-gray-50">
    <Text className="text-2xl font-bold text-gray-800">{name}{t("Auto.Common.Screen", "Screen")}</Text>
    <Text className="text-gray-500 mt-2">{t("Auto.Common.Thisisaplacehol", "This is a placeholder for the")}{name}{t("Auto.Common.feature", "feature.")}</Text>
  </View>;
};
export const AcademicsScreen = () => <MockScreen name="Academics" />;
export const StudentProgressScreen = () => <MockScreen name="Student Progress" />;
export const ProjectsScreen = () => <MockScreen name="Projects" />;
export const PlacementsScreen = () => <MockScreen name="Placements" />;
export const LeaveRequestsScreen = () => <MockScreen name="Leave Requests" />;
export const ClubScreen = () => <MockScreen name="Club" />;
export const DriveScreen = () => <MockScreen name="Drive" />;
export const MeetingsScreen = () => <MockScreen name="Meetings" />;
export const MyAttendanceScreen = () => <MockScreen name="My Attendance" />;
export const WellbeingScreen = () => <MockScreen name="Wellbeing" />;
export const SettingsScreen = () => <MockScreen name="Settings" />;