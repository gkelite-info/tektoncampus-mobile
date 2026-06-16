import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, ActivityIndicator } from "react-native";
import Toast from 'react-native-toast-message';
import { X, Check } from "phosphor-react-native";
import { fetchFacultyContext } from "@/utils/context/faculty/facultyContextAPI";
import { useUser } from "@/utils/context/UserContext";
import { fetchAcademicDropdowns } from "@/lib/helpers/faculty/academicDropdown.helper";
import { supabase } from "@/lib/supabaseClient";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Picker } from "@react-native-picker/picker";

const getTodayDateString = () => new Date().toISOString().split("T")[0];

export default function AddEventModal({
  isOpen,
  onClose,
  onSave,
  value,
  mode,
  degreeOptions,
}: any) {
  const { userId, collegeId, loading } = useUser();
  const [facultyCtx, setFacultyCtx] = useState<any>(null);

  
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState("class");
  const [meetingPlatform, setMeetingPlatform] = useState("meet");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [meetingPassword, setMeetingPassword] = useState("");
  const [date, setDate] = useState(new Date());
  
  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState<"AM"|"PM">("AM");
  
  const [endHour, setEndHour] = useState("10");
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState<"AM"|"PM">("AM");
  
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

  // Load context
  useEffect(() => {
    if (!userId || loading || !isOpen) return;
    fetchFacultyContext(userId).then((ctx) => {
      setFacultyCtx(ctx);
      setEducationId(ctx.collegeEducationId);
      setBranchId(ctx.collegeBranchId);
      if (ctx.academicYearIds?.length) setAcademicYearId(ctx.academicYearIds[0]);
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
        
        const { data: subjectRows } = await supabase
          .from("college_subjects")
          .select("collegeSubjectId, subjectName")
          .eq("collegeId", collegeId)
          .eq("collegeEducationId", facultyCtx.collegeEducationId)
          .eq("collegeBranchId", facultyCtx.collegeBranchId)
          .eq("collegeAcademicYearId", facultyCtx.academicYearIds?.[0])
          .in("collegeSubjectId", facultyCtx.subjectIds)
          .eq("isActive", true)
          .is("deletedAt", null);
          
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
    supabase
      .from("college_subject_unit_topics")
      .select("collegeSubjectUnitTopicId, topicTitle")
      .eq("collegeSubjectId", subjectId)
      .eq("collegeId", collegeId)
      .then(({ data }) => setTopics(data || []));
      
    supabase
      .from("college_subjects")
      .select("collegeSemesterId")
      .eq("collegeSubjectId", subjectId)
      .single()
      .then(({ data }) => {
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
    setTopicId(value.topicId || null);
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
    if (!semester) { Toast.show({ type: 'error', text1: "Please select semester" }); return; }
    if (!sectionIds.length) { Toast.show({ type: 'error', text1: "Please select sections" }); return; }
    if (!topicId) { Toast.show({ type: 'error', text1: "Please select a topic" }); return; }
    if (selectedType === "meeting" && !title.trim()) { Toast.show({ type: 'error', text1: "Please enter meeting title" }); return; }

    const startTime = to24Hour(startHour, startMinute, startPeriod);
    const endTime = to24Hour(endHour, endMinute, endPeriod);

    if (startTime >= endTime) { Toast.show({ type: 'error', text1: "End time must be after start time" }); return; }

    const payload = {
      facultyId: userId!,
      subjectId: subjectId!,
      eventTopic: topicId,
      eventTitle: selectedType === "meeting" ? title : subjects.find(s => s.collegeSubjectId === subjectId)?.subjectName,
      type: selectedType,
      date: date.toISOString().split("T")[0],
      fromTime: startTime,
      toTime: endTime,
      collegeRoomId: collegeRoomId!,
      meetingLink: selectedType === "meeting" && meetingPlatform !== "zoom" ? meetingLink : null,
      meetingId: selectedType === "meeting" && meetingPlatform === "zoom" ? meetingId : null,
      meetingPassword: selectedType === "meeting" && meetingPlatform === "zoom" ? meetingPassword : null,
      collegeEducationId: educationId!,
      collegeBranchId: branchId!,
      collegeAcademicYearId: academicYearId!,
      collegeSemesterId: semester!,
      sectionIds,
    };

    setIsSubmitting(true);
    try {
      const res = await onSave(payload);
      if (res?.success !== false) onClose();
    } catch (e) {
      Toast.show({ type: 'error', text1: "Failed to save event" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white h-[90%] rounded-t-3xl overflow-hidden">
          {}
          <View className="flex-row items-center justify-between p-5 border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-800">
              {mode === "edit" ? "Edit Event" : "New Event"}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2 -mr-2 bg-gray-50 rounded-full">
              <X size={20} color="#374151" weight="bold" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 40 }}>
            {}
            <Text className="text-sm font-medium text-gray-700 mb-2">Type</Text>
            <View className="flex-row gap-2 mb-4">
              {["class", "meeting", "exam"].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setSelectedType(t)}
                  className={`flex-1 py-2.5 rounded-lg border items-center ${
                    selectedType === t ? "bg-emerald-500 border-emerald-500" : "bg-white border-gray-300"
                  }`}
                >
                  <Text className={`text-sm font-medium ${selectedType === t ? "text-white" : "text-gray-700"}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {}
            <Text className="text-sm font-medium text-gray-700 mb-1">Subject</Text>
            <View className="border border-gray-300 rounded-lg mb-4 bg-gray-50 overflow-hidden">
              <Picker selectedValue={subjectId} onValueChange={(val) => { setSubjectId(val); setTopicId(null); }}>
                <Picker.Item label="Select Subject" value={undefined} />
                {subjects.map(s => <Picker.Item key={s.collegeSubjectId} label={s.subjectName} value={s.collegeSubjectId} />)}
              </Picker>
            </View>

            {}
            <Text className="text-sm font-medium text-gray-700 mb-1">Topic</Text>
            <View className="border border-gray-300 rounded-lg mb-4 bg-gray-50 overflow-hidden">
              <Picker selectedValue={topicId} onValueChange={setTopicId}>
                <Picker.Item label="Select Topic" value={null} />
                {topics.map(t => <Picker.Item key={t.collegeSubjectUnitTopicId} label={t.topicTitle} value={t.collegeSubjectUnitTopicId} />)}
              </Picker>
            </View>

            {}
            {selectedType === "meeting" && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-1">Meeting Title</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Parent Meeting"
                  className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-800"
                />
                {}
                <Text className="text-sm font-medium text-gray-700 mb-1">Meeting Link</Text>
                <TextInput
                  value={meetingLink}
                  onChangeText={setMeetingLink}
                  placeholder="https://..."
                  className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-800"
                />
              </>
            )}

            {}
            <Text className="text-sm font-medium text-gray-700 mb-1">Date</Text>
            <TouchableOpacity 
              onPress={() => setDatePickerVisibility(true)}
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4 bg-gray-50"
            >
              <Text className="text-gray-800">{date.toDateString()}</Text>
            </TouchableOpacity>
            
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={(d) => { setDate(d); setDatePickerVisibility(false); }}
              onCancel={() => setDatePickerVisibility(false)}
              date={date}
            />

            {}
            <Text className="text-sm font-medium text-gray-700 mb-1">Start Time</Text>
            <View className="flex-row gap-2 mb-4">
              <View className="flex-1 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <Picker selectedValue={startHour} onValueChange={setStartHour}>
                  {Array.from({length:12}, (_,i) => String(i+1).padStart(2,'0')).map(h => <Picker.Item key={h} label={h} value={h} />)}
                </Picker>
              </View>
              <View className="flex-1 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <Picker selectedValue={startMinute} onValueChange={setStartMinute}>
                  {Array.from({length:12}, (_,i) => String(i*5).padStart(2,'0')).map(m => <Picker.Item key={m} label={m} value={m} />)}
                </Picker>
              </View>
              <View className="flex-1 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <Picker selectedValue={startPeriod} onValueChange={setStartPeriod}>
                  <Picker.Item label="AM" value="AM" />
                  <Picker.Item label="PM" value="PM" />
                </Picker>
              </View>
            </View>

            <Text className="text-sm font-medium text-gray-700 mb-1">End Time</Text>
            <View className="flex-row gap-2 mb-4">
              <View className="flex-1 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <Picker selectedValue={endHour} onValueChange={setEndHour}>
                  {Array.from({length:12}, (_,i) => String(i+1).padStart(2,'0')).map(h => <Picker.Item key={h} label={h} value={h} />)}
                </Picker>
              </View>
              <View className="flex-1 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <Picker selectedValue={endMinute} onValueChange={setEndMinute}>
                  {Array.from({length:12}, (_,i) => String(i*5).padStart(2,'0')).map(m => <Picker.Item key={m} label={m} value={m} />)}
                </Picker>
              </View>
              <View className="flex-1 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <Picker selectedValue={endPeriod} onValueChange={setEndPeriod}>
                  <Picker.Item label="AM" value="AM" />
                  <Picker.Item label="PM" value="PM" />
                </Picker>
              </View>
            </View>

            {}
            <Text className="text-sm font-medium text-gray-700 mb-1">Room No.</Text>
            <View className="border border-gray-300 rounded-lg mb-4 bg-gray-50 overflow-hidden">
              <Picker selectedValue={collegeRoomId} onValueChange={setCollegeRoomId}>
                <Picker.Item label="Select Room" value={null} />
                {rooms.map(r => <Picker.Item key={r.collegeRoomId} label={r.roomNo} value={r.collegeRoomId} />)}
              </Picker>
            </View>

            {}
            <Text className="text-sm font-medium text-gray-700 mb-1">Education Type</Text>
            <TextInput editable={false} value={educations.find(e => e.collegeEducationId === educationId)?.collegeEducationType || ""} className="border border-gray-200 rounded-lg px-4 py-3 mb-4 bg-gray-100 text-gray-500" />

            <Text className="text-sm font-medium text-gray-700 mb-1">Branch</Text>
            <TextInput editable={false} value={branches.find(b => b.collegeBranchId === branchId)?.collegeBranchCode || ""} className="border border-gray-200 rounded-lg px-4 py-3 mb-4 bg-gray-100 text-gray-500" />

            <Text className="text-sm font-medium text-gray-700 mb-1">Year</Text>
            <TextInput editable={false} value={academicYears.find(y => y.collegeAcademicYearId === academicYearId)?.collegeAcademicYear || ""} className="border border-gray-200 rounded-lg px-4 py-3 mb-4 bg-gray-100 text-gray-500" />

            <Text className="text-sm font-medium text-gray-700 mb-1">Semester</Text>
            <View className="border border-gray-300 rounded-lg mb-4 bg-gray-50 overflow-hidden">
              <Picker selectedValue={semester} onValueChange={setSemester}>
                <Picker.Item label="Select Semester" value={undefined} />
                {semesters.map(s => <Picker.Item key={s.collegeSemesterId} label={`Semester ${s.collegeSemester}`} value={s.collegeSemesterId} />)}
              </Picker>
            </View>

            {}
            <Text className="text-sm font-medium text-gray-700 mb-1">Sections</Text>
            <View className="border border-gray-300 rounded-lg p-2 mb-6">
              {sections.map(s => {
                const isSelected = sectionIds.includes(s.collegeSectionsId);
                return (
                  <TouchableOpacity
                    key={s.collegeSectionsId}
                    onPress={() => setSectionIds(prev => isSelected ? prev.filter(id => id !== s.collegeSectionsId) : [...prev, s.collegeSectionsId])}
                    className="flex-row items-center gap-3 py-2 px-2"
                  >
                    <View className={`w-5 h-5 rounded border items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                      {isSelected && <Check size={14} color="white" weight="bold" />}
                    </View>
                    <Text className="text-gray-800">{s.collegeSections}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <TouchableOpacity 
              onPress={handleSave}
              disabled={isSubmitting}
              className={`py-4 rounded-xl items-center ${isSubmitting ? 'bg-emerald-400' : 'bg-emerald-500'}`}
            >
              {isSubmitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">{mode === 'edit' ? 'Update Event' : 'Save Event'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
