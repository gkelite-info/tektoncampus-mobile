import { useTranslation } from 'react-i18next'; import { Text } from '@/components/AppText';
import React, { useEffect, useState } from "react";
import { isSchoolEducation } from '@/lib/helpers/admin/academicSetup/schoolHelper';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Platform, Modal } from 'react-native';
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretLeft, List, X } from "phosphor-react-native";
import tw from "twrnc";

import { supabase } from "@/lib/supabaseClient";
import { fetchStudentContext } from "@/utils/context/student/studentContextAPI";
import { getStudentProgressData } from "@/lib/helpers/student/studentProgress/getStudentProgressData";

import { ProfileCard } from "@/(screens)/student/studentProgress/profileCard";
import AcademicPerformance from "@/utils/AcademicPerformance";
import { fonts } from "@/constants/fonts";
import { StudentProgressSkeleton } from "@/(screens)/student/studentProgress/shimmer/studentProgressSkeleton";
import { AttendanceSummaryCard } from "@/(screens)/student/studentProgress/attendanceSummaryCard";
import { AssignmentsSummaryTable } from "@/(screens)/student/studentProgress/assignmentsSummaryTable";
import { AttendanceList } from "@/(screens)/student/studentProgress/attendanceBySubjectCard";
import CourseScheduleCard from "@/utils/CourseScheduleCard";
import { useHeaderHeight } from "@react-navigation/elements";

type ParamList = {
  StudentProgressDetails: {
    rollNo: string;
    studentId?: number;
  };
};

export default function StudentProgressDetailsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, "StudentProgressDetails">>();
  const studentId = route.params?.studentId;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [progressData, setProgressData] = useState<Awaited<ReturnType<typeof getStudentProgressData>> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  let headerHeight = 0;
  try {
    headerHeight = useHeaderHeight();
  } catch (e) { }

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!studentId) {
      setErrorMsg("studentId is missing in route params.");
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadStudentData() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const { data: studentData, error: studentErr } = await supabase.
          from("students").
          select("userId, batch").
          eq("studentId", studentId!).
          single();

        if (studentErr || !studentData) throw studentErr || new Error("Student not found for studentId: " + studentId);

        const [context, userRow, userProfile, progress] = await Promise.all([
          fetchStudentContext(studentData.userId),
          supabase.from("users").select("fullName").eq("userId", studentData.userId).single(),
          supabase.from("user_profile").select("profileUrl").eq("userId", studentData.userId).maybeSingle(),
          getStudentProgressData(studentData.userId)]
        );

        if (mounted) {
          setStudentInfo({
            userId: studentData.userId,
            fullName: userRow.data?.fullName || "Student",
            profilePhoto: userProfile.data?.profileUrl || null,
            identifierId: studentData.batch || String(studentId),
            ...context
          });
          setProgressData(progress);
        }
      } catch (err: any) {
        console.error("Failed to load student progress details:", err);
        if (mounted) setErrorMsg(err?.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStudentData();

    return () => {
      mounted = false;
    };
  }, [studentId]);

  if (loading) {
    return <StudentProgressSkeleton />;
  }

  if (errorMsg || !studentInfo || !progressData) {
    return (
      <View style={[tw`flex-1 items-center justify-center bg-[#F9FAFB]`, { paddingTop: insets.top }]}>
        <Text style={[{ fontFamily: fonts.medium }, tw`text-red-500  mb-2`]}>{t("Auto.Common.Failedtoloadstu", "Failed to load student progress")}</Text>
        <Text style={[{ fontFamily: fonts.regular }, tw`text-gray-600 text-center px-4`]}>{errorMsg}</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate("StudentProgress")} style={tw`mt-4 bg-[#43C17A] px-4 py-2 rounded-lg`}>
          <Text style={[{ fontFamily: fonts.semiBold }, tw`text-white `]}>{t("Auto.Common.GoBack", "Go Back")}</Text>
        </TouchableOpacity>
      </View>);

  }

  const semesterLabel = studentInfo.collegeSemester
    ? `${t("StudentProgress.faculty.semester", "Semester")} ${studentInfo.collegeSemester}`
    : t("StudentProgress.faculty.semesterNA", "Semester N/A");

  return (
    <SafeAreaView style={[tw`flex-1 bg-[#f4f5f6]`, { paddingTop: Math.max(headerHeight + 16, insets.top + 16) }]}>
      <StatusBar barStyle="dark-content" />

      <View style={tw`px-4 pb-2 flex-row items-center`}>
        <TouchableOpacity onPress={() => (navigation as any).navigate("StudentProgress")} style={tw`mr-3 bg-white p-2 rounded-full shadow-sm`}>
          <CaretLeft size={20} color="#374151" weight="bold" />
        </TouchableOpacity>
        <Text style={[tw`text-xl text-gray-800`, { fontFamily: fonts.bold }]}>{t("Auto.Common.StudentDetails", "Student Details")}</Text>
      </View>

      <ScrollView
        style={tw`flex-1 px-2`}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>

        <View style={tw`flex-row p-1 gap-2 items-center justify-between w-full mb-2`}>
          <View style={tw`flex-1 max-w-5xl mr-2`}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={tw`flex-row pb-1`}
              contentContainerStyle={tw`gap-2`}>

              {!isSchoolEducation(studentInfo.collegeEducationType) && (
                <View style={tw`flex-row items-center`}>
                  <Text style={[tw`text-gray-600 text-[13px]`, { fontFamily: fonts.medium }]}>
                    {studentInfo.collegeEducationType === "Inter"
                      ? t("StudentProgress.faculty.group", "Group")
                      : t("StudentProgress.faculty.branch", "Branch")} :
                  </Text>
                  <View style={tw`bg-[#43C17A]/10 px-2 py-0.5 rounded-full ml-1`}>
                    <Text style={[tw`text-[#43C17A] text-[11px] tracking-wide`, { fontFamily: fonts.semiBold }]}>
                      {studentInfo.collegeBranchCode ?? "N/A"}
                    </Text>
                  </View>
                </View>
              )}

              <View style={tw`flex-row items-center`}>
                <Text style={[tw`text-gray-600 text-[13px] ml-1`, { fontFamily: fonts.medium }]}>{t("Auto.Common.Year", "Year :")}

                </Text>
                <View style={tw`bg-[#43C17A]/10 px-2 py-0.5 rounded-full ml-1`}>
                  <Text style={[tw`text-[#43C17A] text-[11px]`, { fontFamily: fonts.semiBold }]}>
                    {studentInfo.collegeAcademicYear ?? "N/A"}
                  </Text>
                </View>
              </View>

              <View style={tw`flex-row items-center`}>
                <Text style={[tw`text-gray-600 text-[13px] ml-1`, { fontFamily: fonts.medium }]}>{t("Auto.Common.Section", "Section:")}

                </Text>
                <View style={tw`bg-[#43C17A]/10 px-2 py-0.5 rounded-full ml-1`}>
                  <Text style={[tw`text-[#43C17A] text-[11px]`, { fontFamily: fonts.semiBold }]}>
                    {studentInfo.collegeSections ?? "N/A"}
                  </Text>
                </View>
              </View>

              {!isSchoolEducation(studentInfo.collegeEducationType) && (
                <View style={tw`flex-row items-center`}>
                  <Text style={[tw`text-gray-600 text-[13px] ml-1`, { fontFamily: fonts.medium }]}>{t("Auto.Common.Semester", "Semester:")}
                  </Text>
                  <View style={tw`bg-[#43C17A]/10 px-2 py-0.5 rounded-full ml-1`}>
                    <Text style={[tw`text-[#43C17A] text-[11px]`, { fontFamily: fonts.semiBold }]}>
                      {studentInfo.collegeSemester ?? "N/A"}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={tw`w-8 h-8 rounded-full bg-[#43C17A]/10 items-center justify-center`}
            onPress={() => setOpen(true)}>

            <List size={18} weight="bold" color="#374151" />
          </TouchableOpacity>
        </View>

        {Platform.OS === 'web' &&
          <View style={tw`hidden lg:flex justify-end w-[32%] mb-4`}>
            <CourseScheduleCard style="w-[320px]" />
          </View>
        }

        <View style={tw`flex-col gap-4`}>
          <View style={tw`bg-white rounded-2xl shadow-sm`}>
            <ProfileCard
              name={studentInfo.fullName ?? "Student"}
              department={studentInfo.collegeBranchCode ?? "N/A"}
              studentId={studentInfo.identifierId ?? "N/A"}
              avatarUrl={studentInfo.profilePhoto}
              attendancePercentage={progressData?.overallAttendancePercentage ?? 0}
              attendanceCount={progressData?.attendedCount ?? 0}
              absentCount={progressData?.absentCount ?? 0}
              leaveCount={progressData?.leaveCount ?? 0} />

          </View>

          <View style={tw`bg-white rounded-2xl shadow-sm p-3`}>
            <AttendanceSummaryCard
              percentage={progressData?.overallAttendancePercentage ?? 0}
              attendedCount={progressData?.attendedCount ?? 0}
              conductedCount={progressData?.conductedCount ?? 0} />

          </View>

          <AcademicPerformance studentId={studentId!} />

          <View style={tw`bg-white rounded-2xl`}>
            <AttendanceList data={progressData?.subjectAttendance || []} />
          </View>

          <View style={tw`bg-transparent`}>
            <AssignmentsSummaryTable
              rows={progressData?.subjectProgressRows ?? []}
              semesterLabel={semesterLabel}
              isSchool={isSchoolEducation(studentInfo.collegeEducationType)} />

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
          style={tw`flex-1 bg-black/20 justify-center items-center`}
          onPress={() => setOpen(false)}>

          <View style={tw`bg-white rounded-xl shadow-lg w-[260px] border border-gray-200 overflow-hidden`}>
            <View style={tw`flex-row items-center justify-between px-4 py-3 border-b border-gray-100`}>
              <Text style={[tw`text-sm text-gray-800`, { fontFamily: fonts.semiBold }]}>{t("Auto.Common.PreviousSemMark", "Previous Sem Marks")}

              </Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <X size={18} weight="bold" color="#4b5563" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={tw`w-full px-4 py-3 active:bg-gray-50`}
              onPress={() => setOpen(false)}>

              <Text style={[tw`text-sm text-gray-700`, { fontFamily: fonts.regular }]}>{t("Auto.Common.Enrollment", "Enrollment")}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>);

}