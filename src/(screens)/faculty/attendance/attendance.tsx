import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts'; import { Text } from '@/components/AppText';
import { isSchoolEducation } from "@/lib/helpers/admin/academicSetup/schoolHelper";
import React, { useEffect, useState, useContext } from "react";
import { View, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, TextInput, Modal } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { HeaderHeightContext } from "@react-navigation/elements";
import { CaretLeft, CaretDown, Check, Prohibit, X, UsersThree, UserCircle, ChartLineDown } from "phosphor-react-native";
import { useUser } from "@/utils/context/UserContext";
import CardComponent, { CardProps } from "./components/StuAttendanceCard";
import StuAttendanceTable from "./components/StuAttendanceTable";
import AttendanceSkeleton from "./shimmer/AttendanceSkeleton";
import {
  getClassDetails,
  UpcomingLesson
} from
  "@/lib/helpers/faculty/attendance/getClasses";
import {
  getStudentsForClass,
  saveAttendance,
  UIStudent,
  ClassOption,
  SectionOption,
  getFacultyClasses,
  getClassSections
} from
  "@/lib/helpers/faculty/attendance/attendanceActions";
import { useAttendanceRealtime, recalculateAttendancePercentage } from "@/lib/helpers/faculty/attendance/liveAttendanceAPI";
import WorkWeekCalendar from "@/utils/workWeekCalendar";

type ParamList = {
  Attendance: { classId?: string; };
};

export default function FacultyAttendance() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<ParamList, 'Attendance'>>();
  const navigation = useNavigation<any>();
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  const urlClassId = route.params?.classId;

  const { facultyId, collegeEducationType, loading: contextLoading } = useUser();
  const isSchool = isSchoolEducation(collegeEducationType);

  const [classData, setClassData] = useState<UpcomingLesson | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [studentsList, setStudentsList] = useState<UIStudent[]>([]);
  const [saving, setSaving] = useState(false);

  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [sectionOptions, setSectionOptions] = useState<SectionOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedCalendarType, setSelectedCalendarType] = useState<"Single" | "Bulk">("Single");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());

  const [isEditing, setIsEditing] = useState(false);
  const [isCancellingMode, setIsCancellingMode] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [showCalendarTypeFilter, setShowCalendarTypeFilter] = useState(false);
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [showSectionFilter, setShowSectionFilter] = useState(false);
  const [showSortFilter, setShowSortFilter] = useState(false);
  const [sort, setSort] = useState("All");

  const activeClassId = urlClassId || selectedClassId;
  const isTopicMode = !!urlClassId;

  const isBulk = activeClassId ? activeClassId.startsWith("bulk-") : false;
  const eventId = activeClassId ? parseInt(isBulk ? activeClassId.split("-")[1].split("_")[0] : activeClassId.split("-")[0]) : null;

  useAttendanceRealtime(
    eventId,
    isBulk,
    (payload) => {
      const newRecord = payload.new;
      if (newRecord && newRecord.studentId) {
        let matchedStudentName = "";
        let status = "Not Marked";

        setStudentsList((prev) => {
          return prev.map((s) => {
            if (s.id === String(newRecord.studentId)) {
              if (newRecord.status === "PRESENT") status = "Present";
              else if (newRecord.status === "LATE") status = "Late";
              else if (newRecord.status === "ABSENT") status = "Absent";

              if (s.attendance !== status) {
                matchedStudentName = s.name;
              }

              let newPercentage = s.percentage;
              let newStats = s.stats;
              if (s.stats) {
                const recalc = recalculateAttendancePercentage(
                  s.attendance,
                  newRecord.status,
                  s.stats
                );
                newPercentage = recalc.newPercentage;
                newStats = recalc.newStats;
              }

              return {
                ...s,
                attendance: status as any,
                reason: newRecord.reason || "",
                percentage: newPercentage,
                stats: newStats,
              };
            }
            return s;
          });
        });

        if (matchedStudentName) {
          setTimeout(() => {
            Toast.show({ type: 'success', text1: `${matchedStudentName} was marked ${status}!` });
          }, 0);
        }
      }
    }
  );

  const confirmClassCancel = () => {
    if (!cancelReason.trim()) {
      Toast.show({ type: 'error', text1: "Enter a reason" });
      return;
    }
    const updatedList = studentsList.map((s) => ({
      ...s,
      attendance: "Class Cancel" as const,
      reason: cancelReason
    }));
    setStudentsList(updatedList);
    setIsCancellingMode(false);
    Toast.show({ type: 'info', text1: "Marked as Cancelled. Click Save." });
  };

  const loadStudents = async (cId: string, sId?: string) => {
    setTableLoading(true);
    try {
      const students = await getStudentsForClass(cId, sId);
      if (!students || students.length === 0) {
        setStudentsList([]);
      } else {
        setStudentsList(students);
      }
      const cData = await getClassDetails(cId);
      setClassData(cData);
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: "Failed to load students" });
      setStudentsList([]);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (route.params?.classId) {
        navigation.setParams({ classId: undefined });
      }
    });
    return unsubscribe;
  }, [navigation, route.params]);

  useEffect(() => {
    if (urlClassId) {
      setSelectedClassId(urlClassId);
      loadStudents(urlClassId).finally(() => setInitialized(true));
      setIsEditing(true);
    } else {
      if (contextLoading || !facultyId) return;
      async function initFilters() {
        try {
          setLoading(true);
          const dateStr = `${selectedCalendarDate.getFullYear()}-${String(selectedCalendarDate.getMonth() + 1).padStart(2, "0")}-${String(selectedCalendarDate.getDate()).padStart(2, "0")}`;
          const classes = await getFacultyClasses(facultyId!, dateStr);
          setClassOptions(classes);

          const filteredClasses = classes.filter(c => selectedCalendarType === "Bulk" ? c.id.startsWith("bulk-") : !c.id.startsWith("bulk-"));

          if (filteredClasses.length === 0) {
            setStudentsList([]);
            setSelectedClassId("");
            setSelectedSectionId("");
            setSectionOptions([]);
            setClassData(null);
            return;
          }

          const firstClass = filteredClasses[0];
          setSelectedClassId(firstClass.id);

          const sections = await getClassSections(firstClass.id);
          setSectionOptions(sections);

          const firstSec = sections.length > 0 ? sections[0].id : "";
          setSelectedSectionId(firstSec);

          await loadStudents(firstClass.id, firstSec);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
          setInitialized(true);
        }
      }
      initFilters();
    }
  }, [urlClassId, facultyId, contextLoading, selectedCalendarDate, selectedCalendarType]);

  const handleFilterChange = async (type: "class" | "section" | "calendarType" | "sort", value: string) => {
    if (type === "sort") {
      setSort(value);
      return;
    }
    if (type === "calendarType") {
      setSelectedCalendarType(value as "Single" | "Bulk");
      const filteredClasses = classOptions.filter(c => value === "Bulk" ? c.id.startsWith("bulk-") : !c.id.startsWith("bulk-"));
      if (filteredClasses.length === 0) {
        setStudentsList([]);
        setSelectedClassId("");
        setSelectedSectionId("");
        setSectionOptions([]);
        setClassData(null);
        return;
      }
      const firstClass = filteredClasses[0];
      setSelectedClassId(firstClass.id);
      const sections = await getClassSections(firstClass.id);
      setSectionOptions(sections);
      const firstSec = sections.length > 0 ? sections[0].id : "";
      setSelectedSectionId(firstSec);
      loadStudents(firstClass.id, firstSec);
    } else if (type === "class") {
      setSelectedClassId(value);
      const sections = await getClassSections(value);
      setSectionOptions(sections);
      const firstSec = sections.length > 0 ? sections[0].id : "";
      setSelectedSectionId(firstSec);
      loadStudents(value, firstSec);
    } else {
      setSelectedSectionId(value);
      loadStudents(selectedClassId, value);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsCancellingMode(false);
    if (urlClassId) {
      loadStudents(urlClassId);
    } else {
      loadStudents(selectedClassId, selectedSectionId);
    }
  };

  const handleSaveAttendance = async () => {
    if (!activeClassId) return;
    const unmarked = studentsList.filter((s) => s.attendance === "Not Marked");
    if (unmarked.length > 0) {
      Toast.show({ type: 'error', text1: `Mark ${unmarked.length} students first.` });
      return;
    }
    setSaving(true);
    try {
      const payload = studentsList.map((s) => ({
        studentId: s.id,
        facultyId: facultyId!,
        status: s.attendance,
        reason: s.reason
      }));
      const result = await saveAttendance(activeClassId, payload);
      if (!result.success) throw new Error(result.error);
      Toast.show({ type: 'success', text1: "Saved!" });
      setIsEditing(false);

      await loadStudents(activeClassId, selectedSectionId);

      if (urlClassId) {
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => navigation.goBack();

  const topicName = classData?.description || "Select a Class";
  const classTime = classData ?
    `${classData.fromTime} - ${classData.toTime}` :
    "-- : --";
  const attendanceStats = studentsList.reduce(
    (acc, s) => {
      if (s.attendance === "Present") acc.present++;
      if (s.attendance === "Absent") acc.absent++;
      if (s.attendance === "Leave") acc.leave++;
      return acc;
    },
    { present: 0, absent: 0, leave: 0 }
  );

  const baseCardData: CardProps[] = [
    {
      value: String(attendanceStats.present),
      label: "Total Students Present",
      bgColor: "bg-[#E6FBEA]",
      icon: <UsersThree color="white" />,
      iconBgColor: "bg-[#43C17A]"
    },
    {
      value: String(attendanceStats.absent),
      label: "Total Students Absent",
      bgColor: "bg-[#FFE0E0]",
      icon: <UserCircle color="white" />,
      iconBgColor: "bg-[#FF2020]"
    },
    {
      value: String(attendanceStats.leave),
      label: "Total Students on Leave",
      bgColor: "bg-[#CEE6FF]",
      icon: <ChartLineDown color="white" />,
      iconBgColor: "bg-[#60AEFF]"
    }
  ];

  if (!initialized || loading || contextLoading) {
    return <AttendanceSkeleton />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}>

      <ScrollView
        className="bg-white px-4"
        contentContainerStyle={{ paddingTop: headerHeight + 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              {urlClassId &&
                <TouchableOpacity onPress={handleCancel} className="mr-2">
                  <CaretLeft size={24} color="#2D3748" weight="bold" />
                </TouchableOpacity>
              }
              <View>
                <Text className="text-2xl text-gray-900" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Attendance", "Attendance")}</Text>
                <Text className="text-sm text-[#282828] mt-1" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Trackverifyandm", "Track, verify, and manage attendance.")}</Text>
              </View>
            </View>
          </View>

          {classData &&
            <View className="bg-[#1E2952] px-4 py-4 rounded-xl shadow-sm mb-4">
              <Text className="text-white text-sm" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.ClassTime", "Class Time :")}<Text className="text-gray-200" style={{ fontFamily: fonts.regular }}>{classTime}</Text></Text>
              <Text className="text-white text-sm mt-1" style={{ fontFamily: fonts.regular }}>{classData.department?.map((item: any) => item.name).join(", ")}</Text>
              <Text className="text-white text-sm mt-1" style={{ fontFamily: fonts.regular }}>
                {isSchool ? `${classData.year} - ` : `${t("Auto.Common.Year", "Year")}${classData.year} - `}{classData.degree}
              </Text>
            </View>
          }
        </View>

        {!urlClassId && (
          <View className="mb-4">
            <WorkWeekCalendar
              activeDate={selectedCalendarDate}
              onDateSelect={setSelectedCalendarDate}
              style="w-full mt-0"
            />
          </View>
        )}

        <View className="flex-row flex-wrap justify-between">
          {baseCardData.map((item, index) =>
            <View key={index} className="w-[48%] mb-4">
              <CardComponent {...item} />
            </View>
          )}
        </View>

        {urlClassId &&
          <View className="flex-row items-center justify-between py-2 mb-2 min-h-[40px]">
            <View className="flex-1 mr-2">
              <Text className="text-lg text-gray-800" numberOfLines={1} style={{ fontFamily: fonts.bold }}>
                <Text className="text-[#43C17A]" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Topic", "Topic :")}</Text>
                {topicName}
              </Text>
            </View>
          </View>
        }

        {isCancellingMode &&
          <View className="flex-row items-center justify-between bg-gray-50 p-2 rounded-lg mb-4 border border-gray-200">
            <Text className="text-gray-700 ml-2" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Reason", "Reason:")}</Text>
            <TextInput
              className="flex-1 ml-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
              placeholder={t("Auto.Attr.Typereasonhere", "Type reason here...")}
              value={cancelReason}
              onChangeText={setCancelReason} />

            <TouchableOpacity onPress={confirmClassCancel} className="bg-green-500 p-2 rounded-lg ml-2">
              <Check size={18} color="white" weight="bold" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsCancellingMode(false)} className="bg-gray-300 p-2 rounded-lg ml-2">
              <X size={18} color="gray" weight="bold" />
            </TouchableOpacity>
          </View>
        }

        <View className="pb-20">
          <StuAttendanceTable
            students={studentsList}
            setStudents={setStudentsList}
            handleSaveAttendance={handleSaveAttendance}
            saving={saving}
            isTopicMode={isTopicMode}
            loadingFilters={tableLoading}
            isEditing={isEditing}
            onEditClick={() => setIsEditing(true)}
            onCancelEditClick={handleCancelEdit}
            onMarkCancelClick={() => { setCancelReason(""); setIsCancellingMode(true); }}
            isCancellingMode={isCancellingMode}
            sort={sort}
            classes={classOptions}
            sections={sectionOptions}
            selectedClass={selectedClassId}
            selectedSection={selectedSectionId}
          />
        </View>
      </ScrollView>

      {/* Fixed Bottom Filters */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 shadow-lg flex-row z-50">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
          {!isTopicMode && (
            <>
              <TouchableOpacity onPress={() => setShowCalendarTypeFilter(true)} className="flex-row items-center bg-[#43C17A1C] px-4 py-2 rounded-full">
                <Text className="text-[#43C17A] text-sm mr-2" style={{ fontFamily: fonts.medium }}>
                  {selectedCalendarType}
                </Text>
                <CaretDown size={14} color="#43C17A" weight="bold" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowClassFilter(true)} className="flex-row items-center bg-[#43C17A1C] px-4 py-2 rounded-full">
                <Text className="text-[#43C17A] text-sm mr-2" style={{ fontFamily: fonts.medium }}>
                  {classOptions.filter(c => selectedCalendarType === "Bulk" ? c.id.startsWith("bulk-") : !c.id.startsWith("bulk-")).find(c => c.id === selectedClassId)?.label || "No Classes Today"}
                </Text>
                <CaretDown size={14} color="#43C17A" weight="bold" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowSectionFilter(true)} className="flex-row items-center bg-[#43C17A1C] px-4 py-2 rounded-full">
                <Text className="text-[#43C17A] text-sm mr-2" style={{ fontFamily: fonts.medium }}>
                  {sectionOptions.find(s => s.id === selectedSectionId)?.name ? `Section ${sectionOptions.find(s => s.id === selectedSectionId)?.name}` : "All Sections"}
                </Text>
                <CaretDown size={14} color="#43C17A" weight="bold" />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => setShowSortFilter(true)} className="flex-row items-center bg-[#43C17A1C] px-4 py-2 rounded-full mr-4">
            <Text className="text-[#43C17A] text-sm mr-2" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Sort", "Sort:")} {sort}</Text>
            <CaretDown size={14} color="#43C17A" weight="bold" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      <Modal visible={showCalendarTypeFilter} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 min-h-[250px]">
            <Text className="text-lg mb-4" style={{ fontFamily: fonts.bold }}>Select Calendar Type</Text>
            <ScrollView>
              {["Single", "Bulk"].map(t => <TouchableOpacity key={t} onPress={() => {
                handleFilterChange("calendarType", t);
                setShowCalendarTypeFilter(false);
              }} className="py-3 border-b border-gray-100">
                <Text className={`text-base ${selectedCalendarType === t ? 'text-[#43C17A] ' : 'text-gray-700'}`} style={{ fontFamily: fonts.bold }}>{t}</Text>
              </TouchableOpacity>)}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowCalendarTypeFilter(false)} className="mt-4 bg-gray-100 py-3 rounded-xl items-center">
              <Text className="text-gray-700" style={{ fontFamily: fonts.bold }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showClassFilter} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 min-h-[300px]">
            <Text className="text-lg mb-4" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.SelectClass", "Select Class")}</Text>
            <ScrollView>
              {classOptions.filter(c => selectedCalendarType === "Bulk" ? c.id.startsWith("bulk-") : !c.id.startsWith("bulk-")).map(c => <TouchableOpacity key={c.id} onPress={() => {
                handleFilterChange("class", c.id);
                setShowClassFilter(false);
              }} className="py-3 border-b border-gray-100">
                <Text className={`text-base ${selectedClassId === c.id ? 'text-[#43C17A] ' : 'text-gray-700'}`} style={{ fontFamily: fonts.bold }}>{c.label}</Text>
              </TouchableOpacity>)}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowClassFilter(false)} className="mt-4 bg-gray-100 py-3 rounded-xl items-center">
              <Text className="text-gray-700" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Close", "Close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSectionFilter} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 min-h-[300px]">
            <Text className="text-lg mb-4" style={{ fontFamily: fonts.bold }}>{t("Auto.Attr.SelectSection", "Select Section")}</Text>
            <ScrollView>
              {sectionOptions.map(s => (
                <TouchableOpacity key={s.id} onPress={() => {
                  handleFilterChange("section", s.id);
                  setShowSectionFilter(false);
                }} className="py-3 border-b border-gray-100">
                  <Text className={`text-base ${selectedSectionId === s.id ? 'text-[#43C17A] ' : 'text-gray-700'}`} style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Section", "Section")} {s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowSectionFilter(false)} className="mt-4 bg-gray-100 py-3 rounded-xl items-center">
              <Text className="text-gray-700" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Close", "Close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSortFilter} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 min-h-[300px]">
            <Text className="text-lg mb-4" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.SortBy", "Sort By")}</Text>
            <ScrollView>
              {["All", "Present", "Absent", "Leave", "Class Cancel"].map(s => <TouchableOpacity key={s} onPress={() => {
                setSort(s);
                setShowSortFilter(false);
              }} className="py-3 border-b border-gray-100">
                <Text className={`text-base ${sort === s ? 'text-[#43C17A] ' : 'text-gray-700'}`} style={{ fontFamily: fonts.bold }}>{s}</Text>
              </TouchableOpacity>)}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowSortFilter(false)} className="mt-4 bg-gray-100 py-3 rounded-xl items-center">
              <Text className="text-gray-700" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Close", "Close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}
