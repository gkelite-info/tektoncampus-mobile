import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "twrnc";
import { ChartLineDown, UserCircle, UsersThree, CaretDown } from "phosphor-react-native";
import { Picker } from "@react-native-picker/picker";
import { useFaculty } from "@/utils/context/faculty/useFaculty";
import { getFacultyStudentProgressSummary } from "@/lib/helpers/faculty/studentProgress/getFacultyStudentProgressSummary";

import CardComponent from "./components/stuPerfCards";
import PerformanceTrendChart from "./components/performanceTrendChart";
import TopFivePerformers from "./components/topFivePerformers";
import { StudentDataTable } from "./components/studentDataTable";


type StudentProgressSummary = Awaited<ReturnType<typeof getFacultyStudentProgressSummary>>;

const defaultSummary: StudentProgressSummary = {
  totalStudents: 0,
  tableTotalCount: 0,
  presentToday: 0,
  lowAttendance: 0,
  markedStudents: [],
  studentRows: [],
  topPerformerRows: [],
  trendData: [],
  departmentLabel: "N/A",
  subjectLabel: "N/A",
  yearLabel: "N/A",
  sectionLabel: "N/A",
  semesterLabel: "N/A"
};

export default function FacultyStudentProgressScreen() {const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    loading: facultyLoading,
    collegeId,
    collegeEducationId,
    collegeBranchId,
    college_branch,
    academicYearIds,
    sectionIds,
    subjectIds,
    faculty_subject,
    sections,
    collegeAcademicYear,
    facultyId
  } = useFaculty();

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState<StudentProgressSummary>(defaultSummary);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSectionId, setSelectedSectionId] = useState<number | "all">("all");
  const [debugError, setDebugError] = useState<string | null>(null);
  const rowsPerPage = 10;

  const uniqueSections = useMemo(() => {
    const map = new Map<number, string>();
    sections.forEach((s) => {
      if (s.college_sections?.collegeSections) {
        map.set(s.collegeSectionsId, s.college_sections.collegeSections);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sections]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (facultyLoading) return;

    if (!collegeId || !facultyId || !collegeEducationId || !collegeBranchId) {
      setSummary(defaultSummary);
      setSummaryLoading(false);
      return;
    }

    let mounted = true;

    const loadSummary = async () => {
      setSummaryLoading(true);
      setDebugError(null);

      const resolvedSectionIds = selectedSectionId === "all" ? sectionIds : [selectedSectionId];
      const subjectName = faculty_subject && faculty_subject.length > 0 ? faculty_subject[0].subjectName : "N/A";

      try {
        const data = await getFacultyStudentProgressSummary({
          facultyId,
          collegeId,
          collegeEducationId,
          collegeBranchId,
          academicYearIds,
          sectionIds: resolvedSectionIds,
          subjectIds,
          departmentLabel: college_branch,
          subjectLabel: subjectName,
          page: currentPage,
          pageSize: rowsPerPage,
          searchQuery: debouncedSearchQuery
        });

        if (mounted) {
          setSummary(data);
        }
      } catch (error: any) {
        console.error("Failed to load faculty student progress summary", error);
        if (mounted) {
          setDebugError(error.message || JSON.stringify(error));
          setSummary(defaultSummary);
        }
      } finally {
        if (mounted) {
          setSummaryLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      mounted = false;
    };
  }, [
  facultyLoading,
  collegeId,
  facultyId,
  collegeEducationId,
  collegeBranchId,
  academicYearIds,
  sectionIds,
  subjectIds,
  faculty_subject,
  college_branch,
  currentPage,
  rowsPerPage,
  debouncedSearchQuery,
  selectedSectionId]
  );

  const subjectNameUI = faculty_subject && faculty_subject.length > 0 ? faculty_subject[0].subjectName : "N/A";
  const yearNameUI = collegeAcademicYear || "N/A";

  const subtitle = `Monitor and compare overall student performance`;

  const topPerformers = useMemo(
    () =>
    [...summary.topPerformerRows].
    filter((student) => student.progressPercent > 0).
    sort((a, b) => {
      if (b.progressPercent !== a.progressPercent) {
        return b.progressPercent - a.progressPercent;
      }
      return b.attendancePercentage - a.attendancePercentage;
    }).
    slice(0, 5).
    map((student) => ({
      id: String(student.studentId),
      name: student.studentName,
      avatar: student.profileUrl,
      score: student.progressPercent
    })),
    [summary.topPerformerRows]
  );

  const totalPages = Math.max(1, Math.ceil(summary.tableTotalCount / rowsPerPage));

  const cardData = [
  {
    value: summary.totalStudents.toString(),
    label: "Total Students",
    bgColor: "bg-[#FFEDDA]",
    icon: <UsersThree size={24} color="#FFBB70" weight="fill" />,
    iconBgColor: "bg-[#FFBB70]/20"
  },
  {
    value: summary.presentToday.toString(),
    label: "Present Today",
    bgColor: "bg-[#E6FBEA]",
    icon: <UserCircle size={24} color="#43C17A" weight="fill" />,
    iconBgColor: "bg-[#43C17A]/20"
  },
  {
    value: summary.lowAttendance.toString(),
    label: "Low Attendance",
    bgColor: "bg-[#FFE0E0]",
    icon: <ChartLineDown size={24} color="#FF2020" weight="fill" />,
    iconBgColor: "bg-[#FF2020]/20"
  }];


  if (facultyLoading) {
    return (
      <View style={[tw`flex-1 bg-[#F9FAFB] items-center justify-center`, { paddingTop: insets.top + 105 }]}>
        <ActivityIndicator size="large" color="#43C17A" />
      </View>);

  }

  return (
    <View style={[tw`flex-1 bg-[#F9FAFB]`, { paddingTop: insets.top + 105 }]}>
      <ScrollView style={tw`flex-1 px-4`} contentContainerStyle={tw`pb-20`}>
        {debugError &&
        <View style={tw`bg-red-100 p-4 rounded mb-4`}>
            <Text style={tw`text-red-600 font-bold`}>{t("Auto.Common.Errorfetchingda", "Error fetching data:")}</Text>
            <Text style={tw`text-red-500 text-xs`}>{debugError}</Text>
          </View>
        }

        {}
        <View style={tw`mb-4 flex-col justify-between items-start`}>
          <View style={tw`w-full`}>
            <Text style={tw`text-xl md:text-2xl font-bold text-black`} numberOfLines={1}>{t("Auto.Common.StudentProgress", "Student Progress Overview")}

            </Text>
            <Text style={tw`text-sm text-gray-500 mt-1`} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>

        {}
        <View style={tw`mb-4 flex-row flex-wrap items-center gap-4`}>
          <View style={tw`flex-col gap-1 w-[45%]`}>
            <Text style={tw`text-xs font-semibold text-gray-500 uppercase tracking-wide`}>{t("Auto.Common.Subject", "Subject")}</Text>
            <View style={tw`bg-[#43C17A]/10 px-3 py-2 rounded-xl`}>
              <Text style={tw`text-[#43C17A] text-xs font-bold`} numberOfLines={1}>{subjectNameUI}</Text>
            </View>
          </View>

          <View style={tw`flex-col gap-1 w-[25%]`}>
            <Text style={tw`text-xs font-semibold text-gray-500 uppercase tracking-wide`}>{t("Auto.Common.Year", "Year")}</Text>
            <View style={tw`bg-[#43C17A]/10 px-3 py-2 rounded-xl`}>
              <Text style={tw`text-[#43C17A] text-xs font-bold`} numberOfLines={1}>{yearNameUI}</Text>
            </View>
          </View>

          <View style={tw`flex-col gap-1 flex-1`}>
            <Text style={tw`text-xs font-semibold text-gray-500 uppercase tracking-wide`}>{t("Auto.Common.Sec", "Sec")}</Text>
            <View style={tw`bg-white border border-gray-200 rounded-xl overflow-hidden h-[32px] justify-center`}>
              <Picker
                selectedValue={selectedSectionId}
                onValueChange={(itemValue) => setSelectedSectionId(itemValue)}
                style={tw`text-xs font-bold text-gray-800 bg-transparent`}
                itemStyle={tw`text-xs font-bold`}>
                
                <Picker.Item label={t("Auto.Attr.All", "All")} value="all" />
                {uniqueSections.map((sec) =>
                <Picker.Item key={sec.id} label={sec.name} value={sec.id} />
                )}
              </Picker>
            </View>
          </View>
        </View>

        {summaryLoading && summary.totalStudents === 0 && summary.studentRows.length === 0 ?
        <View style={tw`flex-1 items-center justify-center py-10`}>
            <ActivityIndicator size="large" color="#43C17A" />
          </View> :

        <>
            {}
            <View style={tw`mb-4 flex-col lg:flex-row gap-4`}>
              <View style={tw`flex-row gap-2 lg:flex-1`}>
                {cardData.map((item, index) =>
              <View key={index} style={tw`flex-1`}>
                    <CardComponent
                  value={item.value}
                  label={item.label}
                  icon={item.icon}
                  bgColor={item.bgColor}
                  iconBgColor={item.iconBgColor} />
                
                  </View>
              )}
              </View>
            </View>

            {}
            <View style={tw`mb-4`}>
              <StudentDataTable
              students={summary.studentRows}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={summary.tableTotalCount}
              onPageChange={setCurrentPage} />
            
            </View>

            {}
            <View style={tw`mb-16 flex-col lg:flex-row gap-4`}>
              <View style={tw`w-full lg:w-[360px]`}>
                <TopFivePerformers performers={topPerformers} />
              </View>

              <View style={tw`w-full lg:flex-1`}>
                <PerformanceTrendChart data={summary.trendData} />
              </View>
            </View>
          </>
        }
      </ScrollView>
    </View>);

}