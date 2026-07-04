import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Modal, StatusBar, Platform } from 'react-native';
import { List, X } from "phosphor-react-native";
import { ProfileCard } from "./profileCard";
import AcademicPerformance from "@/utils/AcademicPerformance";
import { fonts } from "@/constants/fonts";
import { StudentProgressSkeleton } from "./shimmer/studentProgressSkeleton";
import { AttendanceSummaryCard } from "./attendanceSummaryCard";
import { AssignmentsSummaryTable } from "./assignmentsSummaryTable";
import { AttendanceList } from "./attendanceBySubjectCard";
import CourseScheduleCard from "@/utils/CourseScheduleCard";
import { getStudentProgressData } from "@/lib/helpers/student/studentProgress/getStudentProgressData";
import { useHeaderHeight } from "@react-navigation/elements";
import { useTargetStudentDetails } from "@/lib/helpers/shared/useTargetStudentDetails";


export default function SharedStudentProgress({ targetUserId }: { targetUserId: number }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressData, setProgressData] = useState<Awaited<
    ReturnType<typeof getStudentProgressData>> |
  null>(null);

  const {
    userId,
    studentId,
    fullName,
    profilePhoto,
    identifierId,
    collegeEducationType,
    collegeBranchCode,
    collegeAcademicYear,
    college_sections,
    collegeSemester,
    userLoading,
    studentLoading
  } = useTargetStudentDetails(targetUserId);

  const semesterLabel = collegeSemester ?
  `${t("Dashboard.student.Semester", "Semester")} ${collegeSemester}` :
  `${t("Dashboard.student.Semester", "Semester")} ${t("Dashboard.student.N/A", "N/A")}`;

  const isLoading = userLoading || studentLoading || progressLoading;

  const headerHeight = useHeaderHeight();



  useEffect(() => {
    if (userLoading || studentLoading) return;
    if (!userId) {
      setProgressLoading(false);
      return;
    }

    const safeUserId = userId;
    let mounted = true;

    async function loadProgressData() {
      setProgressLoading(true);
      try {
        const data = await getStudentProgressData(safeUserId);
        if (mounted) {
          setProgressData(data);
        }
      } finally {
        if (mounted) {
          setProgressLoading(false);
        }
      }
    }

    loadProgressData();

    return () => {
      mounted = false;
    };
  }, [userId, userLoading, studentLoading]);

  if (isLoading) {
    return <StudentProgressSkeleton />;
  }

  return (
    <View className="flex-1 bg-[#f4f5f6] pb-10" style={{ paddingTop: headerHeight }}>
            <StatusBar barStyle="dark-content" />
            <ScrollView
        className="flex-1 p-2"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}>
        
                <View className="flex-row p-1 gap-2 items-center justify-between w-full mb-2">
                    <View className="flex-1 max-w-5xl mr-2">
                        <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row gap-2 pb-1">
              
                            <View className="flex-row items-center">
                                <Text className="text-gray-600 text-[13px]" style={{ fontFamily: fonts.medium }}>
                                    {collegeEducationType === "Inter" ? t("Dashboard.student.GroupLabel", "Group:") : t("Dashboard.student.BranchLabel", "Branch:")}
                                </Text>
                                <View className="bg-[#43C17A1C] px-2 py-0.5 rounded-full ml-1">
                                    <Text className="text-[#43C17A] text-[11px] tracking-wide" style={{ fontFamily: fonts.semiBold }}>
                                        {collegeBranchCode ?? t("Dashboard.student.N/A", "N/A")}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row items-center">
                                <Text className="text-gray-600 text-[13px] ml-1" style={{ fontFamily: fonts.medium }}>{t("Dashboard.student.YearLabel", "Year:")}
                </Text>
                                <View className="bg-[#43C17A1C] px-2 py-0.5 rounded-full ml-1">
                                    <Text className="text-[#43C17A] text-[11px]" style={{ fontFamily: fonts.semiBold }}>
                                        {collegeAcademicYear ?? t("Dashboard.student.N/A", "N/A")}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row items-center">
                                <Text className="text-gray-600 text-[13px] ml-1" style={{ fontFamily: fonts.medium }}>{t("Dashboard.student.SectionLabel", "Section:")}
                </Text>
                                <View className="bg-[#43C17A1C] px-2 py-0.5 rounded-full ml-1">
                                    <Text className="text-[#43C17A] text-[11px]" style={{ fontFamily: fonts.semiBold }}>
                                        {college_sections ?? t("Dashboard.student.N/A", "N/A")}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row items-center">
                                <Text className="text-gray-600 text-[13px] ml-1" style={{ fontFamily: fonts.medium }}>{t("Dashboard.student.SemesterLabel", "Semester:")}
                </Text>
                                <View className="bg-[#43C17A1C] px-2 py-0.5 rounded-full ml-1">
                                    <Text className="text-[#43C17A] text-[11px]" style={{ fontFamily: fonts.semiBold }}>
                                        {collegeSemester ?? t("Dashboard.student.N/A", "N/A")}
                                    </Text>
                                </View>
                            </View>
                        </ScrollView>
                    </View>

                    <TouchableOpacity
            activeOpacity={0.7}
            className="w-8 h-8 rounded-full bg-[#43C17A1A] items-center justify-center"
            onPress={() => setOpen(true)}>
            
                        <List size={18} weight="bold" color="#374151" />
                    </TouchableOpacity>
                </View>

                {Platform.OS === 'web' &&
        <View className="hidden lg:flex justify-end w-[32%] mb-4">
                        <CourseScheduleCard style="w-[320px]" />
                    </View>
        }

                <View className="flex-col gap-4">
                    <View className="bg-white rounded-2xl shadow-sm">
                        <ProfileCard
              name={fullName ?? t("Dashboard.student.Student", "Student")}
              department={collegeBranchCode ?? t("Dashboard.student.N/A", "N/A")}
              studentId={identifierId ?? t("Dashboard.student.N/A", "N/A")}
              avatarUrl={profilePhoto}
              attendancePercentage={progressData?.overallAttendancePercentage ?? 0}
              attendanceCount={progressData?.attendedCount ?? 0}
              absentCount={progressData?.absentCount ?? 0}
              leaveCount={progressData?.leaveCount ?? 0} />
            
                    </View>

                    <View className="bg-white rounded-2xl shadow-sm p-3">
                        <AttendanceSummaryCard
              percentage={progressData?.overallAttendancePercentage ?? 0}
              attendedCount={progressData?.attendedCount ?? 0}
              conductedCount={progressData?.conductedCount ?? 0} />
            
                    </View>

                    <AcademicPerformance 
                        studentId={studentId} 
                        translations={{
                            title: t('Dashboard.student.Academic Performance', 'Academic Performance'),
                            calculating: t('Dashboard.student.Calculating performance', 'Calculating performance...'),
                            failed: t('Dashboard.student.Failed to load performance', 'Failed to load performance')
                        }} 
                    />

                    <View className="bg-white rounded-2xl">
                        <AttendanceList data={progressData?.subjectAttendance || []} />
                    </View>

                    <View className="bg-transparent">
                        <AssignmentsSummaryTable
              rows={progressData?.subjectProgressRows ?? []}
              semesterLabel={semesterLabel} />
            
                    </View>
                </View>
            </ScrollView>

            <Modal
        visible={open}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        
                <TouchableOpacity
          activeOpacity={1}
          className="flex-1 bg-black/20 justify-center items-center"
          onPress={() => setOpen(false)}>
          
                    <View className="bg-white rounded-xl shadow-lg w-[260px] border border-gray-200 overflow-hidden">
                        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                            <Text className="text-sm text-gray-800" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.PreviousSemMark", "Previous Sem Marks")}

              </Text>
                            <TouchableOpacity onPress={() => setOpen(false)}>
                                <X size={18} weight="bold" color="#4b5563" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
              className="w-full text-left px-4 py-3 active:bg-gray-50"
              onPress={() => {
                setOpen(false);
              }}>
              
                            <Text className="text-sm text-gray-700" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Enrollment", "Enrollment")}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>);

};