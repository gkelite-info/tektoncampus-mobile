import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React from "react";
import { View, ScrollView, useWindowDimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Loader } from "../calendar/right/timetable";
import CourseScheduleCard from "@/utils/CourseScheduleCard";
import SubjectCard from "./components/subjectCard";
import { StudentProvider, useStudent } from "@/lib/helpers/student/academics/studentFetchAcademics";
import SubjectSkeleton from "./shimmer/subjectSkeleton";
import { fonts } from "@/constants/fonts";
const useTranslations = (namespace: string) => {
  return (key: string) => key;
};
function AcademicsContent() {
  const {
    t
  } = useTranslation();
  const {
    studentProfile,
    subjects,
    loading,
    refreshData
  } = useStudent();
  const {
    width
  } = useWindowDimensions();
  const headerHeight = useHeaderHeight();
  const isLargeScreen = width >= 1024;
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);
  return <ScrollView className="flex-1" contentContainerStyle={{
    padding: 8,
    paddingTop: headerHeight + 8,
    paddingBottom: isLargeScreen ? 20 : 100
  }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} alwaysBounceVertical={true} overScrollMode="always">

    <View className="flex-row justify-between items-center mb-5">
      <View style={{
        width: "68%"
      }} className="flex-col">
        <Text className="text-[#282828] text-[28px] mb-1" style={{
          fontFamily: fonts.bold
        }}>
          {t("Academicss")}
        </Text>

        {isLargeScreen ? <Text className="text-[#282828] text-sm" style={{
          fontFamily: fonts.regular
        }}>
          {t("Track syllabus progress and manage notes by semester")}
        </Text> : <Text className="text-[#282828] text-sm" style={{
          fontFamily: fonts.regular
        }}>
          {t("Track syllabus progress and manage notes")}
        </Text>}
      </View>

      {isLargeScreen && <View style={{
        width: "32%"
      }} className="justify-end flex-row">
        <CourseScheduleCard department={loading ? "..." : studentProfile?.department || "N/A"} degree={loading ? "..." : studentProfile?.degree || "N/A"} year={loading ? "..." : studentProfile?.year || "N/A"} style="w-[320px]" />

      </View>}
    </View>

    <View className={isLargeScreen ? "mt-4" : ""}>
      {loading ? <SubjectSkeleton /> : <SubjectCard subjectProps={subjects} />}
    </View>
  </ScrollView>;
}
export default function StudentAcademics() {
  const {
    t
  } = useTranslation();
  return <StudentProvider>
    <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1">
      <React.Suspense fallback={<View className="flex-1 items-center justify-center py-10">
        {Loader ? <Loader /> : <ActivityIndicator size="small" color="#6b7280" />}
        <Text className="text-sm text-gray-500 mt-2">{t("Auto.Common.LoadingAcademic", "Loading Academics...")}</Text>
      </View>}>

        <AcademicsContent />
      </React.Suspense>
    </SafeAreaView>
  </StudentProvider>;
}