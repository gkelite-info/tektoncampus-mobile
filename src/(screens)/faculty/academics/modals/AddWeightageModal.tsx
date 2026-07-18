import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/AppText';
import React, { useState, useEffect, useMemo } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, FlatList } from 'react-native';
import { Trash, PlusCircle, WarningCircle, CheckCircle, CaretDown } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import { useFaculty } from '@/utils/context/faculty/useFaculty';
import { CardProps } from '@/lib/types/faculty';
import { fetchFacultyWeightageConfigs, saveFacultyWeightageConfig, fetchExistingFacultyWeightageConfig } from '@/lib/helpers/subjectWeightage/weightageConfig';
import { fetchFacultyWeightageItems, saveFacultyWeightageItem } from '@/lib/helpers/subjectWeightage/weightageItems';
import { useUser } from '@/utils/context/UserContext';
import { isSchoolEducation } from '@/lib/helpers/admin/academicSetup/schoolHelper';
import { fetchFacultyContext } from '@/utils/context/faculty/facultyContextAPI';
import { getFacultySubjects } from '@/lib/helpers/faculty/getFacultySubjects';

type AddWeightageModalProps = {
  visible: boolean;
  onClose: () => void;
  subjectDetails: CardProps | null;
};
type WeightItem = {
  id: string;
  facultyWeightageItemId?: number;
  label: string;
  value: string;
  isCustom: boolean;
};
export default function AddWeightageModal({
  visible,
  onClose,
  subjectDetails
}: AddWeightageModalProps) {
  const {
    t
  } = useTranslation();
  const {
    facultyId
  } = useFaculty();
  const { userId, collegeId, collegeEducationType } = useUser();
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [subjects, setSubjects] = useState<CardProps[]>([]);
  const [facultyCtx, setFacultyCtx] = useState<any>(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(subjectDetails?.collegeSubjectId || null);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(subjectDetails?.collegeAcademicYearId || null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(subjectDetails?.collegeSectionId || null);
  const [dropdownType, setDropdownType] = useState<'subject' | 'year' | 'section' | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!visible || !userId || !collegeId) return;
      try {
        const ctx = await fetchFacultyContext(userId as number);
        if (ctx && ctx.subjectIds?.length) {
          setFacultyCtx(ctx);
          const data = await getFacultySubjects({
            collegeId: collegeId as number,
            collegeEducationId: ctx.collegeEducationId,
            collegeBranchId: ctx.collegeBranchId,
            academicYearIds: ctx.academicYearIds,
            subjectIds: ctx.subjectIds,
            sectionIds: ctx.sectionIds
          });
          setSubjects(data);
        }
      } catch (e) {
        console.error("Failed to load faculty contexts for modal", e);
      }
    }
    loadData();
  }, [visible, userId, collegeId]);

  useEffect(() => {
    if (subjectDetails) {
      setSelectedSubjectId(subjectDetails.collegeSubjectId);
      setSelectedYearId(subjectDetails.collegeAcademicYearId);
      setSelectedSectionId(subjectDetails.collegeSectionId ?? null);
    }
  }, [subjectDetails]);

  const selectedCard = useMemo(() => {
    if (!subjects.length) return subjectDetails;
    return subjects.find(s => s.collegeSubjectId === selectedSubjectId && s.collegeSectionId === selectedSectionId && s.collegeAcademicYearId === selectedYearId) || subjectDetails;
  }, [subjects, selectedSubjectId, selectedSectionId, selectedYearId, subjectDetails]);
  const [activeWeights, setActiveWeights] = useState<WeightItem[]>([{
    id: "attendance",
    label: "Attendance",
    value: "50%",
    isCustom: false
  }, {
    id: "quiz",
    label: "Quiz",
    value: "50%",
    isCustom: false
  }]);
  const [availableOptions, setAvailableOptions] = useState(["Lab", "Assignments", "Exams"]);
  const resetToDefaultWeights = () => {
    setActiveWeights([{
      id: "attendance",
      label: "Attendance",
      value: "50%",
      isCustom: false
    }, {
      id: "quiz",
      label: "Quiz",
      value: "50%",
      isCustom: false
    }]);
    setAvailableOptions(["Lab", "Assignments", "Exams"]);
  };
  useEffect(() => {
    async function loadExistingWeightages() {
      if (!visible || !selectedCard?.collegeSubjectId || !selectedCard?.collegeSectionId) return;
      try {
        setLoading(true);
        const isSchool = isSchoolEducation(collegeEducationType);
        const configs = await fetchFacultyWeightageConfigs(
          selectedCard.collegeSubjectId,
          selectedCard.collegeSectionId,
          isSchool ? null : selectedCard.collegeSemesterId
        );
        if (configs && configs.length > 0) {
          const configId = configs[0].facultyWeightageConfigId;
          const items = await fetchFacultyWeightageItems(configId);
          if (items.length > 0) {
            const mappedWeights = items.map(item => ({
              id: item.facultyWeightageItemId.toString(),
              facultyWeightageItemId: item.facultyWeightageItemId,
              label: item.label,
              value: `${item.percentage}%`,
              isCustom: item.isCustom
            }));
            setActiveWeights(mappedWeights);
            const usedLabels = items.map(i => i.label);
            const defaultOptions = ["Lab", "Assignments", "Exams"];
            setAvailableOptions(defaultOptions.filter(opt => !usedLabels.includes(opt)));
            return;
          }
        }
        resetToDefaultWeights();
      } catch (err) {
        Toast.show({
          type: "error",
          text1: "Failed to load weightages"
        });
      } finally {
        setLoading(false);
      }
    }
    loadExistingWeightages();
  }, [selectedCard, visible, collegeEducationType]);
  const totalPercentage = useMemo(() => {
    return activeWeights.reduce((sum, item) => {
      const num = parseFloat(item.value.replace("%", "")) || 0;
      return sum + num;
    }, 0);
  }, [activeWeights]);
  const isTotalValid = totalPercentage === 100;
  const handleAddItem = (item: string) => {
    setActiveWeights([...activeWeights, {
      id: item.toLowerCase(),
      label: item,
      value: "",
      isCustom: false
    }]);
    setAvailableOptions(availableOptions.filter(opt => opt !== item));
  };
  const handleAddOther = () => {
    setActiveWeights([...activeWeights, {
      id: "other-" + Math.random(),
      label: "",
      value: "",
      isCustom: true
    }]);
  };
  const handleRemoveItem = (id: string, label: string, isCustom: boolean) => {
    setActiveWeights(activeWeights.filter(item => item.id !== id));
    if (!isCustom) {
      setAvailableOptions(prev => [...prev, label].sort());
    }
  };
  const handleValueChange = (id: string, newValue: string) => {
    setActiveWeights(prev => prev.map(item => {
      if (item.id === id) {
        const numericValue = newValue.replace(/[^0-9.]/g, "");
        return {
          ...item,
          value: numericValue ? `${numericValue}%` : ""
        };
      }
      return item;
    }));
  };
  const handleSave = async () => {
    if (!isTotalValid || !selectedCard?.collegeSubjectId || !selectedCard?.collegeSectionId) return;
    setIsSaving(true);
    const isSchool = isSchoolEducation(collegeEducationType);
    try {
      const existingConfig = await fetchExistingFacultyWeightageConfig(
        selectedCard.collegeSubjectId,
        selectedCard.collegeSectionId,
        isSchool ? null : selectedCard.collegeSemesterId
      );
      const configId = existingConfig?.data?.facultyWeightageConfigId;
      const configResponse = await saveFacultyWeightageConfig({
        facultyWeightageConfigId: configId,
        collegeId: selectedCard.collegeId,
        collegeEducationId: selectedCard.collegeEducationId,
        collegeBranchId: isSchool ? null : (selectedCard.collegeBranchId || null),
        collegeSubjectId: selectedCard.collegeSubjectId,
        collegeSectionsId: selectedCard.collegeSectionId,
        collegeSemesterId: isSchool ? null : (selectedCard.collegeSemesterId || null),
        totalPercentage: totalPercentage
      }, {
        facultyId: facultyId || undefined
      });
      if (!configResponse.success) throw new Error("Config Save Failed");
      const targetConfigId = configResponse.facultyWeightageConfigId;
      const itemPromises = activeWeights.map(item => {
        return saveFacultyWeightageItem({
          facultyWeightageItemId: item.facultyWeightageItemId,
          facultyWeightageConfigId: targetConfigId!,
          label: item.label,
          percentage: parseFloat(item.value.replace("%", "")),
          isCustom: item.isCustom
        });
      });
      await Promise.all(itemPromises);
      Toast.show({
        type: "success",
        text1: "Saved successfully!"
      });
      onClose();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to update weightage."
      });
    } finally {
      setIsSaving(false);
    }
  };
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <View className="flex-1 bg-white pt-5">
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-xl text-[#282828]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.AddWeightage", "Add Weightage")}</Text>
        <TouchableOpacity onPress={onClose} className="p-2">
          <Text className="text-[#43C17A]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Cancel", "Cancel")}</Text>
        </TouchableOpacity>
      </View>

      {loading ? <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#43C17A" />
        <Text className="text-gray-500 mt-2" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.LoadingWeightag", "Loading Weightages...")}</Text>
      </View> : <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{
        paddingBottom: 100
      }}>

        <View className={`flex-row items-center gap-2 p-3 rounded-lg mb-6 self-start ${isTotalValid ? 'bg-green-100' : 'bg-red-50'}`}>
          {isTotalValid ? <CheckCircle color="#16a34a" weight="fill" /> : <WarningCircle color="#ef4444" weight="fill" />}
          <Text className={`${isTotalValid ? 'text-green-700' : 'text-red-500'}`} style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Total", "Total:")}{totalPercentage}%</Text>
        </View>

        { }
        <View className="flex-col gap-3 mb-6">
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={() => setDropdownType('subject')} className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Subject", "Subject")}</Text>
                <Text className="text-gray-800 text-sm" numberOfLines={1} style={{ fontFamily: fonts.bold }}>{selectedCard?.subjectTitle || "---"}</Text>
              </View>
              <CaretDown size={14} color="#525252" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDropdownType('year')} className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Year", "Year")}</Text>
                <Text className="text-gray-800 text-sm" numberOfLines={1} style={{ fontFamily: fonts.bold }}>{selectedCard?.year || "---"}</Text>
              </View>
              <CaretDown size={14} color="#525252" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDropdownType('section')} className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Section", "Section")}</Text>
                <Text className="text-gray-800 text-sm" numberOfLines={1} style={{ fontFamily: fonts.bold }}>{selectedCard?.sectionName || "---"}</Text>
              </View>
              <CaretDown size={14} color="#525252" />
            </TouchableOpacity>
          </View>
          {!isSchoolEducation(collegeEducationType) && (
            <View className="flex-row gap-3">
              <View className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <Text className="text-xs text-gray-500 mb-1" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Branch", "Branch")}</Text>
                <Text className="text-gray-800 text-sm" numberOfLines={1} style={{ fontFamily: fonts.bold }}>{(selectedCard as any)?.collegeBranchCode || "---"}</Text>
              </View>
              <View className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <Text className="text-xs text-gray-500 mb-1" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Semester", "Semester")}</Text>
                <Text className="text-gray-800 text-sm" numberOfLines={1} style={{ fontFamily: fonts.bold }}>{(selectedCard as any)?.collegeSemesterId || "---"}</Text>
              </View>
            </View>
          )}
        </View>

        <Text className="text-base text-[#282828] mb-3" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.WeightageDistri", "Weightage Distribution")}</Text>

        <View className="bg-[#F0FBF5] border border-[#43C17A]/30 p-4 rounded-xl flex-col gap-6">

          <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex-col gap-3">
            {activeWeights.map(item => {
              return <View key={item.id} className="flex-row items-center gap-2">
                {item.isCustom ? <TextInput className="flex-1 border-b border-gray-200 py-2 px-1 text-sm text-gray-800" placeholder={t("Auto.Attr.Label", "Label...")} value={item.label} onChangeText={val => {
                  setActiveWeights(prev => prev.map(aw => aw.id === item.id ? {
                    ...aw,
                    label: val
                  } : aw));
                }} /> : <Text className="flex-1 text-[#525252]" style={{ fontFamily: fonts.medium }}>{item.label} :</Text>}
                <View className="flex-row items-center gap-2">
                  <TextInput className={`w-16 border rounded-lg p-2 text-center text-sm font-bold ${isTotalValid ? 'border-green-200 text-[#43C17A]' : 'border-gray-200 text-red-400'}`} value={item.value} onChangeText={val => handleValueChange(item.id, val)} placeholder="0%" keyboardType="number-pad" />

                  <TouchableOpacity onPress={() => handleRemoveItem(item.id, item.label, item.isCustom)} className="p-2">
                    <Trash size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>;
            })}
          </View>

          <View className="flex-row flex-wrap gap-2">
            {availableOptions.map(opt => <TouchableOpacity key={opt} onPress={() => handleAddItem(opt)} className="bg-white px-3 py-2 rounded-lg flex-row items-center gap-2 border border-gray-200">
              <PlusCircle size={16} color="#43C17A" />
              <Text className="text-sm text-[#525252]" style={{ fontFamily: fonts.semiBold }}>{opt}</Text>
            </TouchableOpacity>)}
            <TouchableOpacity onPress={handleAddOther} className="bg-white px-3 py-2 rounded-lg flex-row items-center gap-2 border border-dashed border-gray-300">
              <PlusCircle size={16} color="#43C17A" />
              <Text className="text-sm text-[#525252]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Others", "Others")}</Text>
            </TouchableOpacity>
          </View>

        </View>

        {!isTotalValid && <Text className="text-xs text-red-500 mt-2" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Weightagemusteq", "* Weightage must equal exactly 100% to save. (Currently")}
          {totalPercentage}%)
        </Text>}

      </ScrollView>}

      <View className="p-4 border-t border-gray-200 bg-white">
        <TouchableOpacity disabled={isSaving || !isTotalValid} onPress={handleSave} className={`w-full rounded-xl py-3.5 items-center justify-center flex-row gap-2 ${isSaving || !isTotalValid ? 'bg-[#43C17A]/50' : 'bg-[#43C17A]'}`}>

          {isSaving && <ActivityIndicator color="white" size="small" />}
          <Text className="text-white text-base" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.SaveWeightage", "Save Weightage")}</Text>
        </TouchableOpacity>
      </View>
      
      <Modal visible={!!dropdownType} transparent animationType="fade" onRequestClose={() => setDropdownType(null)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setDropdownType(null)} className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white w-full max-h-[60%] rounded-xl overflow-hidden p-4">
            <Text className="text-lg text-[#282828] mb-4" style={{ fontFamily: fonts.bold }}>
              {dropdownType === 'subject' ? 'Select Subject' : dropdownType === 'year' ? 'Select Year' : 'Select Section'}
            </Text>
            <FlatList
              data={
                dropdownType === 'subject'
                  ? Array.from(new Map(subjects.map(s => [s.collegeSubjectId, s])).values()).map(s => ({ id: s.collegeSubjectId, title: s.subjectTitle }))
                  : dropdownType === 'year'
                  ? (facultyCtx?.collegeAcademicYears?.map((y: any) => ({ id: y.collegeAcademicYearId, title: y.collegeAcademicYear })) || [])
                  : dropdownType === 'section'
                  ? Array.from(new Map((facultyCtx?.sections || []).filter((s: any) => selectedSubjectId ? s.collegeSubjectId === selectedSubjectId : true).map((s: any) => [s.collegeSectionsId, s])).values()).map((s: any) => ({ id: s.collegeSectionsId, title: s.college_sections?.collegeSections }))
                  : []
              }
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="py-3 border-b border-gray-100 flex-row justify-between items-center"
                  onPress={() => {
                    if (dropdownType === 'subject') {
                      setSelectedSubjectId(item.id as number);
                    } else if (dropdownType === 'year') {
                      setSelectedYearId(item.id as number);
                    } else if (dropdownType === 'section') {
                      setSelectedSectionId(item.id as number);
                    }
                    setDropdownType(null);
                  }}
                >
                  <Text className="text-[#525252] text-sm" style={{ fontFamily: fonts.regular }}>{item.title}</Text>
                  {((dropdownType === 'subject' && selectedSubjectId === item.id) || (dropdownType === 'year' && selectedYearId === item.id) || (dropdownType === 'section' && selectedSectionId === item.id)) && (
                    <View className="w-2 h-2 rounded-full bg-[#43C17A]" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  </Modal>;
}