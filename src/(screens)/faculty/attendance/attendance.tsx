import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { CaretLeft, Check, Prohibit, X, UsersThree, UserCircle, ChartLineDown } from "phosphor-react-native";
import { useUser } from "@/utils/context/UserContext";
import CardComponent, { CardProps } from "./components/StuAttendanceCard";
import StuAttendanceTable from "./components/StuAttendanceTable";
import AttendanceSkeleton from "./shimmer/AttendanceSkeleton";
import {
  getClassDetails,
  UpcomingLesson } from
"@/lib/helpers/faculty/attendance/getClasses";
import {
  getStudentsForClass,
  saveAttendance,
  UIStudent,
  ClassOption,
  SectionOption,
  getFacultyClasses,
  getClassSections } from
"@/lib/helpers/faculty/attendance/attendanceActions";

type ParamList = {
  Attendance: {classId?: string;};
};

export default function FacultyAttendance() {const { t } = useTranslation();
  const route = useRoute<RouteProp<ParamList, 'Attendance'>>();
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const urlClassId = route.params?.classId;

  const { facultyId, loading: contextLoading } = useUser();

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

  const [isEditing, setIsEditing] = useState(false);
  const [isCancellingMode, setIsCancellingMode] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const activeClassId = urlClassId || selectedClassId;
  const isTopicMode = !!urlClassId;

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
    if (urlClassId) {
      setSelectedClassId(urlClassId);
      loadStudents(urlClassId).finally(() => setInitialized(true));
      setIsEditing(true);
    } else {
      if (contextLoading || !facultyId) return;
      async function initFilters() {
        try {
          setLoading(true);
          const classes = await getFacultyClasses(facultyId!);
          setClassOptions(classes);

          if (classes.length === 0) {
            setStudentsList([]);
            return;
          }

          const firstClass = classes[0];
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
  }, [urlClassId, facultyId, contextLoading]);

  const handleFilterChange = async (type: "class" | "section", value: string) => {
    if (type === "class") {
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
    value: String(studentsList.length),
    label: "Total Students",
    bgColor: "bg-[#FFEDDA]",
    icon: <UsersThree color="white" />,
    iconBgColor: "bg-[#FFBB70]"
  },
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
  }];


  if (!initialized || loading || contextLoading) {
    return <AttendanceSkeleton />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}>
      
      <ScrollView
        className="flex-1 bg-white px-4 pb-4"
        style={{ paddingTop: headerHeight + 16 }}
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
              <Text className="text-2xl font-bold text-gray-900">{t("Auto.Common.Attendance", "Attendance")}</Text>
              <Text className="text-sm text-[#282828] mt-1">{t("Auto.Common.Trackverifyandm", "Track, verify, and manage attendance.")}</Text>
            </View>
          </View>
        </View>

        {classData &&
          <View className="bg-[#1E2952] px-4 py-4 rounded-xl shadow-sm mb-4">
            <Text className="text-white text-sm font-medium">{t("Auto.Common.ClassTime", "Class Time :")}<Text className="text-gray-200">{classTime}</Text></Text>
            <Text className="text-white text-sm mt-1">{classData.department?.map((item: any) => item.name).join(", ")}</Text>
            <Text className="text-white text-sm mt-1">{t("Auto.Common.Year", "Year")}{classData.year} - {classData.degree}</Text>
          </View>
          }
      </View>

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
            <Text className="text-lg font-bold text-gray-800" numberOfLines={1}>
              <Text className="text-[#43C17A]">{t("Auto.Common.Topic", "Topic :")}</Text>
              {topicName}
            </Text>
          </View>
        </View>
        }

      {isCancellingMode &&
        <View className="flex-row items-center justify-between bg-gray-50 p-2 rounded-lg mb-4 border border-gray-200">
          <Text className="text-gray-700 ml-2">{t("Auto.Common.Reason", "Reason:")}</Text>
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

      <View className="flex-1 pb-20">
        {tableLoading || urlClassId || classOptions.length > 0 || sectionOptions.length > 0 ?
          <StuAttendanceTable
            students={studentsList}
            setStudents={setStudentsList}
            handleSaveAttendance={handleSaveAttendance}
            saving={saving}
            isTopicMode={isTopicMode}
            classes={classOptions}
            sections={sectionOptions}
            selectedClass={selectedClassId}
            selectedSection={selectedSectionId}
            onFilterChange={urlClassId ? undefined : handleFilterChange}
            loadingFilters={tableLoading}
            isEditing={isEditing}
            onEditClick={() => setIsEditing(true)}
            onCancelEditClick={handleCancelEdit}
            onMarkCancelClick={() => {setCancelReason("");setIsCancellingMode(true);}}
            isCancellingMode={isCancellingMode} /> :


          <View className="py-16 items-center justify-center">
            <Text className="text-gray-500">{t("Auto.Common.Nostudentsfound", "No students found")}</Text>
          </View>
          }
      </View>
    </ScrollView>
    </KeyboardAvoidingView>);

}