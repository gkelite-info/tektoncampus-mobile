import React from 'react';
import { View, Text } from 'react-native';

const MockScreen = ({ name }: { name: string }) => (
  <View className="flex-1 items-center justify-center bg-gray-50">
    <Text className="text-2xl font-bold text-gray-800">{name} Screen</Text>
    <Text className="text-gray-500 mt-2">This is a placeholder for the {name} feature.</Text>
  </View>
);

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
