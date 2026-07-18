import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts'; import { Text } from '@/components/AppText';
import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "twrnc";
import { ChartLineDown, UserCircle, UsersThree } from "phosphor-react-native";
import { AppPicker } from "@/components/AppPicker";
import { useFaculty } from "@/utils/context/faculty/useFaculty";
import { getFacultyStudentProgressSummary } from "@/lib/helpers/faculty/studentProgress/getFacultyStudentProgressSummary";
import { isSchoolEducation } from '@/lib/helpers/admin/academicSetup/schoolHelper';

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

export default function FacultyStudentProgressScreen() {
  const { t } = useTranslation();
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
    collegeAcademicYears,
    facultyId,
    faculty_edu_type
  } = useFaculty();

  const isSchool = isSchoolEducation(faculty_edu_type);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState<StudentProgressSummary>(defaultSummary);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | "all">("all");
  const [selectedYearId, setSelectedYearId] = useState<number | "all">("all");
  const [selectedSectionId, setSelectedSectionId] = useState<number | "all">("all");
  const [debugError, setDebugError] = useState<string | null>(null);
  const rowsPerPage = 10;

  const uniqueSubjects = useMemo(() => {
    const map = new Map<number, string>();
    sections.forEach((s) => {
      if (s.faculty_subject?.subjectName) {
        map.set(s.collegeSubjectId, s.faculty_subject.subjectName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sections]);

  const uniqueYears = useMemo(() => {
    return collegeAcademicYears.map((y) => ({
      id: y.collegeAcademicYearId,
      name: y.collegeAcademicYear
    }));
  }, [collegeAcademicYears]);

  const uniqueSections = useMemo(() => {
    const map = new Map<number, string>();
    sections.forEach((s) => {
      if (
         (selectedSubjectId === "all" || s.collegeSubjectId === selectedSubjectId) &&
         (selectedYearId === "all" || s.collegeAcademicYearId === selectedYearId)
      ) {
        if (s.college_sections?.collegeSections) {
          map.set(s.collegeSectionsId, s.college_sections.collegeSections);
        }
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sections, selectedSubjectId, selectedYearId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (facultyLoading) return;

    if (!collegeId || !facultyId || !collegeEducationId || (!isSchool && !collegeBranchId)) {
      setSummary(defaultSummary);
      setSummaryLoading(false);
      return;
    }

    let mounted = true;

    const loadSummary = async () => {
      setSummaryLoading(true);
      setDebugError(null);

      let resolvedSectionIds: number[];
      if (selectedSectionId !== "all") {
        resolvedSectionIds = [selectedSectionId as number];
      } else {
        resolvedSectionIds = sections
          .filter((s) =>
            (selectedSubjectId === "all" || s.collegeSubjectId === selectedSubjectId) &&
            (selectedYearId === "all" || s.collegeAcademicYearId === selectedYearId)
          )
          .map((s) => s.collegeSectionsId);

        if (resolvedSectionIds.length === 0) {
          resolvedSectionIds = sectionIds;
        }
      }

      let resolvedYearIds: number[];
      if (selectedYearId !== "all") {
        resolvedYearIds = [selectedYearId as number];
      } else {
        resolvedYearIds = sections
          .filter((s) =>
            (selectedSubjectId === "all" || s.collegeSubjectId === selectedSubjectId)
          )
          .map((s) => s.collegeAcademicYearId);

        if (resolvedYearIds.length === 0) {
          resolvedYearIds = academicYearIds;
        }
      }

      const resolvedSubjectIds = selectedSubjectId === "all" ? subjectIds : [selectedSubjectId as number];

      const subjectLabel = faculty_subject.map((s) => s.subjectName).join(", ") || "N/A";

      try {
        const data = await getFacultyStudentProgressSummary({
          facultyId,
          collegeId,
          collegeEducationId,
          collegeBranchId,
          academicYearIds: resolvedYearIds,
          sectionIds: resolvedSectionIds,
          subjectIds: resolvedSubjectIds,
          departmentLabel: college_branch,
          subjectLabel: subjectLabel,
          page: currentPage,
          pageSize: rowsPerPage,
          searchQuery: debouncedSearchQuery
        });

        if (mounted) {
          console.log("[StudentProgress] data received:", {
            totalStudents: data.totalStudents,
            studentRowsCount: data.studentRows.length,
            tableTotalCount: data.tableTotalCount,
            topPerformerCount: data.topPerformerRows.length,
            resolvedSectionIds,
            resolvedYearIds,
            resolvedSubjectIds,
            sectionIds,
            subjectIds,
            academicYearIds,
          });
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
    selectedSectionId,
    selectedSubjectId,
    selectedYearId,
    uniqueSubjects
  ]);

  const subtitle = t("StudentProgress.faculty.monitorSubtitle", "Monitor and compare overall student performance");

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
      label: t("StudentProgress.faculty.totalStudents", "Total Students"),
      bgColor: "bg-[#FFEDDA]",
      icon: <UsersThree size={24} color="#FFBB70" weight="fill" />,
      iconBgColor: "bg-[#FFBB70]/20"
    },
    {
      value: summary.presentToday.toString(),
      label: t("StudentProgress.faculty.presentToday", "Present Today"),
      bgColor: "bg-[#E6FBEA]",
      icon: <UserCircle size={24} color="#43C17A" weight="fill" />,
      iconBgColor: "bg-[#43C17A]/20"
    },
    {
      value: summary.lowAttendance.toString(),
      label: t("StudentProgress.faculty.lowAttendance", "Low Attendance"),
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
    <View style={[tw`flex-1 bg-[#F9FAFB]`, { paddingTop: insets.top + 110 }]}>
      <ScrollView style={tw`flex-1 px-4`} contentContainerStyle={tw`pb-20`}>
        {debugError &&
          <View style={tw`bg-red-100 p-4 rounded mb-4`}>
            <Text style={[{ fontFamily: fonts.bold }, tw`text-red-600 `]}>{t("Auto.Common.Errorfetchingda", "Error fetching data:")}</Text>
            <Text style={[{ fontFamily: fonts.regular }, tw`text-red-500 text-xs`]}>{debugError}</Text>
          </View>
        }

        { }
        <View style={tw`mb-4 flex-col justify-between items-start`}>
          <View style={tw`w-full`}>
            <Text style={[{ fontFamily: fonts.bold }, tw`text-xl md:text-2xl  text-black`]} numberOfLines={1}>{t("Auto.Common.StudentProgress", "Student Progress Overview")}

            </Text>
            <Text style={[{ fontFamily: fonts.regular }, tw`text-sm text-gray-500 mt-1`]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>

        { }
        <View style={tw`mb-4 flex-row flex-wrap items-center gap-4`}>
          <View style={tw`flex-col gap-1 w-[40%]`}>
            <Text style={tw`text-xs font-semibold text-gray-500 uppercase tracking-wide`}>{t("Auto.Common.Subject", "Subject")}</Text>
            <AppPicker
              selectedValue={selectedSubjectId}
              onValueChange={(itemValue) => setSelectedSubjectId(itemValue)}
              items={[
                { label: t("Auto.Attr.All", "All"), value: "all" },
                ...uniqueSubjects.map((sub) => ({ label: sub.name, value: sub.id }))
              ]}
            />
          </View>

          <View style={tw`flex-col gap-1 w-[28%]`}>
            <Text style={tw`text-xs font-semibold text-gray-500 uppercase tracking-wide`}>{t("Auto.Common.Year", "Year")}</Text>
            <AppPicker
              selectedValue={selectedYearId}
              onValueChange={(itemValue) => setSelectedYearId(itemValue)}
              items={[
                { label: t("Auto.Attr.All", "All"), value: "all" },
                ...uniqueYears.map((y) => ({ label: y.name, value: y.id }))
              ]}
            />
          </View>

          <View style={tw`flex-col gap-1 flex-1`}>
            <Text style={tw`text-xs font-semibold text-gray-500 uppercase tracking-wide`}>{t("Auto.Common.Sec", "Sec")}</Text>
            <AppPicker
              selectedValue={selectedSectionId}
              onValueChange={(itemValue) => setSelectedSectionId(itemValue)}
              items={[
                { label: t("Auto.Attr.All", "All"), value: "all" },
                ...uniqueSections.map((sec) => ({ label: sec.name, value: sec.id }))
              ]}
            />
          </View>
        </View>

        {summaryLoading && summary.totalStudents === 0 && summary.studentRows.length === 0 ?
          <View style={tw`flex-1 items-center justify-center py-10`}>
            <ActivityIndicator size="large" color="#43C17A" />
          </View> :

          <>
            { }
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

            { }
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

            { }
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