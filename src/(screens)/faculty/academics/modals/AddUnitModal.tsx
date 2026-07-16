import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts'; import { Text } from '@/components/AppText';
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Switch } from 'react-native';
import { CalendarBlank, Sparkle, Trash, CheckSquare, Square } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';

import { supabase } from '@/lib/supabaseClient';
import { Picker } from '@react-native-picker/picker';
import { useFaculty } from '@/utils/context/faculty/useFaculty';
import { useUser } from '@/utils/context/UserContext';
import { CardProps } from '@/lib/types/faculty';
import { suggestTopicsAction } from '@/lib/helpers/faculty/ai/suggestTopics';
import { generatePdfsForTopics } from '@/lib/helpers/faculty/ai/generateTopicPdf';
import { upsertCollegeSubjectUnitWithTopics } from '@/lib/helpers/faculty/upsertCollegeSubjectUnitWithTopics';
import { fetchFacultyContext } from '@/utils/context/faculty/facultyContextAPI';
import { saveAcademicUnit } from '@/lib/helpers/faculty/saveAcademicUnit';
import { isSchoolEducation } from '@/lib/helpers/admin/academicSetup/schoolHelper';

type AddUnitModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  subjectDetails: CardProps | null;
};

type StagedTopic = {
  title: string;
  selected: boolean;
};

export default function AddUnitModal({ visible, onClose, onSave, subjectDetails }: AddUnitModalProps) {
  const { t } = useTranslation();
  const { facultyId, faculty_edu_type } = useFaculty();
  const { role, userId, collegeEducationType } = useUser();

  const [unitName, setUnitName] = useState("");
  const [unitNumber, setUnitNumber] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [stagedTopics, setStagedTopics] = useState<StagedTopic[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [generatePdfs, setGeneratePdfs] = useState(true);

  const [semestersList, setSemestersList] = useState<any[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);

  React.useEffect(() => {
    if (!visible || !userId || !subjectDetails) return;

    // Fetch semesters list
    supabase.from('college_semester').
      select('collegeSemesterId, collegeSemester').
      eq('collegeAcademicYearId', subjectDetails.collegeAcademicYearId).
      then(({ data }) => {
        if (data) {
          setSemestersList(data);
          if (subjectDetails.collegeSemesterId) {
            setSelectedSemesterId(subjectDetails.collegeSemesterId);
          }
        }
      });

  }, [visible, userId, subjectDetails]);

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      if (!topics.includes(newTopic.trim())) {
        setTopics([...topics, newTopic.trim()]);
      }
      setNewTopic("");
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleSuggestTopics = async (searchUnitName: string) => {
    if (!subjectDetails?.subjectTitle) {
      return;
    }
    if (!searchUnitName.trim()) {
      return;
    }

    try {
      setIsSuggesting(true);
      const suggestions = await suggestTopicsAction(
        subjectDetails.subjectTitle,
        searchUnitName.trim(),
        faculty_edu_type || "Education",
        subjectDetails.branchCode || "Branch"
      );

      if (suggestions.length === 1 && suggestions[0] === "The unit name does not match the selected subject.") {
        return;
      }

      if (suggestions.length > 0) {

        const newSuggestions = suggestions.filter((s) => !topics.includes(s));
        setStagedTopics(newSuggestions.map((s) => ({ title: s, selected: false })));
      } else {
        setStagedTopics([]);
      }
    } catch (err: any) {
      console.log("AI Suggestion error", err);
    } finally {
      setIsSuggesting(false);
    }
  };

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (unitName.trim().length > 2) {
        handleSuggestTopics(unitName);
      } else {
        setStagedTopics([]);
      }
    }, 900);
    return () => clearTimeout(delayDebounceFn);
  }, [unitName]);

  const toggleAllStaged = () => {
    const allSelected = stagedTopics.every((t) => t.selected);
    setStagedTopics((prev) => prev.map((t) => ({ ...t, selected: !allSelected })));
  };

  const handleAddSelectedStaged = () => {
    const selected = stagedTopics.filter((t) => t.selected).map((t) => t.title);
    if (selected.length > 0) {
      setTopics((prev) => [...prev, ...selected]);
      setStagedTopics((prev) => prev.filter((t) => !t.selected));
    }
  };

  const toggleStagedTopic = (index: number) => {
    setStagedTopics((prev) => prev.map((t, i) => i === index ? { ...t, selected: !t.selected } : t));
  };

  const handleAddStagedTopic = (topicTitle: string) => {
    if (!topics.includes(topicTitle)) {
      setTopics([...topics, topicTitle]);
      setStagedTopics((prev) => prev.filter((t) => t.title !== topicTitle));
    }
  };

  const handleSave = async () => {
    if (!subjectDetails) return;
    if (!facultyId) {
      Toast.show({ type: "error", text1: "Error", text2: "Faculty ID is missing." });
      return;
    }

    const isSchool = isSchoolEducation(collegeEducationType);

    if (!unitName.trim()) {
      Toast.show({ type: "error", text1: "Please enter unit name" });
      return;
    }
    if (!unitNumber || isNaN(Number(unitNumber))) {
      Toast.show({ type: "error", text1: "Please enter a valid unit number" });
      return;
    }
    if (topics.length === 0) {
      Toast.show({ type: "error", text1: "Please add at least one topic" });
      return;
    }
    if (!subjectDetails.collegeSectionId) {
      Toast.show({ type: "error", text1: "No section assigned to this subject" });
      return;
    }
    if (!isSchool && faculty_edu_type !== 'Inter' && !selectedSemesterId) {
      Toast.show({ type: "error", text1: "Please select a semester" });
      return;
    }

    try {
      setIsSaving(true);

      const result = await upsertCollegeSubjectUnitWithTopics({
        collegeId: subjectDetails.collegeId,
        collegeSubjectId: subjectDetails.collegeSubjectId,
        createdBy: facultyId,
        unitNumber: Number(unitNumber),
        unitTitle: unitName.trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        topics: topics
      });

      if (!result.success) {
        throw new Error("Failed to upsert unit");
      }

      const unitId = result.collegeSubjectUnitId;


      await saveAcademicUnit({
        collegeId: subjectDetails.collegeId,
        collegeEducationId: subjectDetails.collegeEducationId,
        collegeBranchId: isSchool ? null : (subjectDetails.collegeBranchId || null),
        collegeAcademicYearId: subjectDetails.collegeAcademicYearId,
        collegeSemesterId: isSchool ? null : (selectedSemesterId || subjectDetails.collegeSemesterId || null),
        collegeSubjectId: subjectDetails.collegeSubjectId,
        collegeSectionId: subjectDetails.collegeSectionId,
        collegeSubjectUnitId: unitId,
        createdBy: facultyId
      });

      Toast.show({ type: "success", text1: "Unit saved successfully" });

      if (generatePdfs && result.topics.length > 0) {
        Toast.show({ type: "info", text1: "Generating PDFs in background..." });

        generatePdfsForTopics({
          topics: result.topics,
          subjectName: subjectDetails.subjectTitle,
          unitName: unitName.trim(),
          branch: (subjectDetails as any).collegeBranchCode || "Branch",
          educationType: (subjectDetails as any).collegeEducationType || "Education",
          collegeId: subjectDetails.collegeId,
          createdBy: facultyId,
          isAdmin: role === "admin" ? 1 : 0
        }).then((results: any[]) => {
          const successes = results.filter((r: any) => r.status === "success").length;
          const fails = results.filter((r: any) => r.status === "failed").length;
          if (fails > 0) {
            Toast.show({ type: "error", text1: `Failed to generate ${fails} PDF(s)` });
          } else {
            Toast.show({ type: "success", text1: `${successes} PDFs generated successfully!` });
          }
        }).catch((err: any) => {
          Toast.show({ type: "error", text1: "Error generating PDFs in background" });
        });
      }


      setUnitName("");
      setUnitNumber((Number(unitNumber) + 1).toString());
      setStartDate("");
      setEndDate("");
      setTopics([]);
      setStagedTopics([]);

      onSave();
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to save unit", text2: err?.message || JSON.stringify(err) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 pt-10">
        <View className="flex-1 bg-white rounded-t-3xl">
          <View className="px-6 py-5 border-b border-gray-100 flex-row items-center justify-between">
            <Text className="text-xl text-[#282828]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.AddUnit", "Add Unit")}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-[#43C17A] text-sm" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Cancel", "Cancel")}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-5" contentContainerStyle={{ paddingBottom: 100 }}>
            <Text className="text-[#525252] text-xs mb-6" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Trackprogressad", "Track progress, add lessons, and manage course content across all your batches.")}

            </Text>

            { }
            <View className="flex-row flex-wrap gap-x-4 gap-y-4 mb-6">
              <View className="w-[47%]">
                <Text className="text-sm text-[#282828] mb-1.5" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Education", "Education")}</Text>
                <TextInput value={faculty_edu_type || ""} editable={false} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-gray-50 opacity-70" />
              </View>
              {!isSchoolEducation(collegeEducationType) && (
                <View className="w-[47%]">
                  <Text className="text-sm text-[#282828] mb-1.5" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Branch", "Branch")}</Text>
                  <TextInput value={subjectDetails?.branchCode || ""} editable={false} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-gray-50 opacity-70" />
                </View>
              )}
              <View className="w-[47%]">
                <Text className="text-sm text-[#282828] mb-1.5" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Year", "Year")}</Text>
                <TextInput value={subjectDetails?.year || ""} editable={false} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-gray-50 opacity-70" />
              </View>
              {!isSchoolEducation(collegeEducationType) && faculty_edu_type !== 'Inter' && (
                <View className="w-[47%]">
                  <Text className="text-sm text-[#282828] mb-1.5" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Semester", "Semester")}</Text>
                  <View className="w-full border border-gray-300 rounded-lg bg-white overflow-hidden h-[42px] justify-center">
                    <Picker
                      selectedValue={selectedSemesterId}
                      onValueChange={(val) => setSelectedSemesterId(val)}
                      style={{ height: 42, width: '100%', color: selectedSemesterId ? '#111827' : '#9ca3af' }}>

                      <Picker.Item label={t("Auto.Attr.Choosesemester", "Choose semester")} value={null} color="#9ca3af" />
                      {semestersList.map((s) =>
                        <Picker.Item key={s.collegeSemesterId} label={`Semester ${s.collegeSemester}`} value={s.collegeSemesterId} color="#111827" />
                      )}
                    </Picker>
                  </View>
                </View>
              )}
              <View className="w-full mt-2">
                <Text className="text-sm text-[#282828] mb-1.5" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.SubjectName", "Subject Name")}</Text>
                <TextInput value={subjectDetails?.subjectTitle || ""} editable={false} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-gray-50 opacity-70" style={{ fontFamily: fonts.regular }} />
              </View>
            </View>

            { }
            <View className="mb-6 z-50">
              <Text className="text-sm text-[#282828] mb-1.5" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.UnitName", "Unit Name *")}</Text>
              <TextInput
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white"
                placeholder={t("Auto.Attr.Enterunitname", "Enter unit name")}
                value={unitName}
                onChangeText={setUnitName}
                style={{ fontFamily: fonts.regular }} />
              { }
              {unitName && (stagedTopics.length > 0 || isSuggesting) &&
                <View className="mt-3 border border-[#BBF7D0] bg-[#F0FDF4] rounded-lg p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xs text-[#43C17A]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.AISuggestedTopi", "AI Suggested Topics")}</Text>
                    {!isSuggesting && stagedTopics.length > 0 &&
                      <View className="flex-row items-center gap-3">
                        <TouchableOpacity onPress={toggleAllStaged} className="flex-row items-center gap-1">
                          {stagedTopics.every((t) => t.selected) ?
                            <CheckSquare size={16} color="#43C17A" weight="fill" /> :

                            <Square size={16} color="#43C17A" />
                          }
                          <Text className="text-[10px] text-[#43C17A]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.SelectAll", "Select All")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleAddSelectedStaged} className="bg-[#43C17A] px-2 py-1 rounded">
                          <Text className="text-white text-[10px]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.AddSelected", "Add Selected")}</Text>
                        </TouchableOpacity>
                      </View>
                    }
                  </View>
                  {isSuggesting ?
                    <View className="flex-row items-center gap-2">
                      <ActivityIndicator size="small" color="#43C17A" />
                      <Text className="text-xs text-[#43C17A]" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Generatingtopic", "Generating topics...")}</Text>
                    </View> :

                    <View className="flex-row flex-wrap gap-2">
                      {stagedTopics.map((topic, i) =>
                        <TouchableOpacity
                          key={i}
                          onPress={() => toggleStagedTopic(i)}
                          className={`flex-row items-center gap-1.5 border rounded-full px-3 py-1.5 ${topic.selected ? 'bg-[#43C17A]/20 border-[#43C17A]' : 'bg-white border-[#D1FAE5]'}`}>

                          <Text className="text-xs text-[#43C17A]" style={{ fontFamily: fonts.bold }}>{topic.selected ? '✓' : '+'}</Text>
                          <Text className="text-xs text-[#065F46]" style={{ fontFamily: fonts.medium }}>{topic.title}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  }
                </View>
              }

              { }
              {topics.length > 0 &&
                <View className="flex-row flex-wrap gap-2 mt-3">
                  {topics.map((topic, index) =>
                    <View key={index} className="flex-row items-center gap-1.5 bg-white border border-[#D1FAE5] rounded-full px-3 py-1.5">
                      <Text className="text-xs text-[#065F46]" style={{ fontFamily: fonts.medium }}>{topic}</Text>
                      <TouchableOpacity onPress={() => handleRemoveTopic(index)}>
                        <Text className="text-red-500 ml-1" style={{ fontFamily: fonts.bold }}>×</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              }

              { }
              <View className="flex-row items-center gap-2 mt-4">
                <TextInput
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 bg-white"
                  placeholder={t("Auto.Attr.Typetoaddcustom", "Type to add custom topic...")}
                  value={newTopic}
                  onChangeText={setNewTopic}
                  onSubmitEditing={handleAddTopic}
                  style={{ fontFamily: fonts.regular }} />

                <TouchableOpacity onPress={handleAddTopic} className="bg-[#43C17A] px-4 py-2.5 rounded-lg">
                  <Text className="text-white text-xs" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Add", "Add")}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm text-[#282828] mb-1.5" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.UnitNumber", "Unit Number *")}</Text>
              <TextInput
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white"
                placeholder={t("Auto.Attr.Enterunitnumber", "Enter unit number")}
                keyboardType="number-pad"
                value={unitNumber}
                onChangeText={setUnitNumber}
                style={{ fontFamily: 'Inter-Regular' }} />

            </View>

          </ScrollView>

          <View className="p-4 border-t border-gray-200 bg-white">
            <TouchableOpacity
              disabled={isSaving}
              onPress={handleSave}
              className={`w-full rounded-xl py-3.5 items-center justify-center flex-row gap-2 ${isSaving ? 'bg-[#43C17A]/50' : 'bg-[#43C17A]'}`}>

              {isSaving && <ActivityIndicator color="white" size="small" />}
              <Text className="text-white text-base" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.SaveUnit", "Save Unit")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>);

}