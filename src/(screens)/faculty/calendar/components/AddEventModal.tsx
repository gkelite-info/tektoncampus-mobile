import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useEffect, useState, useMemo } from "react";
import { View, TouchableOpacity, Modal, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { X, Check } from "phosphor-react-native";
import { fetchFacultyContext } from "@/utils/context/faculty/facultyContextAPI";
import { useUser } from "@/utils/context/UserContext";
import { fetchAcademicDropdowns } from "@/lib/helpers/faculty/academicDropdown.helper";
import { supabase } from "@/lib/supabaseClient";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { AppPicker } from "@/components/AppPicker";
import { fonts } from '@/constants/fonts';
import { isSchoolEducation } from '@/lib/helpers/admin/academicSetup/schoolHelper';

const getTodayDateString = () => new Date().toISOString().split("T")[0];

export default function AddEventModal({
  isOpen,
  onClose,
  onSave,
  value,
  mode,
  degreeOptions
}: any) {
  const { t } = useTranslation();
  const { userId, collegeId, loading, collegeEducationType } = useUser();
  const [facultyCtx, setFacultyCtx] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState("class");
  const [eventTypeTab, setEventTypeTab] = useState<"single" | "bulk">("single");
  const [meetingPlatform, setMeetingPlatform] = useState<"meet" | "zoom" | "others">("meet");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [meetingPassword, setMeetingPassword] = useState("");
  const [date, setDate] = useState(new Date());
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());

  const isSchool = isSchoolEducation(collegeEducationType || facultyCtx?.collegeEducationType);

  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");

  const [endHour, setEndHour] = useState("10");
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("AM");

  const [collegeRoomId, setCollegeRoomId] = useState<number | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [topicId, setTopicId] = useState<number | null>(null);

  // Academics state
  const [educationId, setEducationId] = useState<number>();
  const [branchId, setBranchId] = useState<number>();
  const [academicYearId, setAcademicYearId] = useState<number>();
  const [semester, setSemester] = useState<number>();
  const [subjectId, setSubjectId] = useState<number>();
  const [sectionIds, setSectionIds] = useState<number[]>([]);

  // Advanced Academic Dropdowns (Degree Options)
  const [degree, setDegree] = useState("");
  const [year, setYear] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");

  // Options
  const [educations, setEducations] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isFromDatePickerVisible, setFromDatePickerVisibility] = useState(false);
  const [isToDatePickerVisible, setToDatePickerVisibility] = useState(false);

  const selectedDegreeObj = useMemo(() => {
    return degreeOptions?.find((d: any) => d.degreeType === degree);
  }, [degree, degreeOptions]);

  const departmentOptions = useMemo(() => {
    if (!selectedDegreeObj?.departments) return [];
    return selectedDegreeObj.departments.map((d: string) => d.trim());
  }, [selectedDegreeObj]);

  const yearOptions = useMemo(() => {
    if (!selectedDegreeObj?.years) return [];
    return selectedDegreeObj?.years ?? [];
  }, [selectedDegreeObj?.years]);

  // Load context
  useEffect(() => {
    if (!userId || loading || !isOpen) return;
    fetchFacultyContext(userId).then((ctx) => {
      setFacultyCtx(ctx);
      setEducationId(ctx?.collegeEducationId ?? undefined);
      setBranchId(ctx?.collegeBranchId ?? undefined);
      if (ctx?.academicYearIds?.length) setAcademicYearId(ctx.academicYearIds[0]);
    });
  }, [userId, loading, isOpen]);

  // Load Dropdowns
  useEffect(() => {
    if (!collegeId || !facultyCtx || !isOpen) return;
    const loadData = async () => {
      try {
        const edus = await fetchAcademicDropdowns({ type: "education", collegeId });
        setEducations(edus || []);

        const brs = await fetchAcademicDropdowns({ type: "branch", collegeId, educationId: facultyCtx.collegeEducationId });
        setBranches(brs || []);

        const yrs = await fetchAcademicDropdowns({ type: "academicYear", collegeId, educationId: facultyCtx.collegeEducationId, branchId: facultyCtx.collegeBranchId });
        setAcademicYears(yrs || []);

        const sems = await fetchAcademicDropdowns({ type: "semester", collegeId, educationId: facultyCtx.collegeEducationId, branchId: facultyCtx.collegeBranchId, academicYearId: facultyCtx.academicYearIds?.[0] });
        setSemesters(sems || []);
        if (sems?.length === 1) setSemester(sems[0].collegeSemesterId);

        const secs = await fetchAcademicDropdowns({ type: "section", collegeId, educationId: facultyCtx.collegeEducationId, branchId: facultyCtx.collegeBranchId, academicYearId: facultyCtx.academicYearIds?.[0] });
        const filteredSecs = (secs || []).filter((s: any) => facultyCtx.sectionIds.includes(s.collegeSectionsId));
        setSections(filteredSecs);
        if (filteredSecs.length === 1) setSectionIds([filteredSecs[0].collegeSectionsId]);

        let subjectQuery = supabase.
          from("college_subjects").
          select("collegeSubjectId, subjectName").
          eq("collegeId", collegeId).
          eq("collegeEducationId", facultyCtx.collegeEducationId).
          eq("collegeAcademicYearId", facultyCtx.academicYearIds?.[0]).
          in("collegeSubjectId", facultyCtx.subjectIds).
          eq("isActive", true).
          is("deletedAt", null);
          
        if (facultyCtx.collegeBranchId) {
            subjectQuery = subjectQuery.eq("collegeBranchId", facultyCtx.collegeBranchId);
        } else {
            subjectQuery = subjectQuery.is("collegeBranchId", null);
        }
        
        const { data: subjectRows } = await subjectQuery;

        setSubjects(subjectRows || []);
        if (subjectRows?.length === 1) setSubjectId(subjectRows[0].collegeSubjectId);
      } catch (err) { }
    };
    loadData();
  }, [collegeId, facultyCtx, isOpen]);

  // Load college rooms
  useEffect(() => {
    if (!collegeId || !isOpen) return;
    supabase
      .from("college_rooms")
      .select("collegeRoomId, roomNo")
      .eq("collegeId", collegeId)
      .eq("isActive", true)
      .is("deletedAt", null)
      .order("roomNo", { ascending: true })
      .then(({ data }) => setRooms(data || []));
  }, [collegeId, isOpen]);

  useEffect(() => {
    if (!subjectId || !isOpen) return;
    supabase.
      from("college_subject_unit_topics").
      select("collegeSubjectUnitTopicId, topicTitle").
      eq("collegeSubjectId", subjectId).
      eq("collegeId", collegeId).
      then(({ data }) => setTopics(data || []));

    supabase.
      from("college_subjects").
      select("collegeSemesterId").
      eq("collegeSubjectId", subjectId).
      single().
      then(({ data }) => {
        if (data?.collegeSemesterId) setSemester(data.collegeSemesterId);
      });
  }, [subjectId, isOpen]);

  useEffect(() => {
    if (!isOpen || !value || mode !== "edit") return;
    setSelectedType(value.type || "class");
    setCollegeRoomId(value.collegeRoomId || null);
    setDate(new Date(value.date || Date.now()));
    setTitle(value.title || "");
    setMeetingLink(value.meetingLink || "");
    setMeetingId(value.meetingId || "");
    setMeetingPassword(value.meetingPassword || "");
    if (value.meetingId) setMeetingPlatform("zoom");
    else if (value.meetingLink?.includes("meet")) setMeetingPlatform("meet");
    else setMeetingPlatform("others");
    if (value.topicId) setTopicId(value.topicId);
    if (value.semesterId) setSemester(value.semesterId);
    if (value.sectionIds) setSectionIds(value.sectionIds);
    if (value.startHour) setStartHour(value.startHour);
    if (value.startMinute) setStartMinute(value.startMinute);
    if (value.startPeriod) setStartPeriod(value.startPeriod);
    if (value.endHour) setEndHour(value.endHour);
    if (value.endMinute) setEndMinute(value.endMinute);
    if (value.endPeriod) setEndPeriod(value.endPeriod);
  }, [isOpen, value, mode]);

  const to24Hour = (h: string, m: string, p: string) => {
    let hr = parseInt(h, 10);
    if (p === "PM" && hr !== 12) hr += 12;
    if (p === "AM" && hr === 12) hr = 0;
    return `${String(hr).padStart(2, "0")}:${m}:00`;
  };

  const handleSave = async () => {
    if (!isSchool && !semester) { Toast.show({ type: 'error', text1: t("Calendar.faculty.selectSemesterPlz", "Please select semester") }); return; }
    if (!sectionIds.length) { Toast.show({ type: 'error', text1: t("Calendar.faculty.selectSectionsPlz", "Please select sections") }); return; }
    if (eventTypeTab === "single" && !topicId) { Toast.show({ type: 'error', text1: t("Calendar.faculty.selectTopicPlz", "Please select a topic") }); return; }
    if (selectedType === "meeting" && !title.trim()) { Toast.show({ type: 'error', text1: t("Calendar.faculty.enterMeetingTitle", "Please enter meeting title") }); return; }

    const startTime = to24Hour(startHour, startMinute, startPeriod);
    const endTime = to24Hour(endHour, endMinute, endPeriod);

    if (startTime >= endTime) { Toast.show({ type: 'error', text1: t("Calendar.faculty.endAfterStart", "End time must be after start time") }); return; }

    const payload = {
      isBulk: eventTypeTab === "bulk",
      facultyId: userId!,
      subjectId: subjectId!,
      eventTopic: topicId,
      eventTitle: selectedType === "meeting" ? title : subjects.find((s) => s.collegeSubjectId === subjectId)?.subjectName,
      type: selectedType,
      date: date.toISOString().split("T")[0],
      fromDate: fromDate.toISOString().split("T")[0],
      toDate: toDate.toISOString().split("T")[0],
      fromTime: startTime,
      toTime: endTime,
      collegeRoomId: collegeRoomId!,
      meetingLink: selectedType === "meeting" && meetingPlatform !== "zoom" ? meetingLink : null,
      meetingId: selectedType === "meeting" && meetingPlatform === "zoom" ? meetingId : null,
      meetingPassword: selectedType === "meeting" && meetingPlatform === "zoom" ? meetingPassword : null,
      collegeEducationId: educationId!,
      collegeBranchId: isSchool ? null : branchId!,
      collegeAcademicYearId: academicYearId!,
      collegeSemesterId: isSchool ? null : semester!,
      sectionIds
    };

    setIsSubmitting(true);
    try {
      const res = await onSave(payload);
      if (res?.success !== false) onClose();
    } catch (e) {
      Toast.show({ type: 'error', text1: t("Calendar.faculty.failedToSaveEvent", "Failed to save event") });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white h-[90%] rounded-t-3xl overflow-hidden">
          <View className="flex-row items-center justify-between p-5 border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-800">
              {mode === "edit" ? t("Calendar.faculty.editCalendarEvent", "Edit Calendar Event") : t("Calendar.faculty.newCalendarEvent", "New Calendar Event")}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2 -mr-2 bg-gray-50 rounded-full">
              <X size={20} color="#374151" weight="bold" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 40 }}>

            {mode === "create" && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2">{t("Calendar.faculty.calendarMode", "Calendar Mode")}</Text>
                <View className="flex-row gap-2 mb-4">
                  {(["single", "bulk"] as const).map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      onPress={() => setEventTypeTab(tab)}
                      className={`flex-1 py-2.5 rounded-lg border items-center ${eventTypeTab === tab ? "bg-emerald-500 border-emerald-500" : "bg-white border-gray-300"}`}
                    >
                      <Text className={`text-sm font-medium ${eventTypeTab === tab ? "text-white" : "text-gray-700"}`}>
                        {tab === "single" ? t("Calendar.faculty.single", "Single") : t("Calendar.faculty.bulk", "Bulk")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text className="text-sm font-medium text-gray-700 mb-2">{t("Auto.Common.Type", "Type")}</Text>
            <View className="flex-row gap-2 mb-4">
              {["class", "meeting", "exam"].map((t_type) =>
                <TouchableOpacity
                  key={t_type}
                  onPress={() => setSelectedType(t_type)}
                  className={`flex-1 py-2.5 rounded-lg border items-center ${selectedType === t_type ? "bg-emerald-500 border-emerald-500" : "bg-white border-gray-300"}`
                  }>
                  <Text className={`text-sm font-medium ${selectedType === t_type ? "text-white" : "text-gray-700"}`}>
                    {t_type === "class" ? t("Calendar.faculty.class", "Class") :
                      t_type === "meeting" ? t("Calendar.faculty.meeting", "Meeting") :
                        t_type === "exam" ? t("Calendar.faculty.exam", "Exam") :
                          t_type.charAt(0).toUpperCase() + t_type.slice(1)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Text className="text-sm font-medium text-gray-700 mb-1">{t("Auto.Common.Subject", "Subject")} <Text className="text-red-500">*</Text></Text>
            <View className="mb-4">
              <AppPicker
                selectedValue={subjectId}
                onValueChange={(val) => { setSubjectId(val); setTopicId(null); }}
                placeholder={t("Auto.Attr.SelectSubject", "Select Subject")}
                items={subjects.map((s) => ({ label: s.subjectName, value: s.collegeSubjectId }))}
              />
            </View>

            {eventTypeTab === "single" && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-1">{t("Auto.Common.Topic", "Topic")} <Text className="text-red-500">*</Text></Text>
                <View className="mb-4">
                  <AppPicker
                    selectedValue={topicId}
                    onValueChange={setTopicId}
                    placeholder={t("Auto.Attr.SelectTopic", "Select Topic")}
                    items={topics.map((t) => ({ label: t.topicTitle, value: t.collegeSubjectUnitTopicId }))}
                  />
                </View>
              </>
            )}

            {selectedType === "meeting" && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2">{t("Calendar.faculty.meetingPlatform", "Platform")}</Text>
                <View className="flex-row gap-2 mb-4">
                  {["meet", "zoom", "others"].map((plat) =>
                    <TouchableOpacity
                      key={plat}
                      onPress={() => setMeetingPlatform(plat as any)}
                      className={`flex-1 py-2 rounded-lg border items-center ${meetingPlatform === plat ? "bg-emerald-500 border-emerald-500" : "bg-white border-gray-300"
                        }`}
                    >
                      <Text className={`text-sm font-medium ${meetingPlatform === plat ? "text-white" : "text-gray-700"}`}>
                        {plat === "meet" ? t("Calendar.faculty.meet", "Meet") : plat === "zoom" ? t("Calendar.faculty.zoom", "Zoom") : t("Calendar.faculty.others", "Others")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text className="text-sm font-medium text-gray-700 mb-1">{t("Auto.Common.MeetingTitle", "Meeting Title")} <Text className="text-red-500">*</Text></Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t("Auto.Attr.egParentMeeting", "e.g. Parent Meeting")}
                  className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-800"
                />

                {meetingPlatform === "zoom" ? (
                  <>
                    <Text className="text-sm font-medium text-gray-700 mb-1">{t("Calendar.faculty.meetingId", "Meeting ID")}</Text>
                    <TextInput
                      value={meetingId}
                      onChangeText={setMeetingId}
                      placeholder={t("Calendar.faculty.enterMeetingId", "Enter Meeting ID")}
                      className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-800"
                    />
                    <Text className="text-sm font-medium text-gray-700 mb-1">{t("Calendar.faculty.meetingPassword", "Meeting Password")}</Text>
                    <TextInput
                      value={meetingPassword}
                      onChangeText={setMeetingPassword}
                      placeholder={t("Calendar.faculty.enterMeetingPassword", "Enter Password")}
                      className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-800"
                    />
                  </>
                ) : (
                  <>
                    <Text className="text-sm font-medium text-gray-700 mb-1">{t("Auto.Common.MeetingLink", "Meeting Link")}</Text>
                    <TextInput
                      value={meetingLink}
                      onChangeText={setMeetingLink}
                      placeholder={t("Auto.Attr.https", "https://...")}
                      className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-800"
                    />
                  </>
                )}
              </>
            )}

            {eventTypeTab === "single" ? (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-1">{t("Auto.Common.Date", "Date")} <Text className="text-red-500">*</Text></Text>
                <TouchableOpacity
                  onPress={() => setDatePickerVisibility(true)}
                  className="border border-gray-300 rounded-lg px-4 py-3 mb-4 bg-gray-50 flex-row justify-between items-center">
                  <Text className="text-gray-800">{date.toDateString()}</Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={isDatePickerVisible}
                  mode="date"
                  onConfirm={(d) => { setDate(d); setDatePickerVisibility(false); }}
                  onCancel={() => setDatePickerVisibility(false)}
                  date={date}
                />
              </>
            ) : (
              <View className="flex-row gap-2 mb-4">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">{t("Auto.Common.FromDate", "From Date")} <Text className="text-red-500">*</Text></Text>
                  <TouchableOpacity
                    onPress={() => setFromDatePickerVisibility(true)}
                    className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 items-center justify-center">
                    <Text className="text-gray-800 text-xs">{fromDate.toDateString()}</Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={isFromDatePickerVisible}
                    mode="date"
                    onConfirm={(d) => { setFromDate(d); setFromDatePickerVisibility(false); }}
                    onCancel={() => setFromDatePickerVisibility(false)}
                    date={fromDate}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">{t("Auto.Common.ToDate", "To Date")} <Text className="text-red-500">*</Text></Text>
                  <TouchableOpacity
                    onPress={() => setToDatePickerVisibility(true)}
                    className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 items-center justify-center">
                    <Text className="text-gray-800 text-xs">{toDate.toDateString()}</Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={isToDatePickerVisible}
                    mode="date"
                    onConfirm={(d) => { setToDate(d); setToDatePickerVisibility(false); }}
                    onCancel={() => setToDatePickerVisibility(false)}
                    date={toDate}
                  />
                </View>
              </View>
            )}

            <Text className="text-sm font-medium text-gray-700 mb-1">{t("Auto.Common.StartTime", "Start Time")} <Text className="text-red-500">*</Text></Text>
            <View className="flex-row gap-2 mb-4">
              <View className="flex-1">
                <AppPicker
                  selectedValue={startHour}
                  onValueChange={setStartHour}
                  items={Array.from({ length: 12 }, (_, i) => { const h = String(i + 1).padStart(2, '0'); return { label: h, value: h } })}
                />
              </View>
              <View className="flex-1">
                <AppPicker
                  selectedValue={startMinute}
                  onValueChange={setStartMinute}
                  items={Array.from({ length: 12 }, (_, i) => { const m = String(i * 5).padStart(2, '0'); return { label: m, value: m } })}
                />
              </View>
              <View className="flex-1">
                <AppPicker
                  selectedValue={startPeriod}
                  onValueChange={setStartPeriod}
                  items={[{ label: t("Auto.Attr.AM", "AM"), value: "AM" }, { label: t("Auto.Attr.PM", "PM"), value: "PM" }]}
                />
              </View>
            </View>

            <Text className="text-sm text-gray-700 mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.EndTime", "End Time")} <Text className="text-red-500">*</Text></Text>
            <View className="flex-row gap-2 mb-4">
              <View className="flex-1">
                <AppPicker
                  selectedValue={endHour}
                  onValueChange={setEndHour}
                  items={Array.from({ length: 12 }, (_, i) => { const h = String(i + 1).padStart(2, '0'); return { label: h, value: h } })}
                />
              </View>
              <View className="flex-1">
                <AppPicker
                  selectedValue={endMinute}
                  onValueChange={setEndMinute}
                  items={Array.from({ length: 12 }, (_, i) => { const m = String(i * 5).padStart(2, '0'); return { label: m, value: m } })}
                />
              </View>
              <View className="flex-1">
                <AppPicker
                  selectedValue={endPeriod}
                  onValueChange={setEndPeriod}
                  items={[{ label: t("Auto.Attr.AM", "AM"), value: "AM" }, { label: t("Auto.Attr.PM", "PM"), value: "PM" }]}
                />
              </View>
            </View>

            <Text className="text-sm font-medium text-gray-700 mb-1">{t("Calendar.faculty.roomNo", "Room No.")} <Text className="text-red-500">*</Text></Text>
            <View className="mb-4">
              <AppPicker
                selectedValue={collegeRoomId}
                onValueChange={setCollegeRoomId}
                placeholder={t("Calendar.faculty.selectRoom", "Select Room")}
                items={rooms.map(r => ({ label: r.roomNo, value: r.collegeRoomId }))}
              />
            </View>

            {degreeOptions && degreeOptions.length > 0 && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-1">{t("Calendar.faculty.degree", "Degree")}</Text>
                <View className="mb-4">
                  <AppPicker
                    selectedValue={degree}
                    onValueChange={(val) => { setDegree(val); setSelectedDepartment(""); setYear(""); }}
                    placeholder={t("Calendar.faculty.selectDegree", "Select Degree")}
                    items={degreeOptions.map((d: any) => ({ label: d.degreeType, value: d.degreeType }))}
                  />
                </View>

                <Text className="text-sm font-medium text-gray-700 mb-1">{t("Calendar.faculty.department", "Department")}</Text>
                <View className="mb-4">
                  <AppPicker
                    selectedValue={selectedDepartment}
                    onValueChange={setSelectedDepartment}
                    placeholder={t("Calendar.faculty.selectDepartment", "Select Department")}
                    items={departmentOptions.map((d: string) => ({ label: d, value: d }))}
                  />
                </View>

                <Text className="text-sm font-medium text-gray-700 mb-1">{t("Calendar.faculty.year", "Year")}</Text>
                <View className="mb-4">
                  <AppPicker
                    selectedValue={year}
                    onValueChange={setYear}
                    placeholder={t("Calendar.faculty.selectYear", "Select Year")}
                    items={yearOptions.map((y: any) => ({ label: y.label, value: y.label }))}
                  />
                </View>
              </>
            )}

            <Text className="text-sm font-medium text-gray-700 mb-1">{t("Auto.Common.EducationType", "Education Type")} <Text className="text-red-500">*</Text></Text>
            <TextInput editable={false} value={educations.find((e) => e.collegeEducationId === educationId)?.collegeEducationType || ""} className="border border-gray-200 rounded-lg px-4 py-3 mb-4 bg-gray-100 text-gray-500" />

            {!isSchool && (
              <>
                <Text className="text-sm text-gray-700 mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Branch", "Branch")} <Text className="text-red-500">*</Text></Text>
                <TextInput editable={false} value={branches.find((b) => b.collegeBranchId === branchId)?.collegeBranchCode || ""} className="border border-gray-200 rounded-lg px-4 py-3 mb-4 bg-gray-100 text-gray-500" />

                <Text className="text-sm font-medium text-gray-700 mb-1">{t("Auto.Common.Semester", "Semester")} <Text className="text-red-500">*</Text></Text>
                <View className="mb-4">
                  <AppPicker
                    selectedValue={semester}
                    onValueChange={setSemester}
                    placeholder={t("Auto.Attr.SelectSemester", "Select Semester")}
                    items={semesters.map((s) => ({ label: `Semester ${s.collegeSemester}`, value: s.collegeSemesterId }))}
                  />
                </View>
              </>
            )}

            <Text className="text-sm font-medium text-gray-700 mb-1">{t("Auto.Common.Sections", "Sections")} <Text className="text-red-500">*</Text></Text>
            <View className="border border-gray-300 rounded-lg p-2 mb-6">
              {sections.map((s) => {
                const isSelected = sectionIds.includes(s.collegeSectionsId);
                return (
                  <TouchableOpacity
                    key={s.collegeSectionsId}
                    onPress={() => setSectionIds((prev) => isSelected ? prev.filter((id) => id !== s.collegeSectionsId) : [...prev, s.collegeSectionsId])}
                    className="flex-row items-center gap-3 py-2 px-2">
                    <View className={`w-5 h-5 rounded border items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                      {isSelected && <Check size={14} color="white" weight="bold" />}
                    </View>
                    <Text className="text-gray-700">{s.collegeSections}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              disabled={isSubmitting}
              onPress={handleSave}
              className="bg-[#14234B] rounded-lg py-4 items-center justify-center flex-row shadow-sm">
              {isSubmitting ? <ActivityIndicator color="#fff" className="mr-2" /> : null}
              <Text className="text-white font-bold text-[15px]">
                {mode === "edit" ? t("Calendar.faculty.updateEvent", "Update Event") : t("Calendar.faculty.saveEvent", "Save Event")}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}