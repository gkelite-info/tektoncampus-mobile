import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/AppText';
import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Image, Modal } from 'react-native';
import { CaretDown, CheckCircle, PencilSimple, User, XCircle, NotePencil, Prohibit } from 'phosphor-react-native';
import { UIStudent, ClassOption, SectionOption } from '@/lib/helpers/faculty/attendance/attendanceActions';
interface Props {
  students: UIStudent[];
  setStudents: (students: UIStudent[]) => void;
  saving: boolean;
  isTopicMode: boolean;
  isEditing: boolean;
  onEditClick: () => void;
  handleSaveAttendance: () => Promise<void>;
  classes?: ClassOption[];
  sections?: SectionOption[];
  selectedClass?: string;
  selectedSection?: string;
  onFilterChange?: (type: "class" | "section" | "calendarType" | "sort", value: string) => void;
  loadingFilters?: boolean;
  onCancelEditClick?: () => void;
  onMarkCancelClick?: () => void;
  isCancellingMode?: boolean;
  calendarType?: "Single" | "Bulk";
  sort: string;
}
function AttendanceToggle({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
}) {
  const {
    t
  } = useTranslation();
  if (disabled) {
    let bg = "bg-gray-100",
      text = "text-gray-600";
    if (value === "Present") {
      bg = "bg-[#43C17A1C]";
      text = "text-[#43C17A]";
    } else if (value === "Absent") {
      bg = "bg-red-100";
      text = "text-red-600";
    } else if (value === "Leave") {
      bg = "bg-blue-100";
      text = "text-blue-600";
    }
    return <View className={`px-3 py-1.5 rounded-lg items-center justify-center ${bg}`}>
        <Text className={`text-xs ${text}`} style={{ fontFamily: fonts.bold }}>{value === "Not Marked" ? "Unmarked" : value}</Text>
      </View>;
  }
  return <View className="flex-row items-center gap-1.5">
      <TouchableOpacity onPress={() => onChange("Present")} className={`w-8 h-8 rounded-full items-center justify-center border ${value === 'Present' ? 'bg-[#43C17A] border-[#43C17A]' : 'bg-white border-gray-300'}`}>
        
        <Text className={`text-xs ${value ==='Present' ? 'text-white' : 'text-gray-500'}`} style={{ fontFamily: fonts.bold }}>{t("Auto.Common.P", "P")}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => onChange("Absent")} className={`w-8 h-8 rounded-full items-center justify-center border ${value === 'Absent' ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'}`}>
        
        <Text className={`text-xs ${value ==='Absent' ? 'text-white' : 'text-gray-500'}`} style={{ fontFamily: fonts.bold }}>{t("Auto.Common.A", "A")}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onChange("Leave")} className={`w-8 h-8 rounded-full items-center justify-center border ${value === 'Leave' ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
        
        <Text className={`text-xs ${value ==='Leave' ? 'text-white' : 'text-gray-500'}`} style={{ fontFamily: fonts.bold }}>{t("Auto.Common.L", "L")}</Text>
      </TouchableOpacity>
    </View>;
}
export default function StuAttendanceTable({
  students,
  setStudents,
  handleSaveAttendance,
  saving,
  isTopicMode,
  isEditing,
  onEditClick,
  classes = [],
  sections = [],
  selectedClass = "",
  selectedSection = "",
  onFilterChange,
  loadingFilters = false,
  onCancelEditClick,
  onMarkCancelClick,
  isCancellingMode,
  calendarType = "Single",
  sort
}: Props) {
  const {
    t
  } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCalendarTypeFilter, setShowCalendarTypeFilter] = useState(false);
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [showSectionFilter, setShowSectionFilter] = useState(false);
  const [showSortFilter, setShowSortFilter] = useState(false);

  const visibleClasses = classes.filter(c => calendarType === "Bulk" ? c.id.startsWith("bulk-") : !c.id.startsWith("bulk-"));
  const filtered = students.filter(s => sort === "All" || s.attendance === sort);
  const updateAttendance = (id: string, value: UIStudent["attendance"]) => {
    if (!isEditing) return;
    setStudents(students.map(s => s.id === id ? {
      ...s,
      attendance: value
    } : s));
  };
  const updateReason = (id: string, value: string) => {
    if (!isEditing) return;
    setStudents(students.map(s => s.id === id ? {
      ...s,
      reason: value
    } : s));
  };
  const toggleSelectAll = () => {
    if (!isEditing) return;
    selectedIds.length === filtered.length ? setSelectedIds([]) : setSelectedIds(filtered.map(s => s.id));
  };
  const toggleSelectOne = (id: string) => {
    if (!isEditing) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const bulkUpdate = (status: UIStudent["attendance"]) => {
    if (!isEditing) return;
    setStudents(students.map(s => selectedIds.includes(s.id) ? {
      ...s,
      attendance: status
    } : s));
    setSelectedIds([]);
  };
  const shouldShowReasonInput = (status: string) => ["Absent", "Leave", "Class Cancel"].includes(status);
  return <View className="flex-1 w-full flex-col space-y-4">
      <View className="flex-col gap-4 mb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3 py-1">
          {!isTopicMode && onFilterChange && (
            <>
              <TouchableOpacity onPress={() => setShowCalendarTypeFilter(true)} className="flex-row items-center bg-[#43C17A1C] px-4 py-2 rounded-full mr-2">
                <Text className="text-[#43C17A] text-sm mr-2" style={{ fontFamily: fonts.medium }}>
                  {calendarType}
                </Text>
                <CaretDown size={14} color="#43C17A" weight="bold" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowClassFilter(true)} className="flex-row items-center bg-[#43C17A1C] px-4 py-2 rounded-full mr-2">
                <Text className="text-[#43C17A] text-sm mr-2" style={{ fontFamily: fonts.medium }}>
                  {visibleClasses.find(c => c.id === selectedClass)?.label || "No Classes Today"}
                </Text>
                <CaretDown size={14} color="#43C17A" weight="bold" />
              </TouchableOpacity>
            </>
          )}

          {!isTopicMode && onFilterChange && (
            <TouchableOpacity onPress={() => setShowSectionFilter(true)} className="flex-row items-center bg-[#43C17A1C] px-4 py-2 rounded-full mr-2">
              <Text className="text-[#43C17A] text-sm mr-2" style={{ fontFamily: fonts.medium }}>
                {sections.find(s => s.id === selectedSection)?.name ? `Section ${sections.find(s => s.id === selectedSection)?.name}` : "All Sections"}
              </Text>
              <CaretDown size={14} color="#43C17A" weight="bold" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={() => setShowSortFilter(true)} className="flex-row items-center bg-[#43C17A1C] px-4 py-2 rounded-full mr-2">
            <Text className="text-[#43C17A] text-sm mr-2" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Sort", "Sort:")}{sort}</Text>
            <CaretDown size={14} color="#43C17A" weight="bold" />
          </TouchableOpacity>
        </ScrollView>

        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            {isEditing && <>
                <TouchableOpacity disabled={!isEditing || loadingFilters} onPress={toggleSelectAll} className={`w-5 h-5 rounded items-center justify-center border ${selectedIds.length === filtered.length && filtered.length > 0 ? 'bg-[#43C17A] border-[#43C17A]' : 'border-gray-300 bg-white'}`}>
                
                  {selectedIds.length === filtered.length && filtered.length > 0 && <CheckCircle size={16} color="white" weight="fill" />}
                </TouchableOpacity>
                <Text className="ml-2 text-sm text-gray-600" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.SelectAll", "Select All")}</Text>
              </>}
          </View>

          {!isEditing ? <TouchableOpacity onPress={onEditClick} disabled={!isTopicMode && !selectedClass || students.length === 0 || loadingFilters} className={`flex-row items-center justify-center gap-2 bg-[#43C17A] px-4 py-2 rounded-lg ${!isTopicMode && !selectedClass || students.length === 0 || loadingFilters ? 'opacity-50' : ''}`}>
            
              <PencilSimple size={16} color="white" weight="bold" />
              <Text className="text-white text-sm" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.EditAttendance", "Edit Attendance")}</Text>
            </TouchableOpacity> : <View className="flex-row items-center gap-2">
              {onCancelEditClick && <TouchableOpacity onPress={onCancelEditClick} className="bg-gray-200 px-3 py-2 rounded-lg">
                  <Text className="text-gray-700 text-sm" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.CancelEdit", "Cancel Edit")}</Text>
                </TouchableOpacity>}
              {onMarkCancelClick && !isCancellingMode && <TouchableOpacity onPress={onMarkCancelClick} className="flex-row items-center justify-center bg-[#FFBB70] px-3 py-2 rounded-lg">
                  <Prohibit size={16} color="white" weight="bold" />
                  <Text className="text-white text-sm ml-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.ClassCancel", "Class Cancel")}</Text>
                </TouchableOpacity>}
              <TouchableOpacity onPress={handleSaveAttendance} disabled={saving || loadingFilters} className={`bg-[#43C17A] px-4 py-2 rounded-lg ${saving ? 'opacity-50' : ''}`}>
              
                <Text className="text-white text-sm" style={{ fontFamily: fonts.medium }}>{saving ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>}
        </View>
      </View>

      {}
      {isEditing && selectedIds.length > 0 && !loadingFilters && <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm mb-4">
          <Text className="text-xs text-gray-500 mr-4 self-center" style={{ fontFamily: fonts.bold }}>{selectedIds.length}{t("Auto.Common.Selected", "Selected")}</Text>
          <TouchableOpacity onPress={() => bulkUpdate("Present")} className="flex-row items-center gap-1 px-3 py-1 bg-[#43C17A] rounded-lg mr-2">
            <CheckCircle color="white" size={16} weight="fill" />
            <Text className="text-white text-xs" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Present", "Present")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => bulkUpdate("Absent")} className="flex-row items-center gap-1 px-3 py-1 bg-red-500 rounded-lg mr-2">
            <XCircle color="white" size={16} weight="fill" />
            <Text className="text-white text-xs" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Absent", "Absent")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => bulkUpdate("Leave")} className="flex-row items-center gap-1 px-3 py-1 bg-blue-500 rounded-lg mr-2">
            <User color="white" size={16} weight="fill" />
            <Text className="text-white text-xs" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Leave", "Leave")}</Text>
          </TouchableOpacity>
        </ScrollView>}

      <View className="flex-1 w-full pb-10">
        {filtered.length > 0 ? filtered.map((s, index) => {
        
        return <View key={s.id} className={`w-full bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 overflow-hidden ${selectedIds.includes(s.id) ? "border-[#43C17A] border-2" : ""}`}>
            <View className="p-4 flex-row items-center justify-between">
                
              <View className="flex-row items-center flex-1">
                {isEditing && <TouchableOpacity disabled={!isEditing} onPress={() => toggleSelectOne(s.id)} className={`w-5 h-5 rounded border items-center justify-center mr-3 ${selectedIds.includes(s.id) ? 'bg-[#43C17A] border-[#43C17A]' : 'border-gray-300'}`}>
                
                    {selectedIds.includes(s.id) && <CheckCircle size={16} color="white" weight="fill" />}
                  </TouchableOpacity>}

                {s.photo ? <Image source={{
                uri: s.photo
              }} className="w-10 h-10 rounded-full bg-gray-200" /> : <View className="w-10 h-10 rounded-full bg-indigo-500 items-center justify-center">
                    <Text className="text-white text-sm" style={{ fontFamily: fonts.bold }}>{s.name?.charAt(0).toUpperCase()}</Text>
                  </View>}

                <View className="ml-3 flex-1 pr-2">
                  <Text className="text-gray-800 text-[15px]" numberOfLines={1} style={{ fontFamily: fonts.bold }}>{s.name}</Text>
                  <Text className="text-gray-500 text-[11px] mt-0.5" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.ID", "ID:")}
                  {s.roll}{t("Auto.Common.Attendance", "\u2022 Attendance:")}{s.percentage}
                  </Text>
                </View>
              </View>

              {}
              <View className="flex-row items-center">
                {s.attendance === "Class Cancel" ? <View className="rounded-lg bg-gray-100 py-1.5 px-3 items-center">
                    <Text className="text-gray-600 text-xs" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Cancelled", "Cancelled")}</Text>
                  </View> : <AttendanceToggle value={s.attendance} onChange={(val: string) => updateAttendance(s.id, val as any)} disabled={!isEditing} />}
              </View>

            </View>

            {}
            {shouldShowReasonInput(s.attendance) && (isEditing ? <View className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex-row items-center">
                  <View className="bg-white rounded-lg px-3 py-2 border border-gray-200 flex-1 flex-row items-center">
                    <TextInput value={s.reason || ""} onChangeText={val => updateReason(s.id, val)} placeholder={t("Auto.Attr.Enterreasonfora", "Enter reason for absence...")} editable={true} className="flex-1 text-xs text-gray-700" />
              
                    <NotePencil size={16} color="#9CA3AF" />
                  </View>
                </View> : s.reason ? <View className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex-row items-center">
                  <Text className="text-xs text-gray-500 flex-1" numberOfLines={3} style={{ fontFamily: fonts.italic }}>{t("Auto.Common.Reason", "Reason:")}
              {s.reason}
                  </Text>
                </View> : null)}
          </View>;
      }) : <View className="py-12 items-center justify-center w-full bg-white rounded-2xl border border-gray-100">
            <Text className="text-gray-400" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Nostudentsfound", "No students found.")}</Text>
          </View>}
      </View>

      <Modal visible={showCalendarTypeFilter} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 min-h-[250px]">
            <Text className="text-lg mb-4" style={{ fontFamily: fonts.bold }}>Select Calendar Type</Text>
            <ScrollView>
              {["Single", "Bulk"].map(t => <TouchableOpacity key={t} onPress={() => {
              onFilterChange && onFilterChange("calendarType", t);
              setShowCalendarTypeFilter(false);
            }} className="py-3 border-b border-gray-100">
                  <Text className={`text-base ${calendarType === t ?'text-[#43C17A] ' : 'text-gray-700'}`} style={{ fontFamily: fonts.bold }}>{t}</Text>
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
              {visibleClasses.map(c => <TouchableOpacity key={c.id} onPress={() => {
              onFilterChange && onFilterChange("class", c.id);
              setShowClassFilter(false);
            }} className="py-3 border-b border-gray-100">
                  <Text className={`text-base ${selectedClass === c.id ?'text-[#43C17A] ' : 'text-gray-700'}`} style={{ fontFamily: fonts.bold }}>{c.label}</Text>
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
              {sections.map(s => (
                <TouchableOpacity key={s.id} onPress={() => {
                  onFilterChange && onFilterChange("section", s.id);
                  setShowSectionFilter(false);
                }} className="py-3 border-b border-gray-100">
                  <Text className={`text-base ${selectedSection === s.id ?'text-[#43C17A] ' : 'text-gray-700'}`} style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Section", "Section")}{s.name}</Text>
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
              onFilterChange && onFilterChange("sort", s);
              setShowSortFilter(false);
            }} className="py-3 border-b border-gray-100">
                  <Text className={`text-base ${sort === s ?'text-[#43C17A] ' : 'text-gray-700'}`} style={{ fontFamily: fonts.bold }}>{s}</Text>
                </TouchableOpacity>)}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowSortFilter(false)} className="mt-4 bg-gray-100 py-3 rounded-xl items-center">
              <Text className="text-gray-700" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Close", "Close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>;
}