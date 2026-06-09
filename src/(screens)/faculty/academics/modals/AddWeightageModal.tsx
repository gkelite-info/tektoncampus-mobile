import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Trash, PlusCircle, WarningCircle, CheckCircle } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';

import { useFaculty } from '@/utils/context/faculty/useFaculty';
import { CardProps } from '@/lib/types/faculty';

import { fetchFacultyWeightageConfigs, saveFacultyWeightageConfig, fetchExistingFacultyWeightageConfig } from '@/lib/helpers/subjectWeightage/weightageConfig';
import { fetchFacultyWeightageItems, saveFacultyWeightageItem } from '@/lib/helpers/subjectWeightage/weightageItems';

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

export default function AddWeightageModal({ visible, onClose, subjectDetails }: AddWeightageModalProps) {
  const { facultyId } = useFaculty();

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [activeWeights, setActiveWeights] = useState<WeightItem[]>([
    { id: "attendance", label: "Attendance", value: "50%", isCustom: false },
    { id: "quiz", label: "Quiz", value: "50%", isCustom: false },
  ]);

  const [availableOptions, setAvailableOptions] = useState(["Lab", "Assignments", "Exams"]);

  const resetToDefaultWeights = () => {
    setActiveWeights([
      { id: "attendance", label: "Attendance", value: "50%", isCustom: false },
      { id: "quiz", label: "Quiz", value: "50%", isCustom: false },
    ]);
    setAvailableOptions(["Lab", "Assignments", "Exams"]);
  };

  useEffect(() => {
    async function loadExistingWeightages() {
      if (!visible || !subjectDetails?.collegeSubjectId || !subjectDetails?.collegeSectionId) return;

      try {
        setLoading(true);
        const configs = await fetchFacultyWeightageConfigs(
          subjectDetails.collegeSubjectId,
          subjectDetails.collegeSectionId,
          subjectDetails.collegeSemesterId
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
        Toast.show({ type: "error", text1: "Failed to load weightages" });
      } finally {
        setLoading(false);
      }
    }

    loadExistingWeightages();
  }, [subjectDetails, visible]);

  const totalPercentage = useMemo(() => {
    return activeWeights.reduce((sum, item) => {
      const num = parseFloat(item.value.replace("%", "")) || 0;
      return sum + num;
    }, 0);
  }, [activeWeights]);

  const isTotalValid = totalPercentage === 100;

  const handleAddItem = (item: string) => {
    setActiveWeights([...activeWeights, { id: item.toLowerCase(), label: item, value: "", isCustom: false }]);
    setAvailableOptions(availableOptions.filter(opt => opt !== item));
  };

  const handleAddOther = () => {
    setActiveWeights([...activeWeights, { id: "other-" + Math.random(), label: "", value: "", isCustom: true }]);
  };

  const handleRemoveItem = (id: string, label: string, isCustom: boolean) => {
    setActiveWeights(activeWeights.filter(item => item.id !== id));
    if (!isCustom) {
        setAvailableOptions((prev) => [...prev, label].sort());
    }
  };

  const handleValueChange = (id: string, newValue: string) => {
    setActiveWeights(prev => prev.map(item => {
      if (item.id === id) {
        const numericValue = newValue.replace(/[^0-9.]/g, "");
        return { ...item, value: numericValue ? `${numericValue}%` : "" };
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!isTotalValid || !subjectDetails?.collegeSubjectId || !subjectDetails?.collegeSectionId) return;

    setIsSaving(true);
    try {
      const existingConfig = await fetchExistingFacultyWeightageConfig(
        subjectDetails.collegeSubjectId,
        subjectDetails.collegeSectionId,
        subjectDetails.collegeSemesterId
      );

      const configId = existingConfig?.data?.facultyWeightageConfigId;

      const configResponse = await saveFacultyWeightageConfig({
        facultyWeightageConfigId: configId,
        collegeId: subjectDetails.collegeId,
        collegeEducationId: subjectDetails.collegeEducationId,
        collegeBranchId: subjectDetails.collegeBranchId || 0,
        collegeSubjectId: subjectDetails.collegeSubjectId,
        collegeSectionsId: subjectDetails.collegeSectionId,
        collegeSemesterId: subjectDetails.collegeSemesterId,
        totalPercentage: totalPercentage,
      }, {
        facultyId: facultyId || undefined
      });

      if (!configResponse.success) throw new Error("Config Save Failed");
      const targetConfigId = configResponse.facultyWeightageConfigId;

      const itemPromises = activeWeights.map((item) => {
        return saveFacultyWeightageItem({
          facultyWeightageItemId: item.facultyWeightageItemId,
          facultyWeightageConfigId: targetConfigId!,
          label: item.label,
          percentage: parseFloat(item.value.replace("%", "")),
          isCustom: item.isCustom
        });
      });

      await Promise.all(itemPromises);

      Toast.show({ type: "success", text1: "Saved successfully!" });
      onClose();
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to update weightage." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white pt-5">
        <View className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-[#282828]">Add Weightage</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-[#43C17A] font-bold">Cancel</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-500 mt-2">Loading Weightages...</Text>
            </View>
        ) : (
            <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
            
                <View className={`flex-row items-center gap-2 p-3 rounded-lg mb-6 self-start ${isTotalValid ? 'bg-green-100' : 'bg-red-50'}`}>
                    {isTotalValid ? <CheckCircle color="#16a34a" weight="fill" /> : <WarningCircle color="#ef4444" weight="fill" />}
                    <Text className={`font-bold ${isTotalValid ? 'text-green-700' : 'text-red-500'}`}>Total: {totalPercentage}%</Text>
                </View>

                {/* Read-only Context */}
                <View className="flex-col gap-3 mb-6">
                    <View className="flex-row gap-3">
                        <View className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <Text className="text-xs text-gray-500 mb-1">Subject</Text>
                            <Text className="font-bold text-gray-800 text-sm" numberOfLines={1}>{subjectDetails?.subjectTitle || "---"}</Text>
                        </View>
                        <View className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <Text className="text-xs text-gray-500 mb-1">Section</Text>
                            <Text className="font-bold text-gray-800 text-sm" numberOfLines={1}>{subjectDetails?.sectionName || "---"}</Text>
                        </View>
                    </View>
                    <View className="flex-row gap-3">
                        <View className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <Text className="text-xs text-gray-500 mb-1">Branch</Text>
                            <Text className="font-bold text-gray-800 text-sm" numberOfLines={1}>{(subjectDetails as any)?.collegeBranchCode || "---"}</Text>
                        </View>
                        <View className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <Text className="text-xs text-gray-500 mb-1">Semester</Text>
                            <Text className="font-bold text-gray-800 text-sm" numberOfLines={1}>{(subjectDetails as any)?.collegeSemesterId || "---"}</Text>
                        </View>
                    </View>
                </View>

                <Text className="text-base font-bold text-[#282828] mb-3">Weightage Distribution</Text>
                
                <View className="bg-[#F0FBF5] border border-[#43C17A]/30 p-4 rounded-xl flex-col gap-6">
                    
                    <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex-col gap-3">
                        {activeWeights.map((item) => (
                            <View key={item.id} className="flex-row items-center gap-2">
                                {item.isCustom ? (
                                    <TextInput
                                        className="flex-1 border-b border-gray-200 py-2 px-1 text-sm text-gray-800"
                                        placeholder="Label..."
                                        value={item.label}
                                        onChangeText={(val) => {
                                            setActiveWeights(prev => prev.map(aw => aw.id === item.id ? { ...aw, label: val } : aw));
                                        }}
                                    />
                                ) : (
                                    <Text className="flex-1 font-medium text-[#525252]">{item.label} :</Text>
                                )}
                                <View className="flex-row items-center gap-2">
                                    <TextInput
                                        className={`w-16 border rounded-lg p-2 text-center text-sm font-bold ${isTotalValid ? 'border-green-200 text-[#43C17A]' : 'border-gray-200 text-red-400'}`}
                                        value={item.value}
                                        onChangeText={(val) => handleValueChange(item.id, val)}
                                        placeholder="0%"
                                        keyboardType="number-pad"
                                    />
                                    <TouchableOpacity onPress={() => handleRemoveItem(item.id, item.label, item.isCustom)} className="p-2">
                                        <Trash size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                        {availableOptions.map((opt) => (
                            <TouchableOpacity key={opt} onPress={() => handleAddItem(opt)} className="bg-white px-3 py-2 rounded-lg flex-row items-center gap-2 border border-gray-200">
                                <PlusCircle size={16} color="#43C17A" />
                                <Text className="text-sm font-semibold text-[#525252]">{opt}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={handleAddOther} className="bg-white px-3 py-2 rounded-lg flex-row items-center gap-2 border border-dashed border-gray-300">
                            <PlusCircle size={16} color="#43C17A" />
                            <Text className="text-sm font-semibold text-[#525252]">Others</Text>
                        </TouchableOpacity>
                    </View>

                </View>

                {!isTotalValid && (
                    <Text className="text-xs text-red-500 mt-2 font-medium">
                        * Weightage must equal exactly 100% to save. (Currently {totalPercentage}%)
                    </Text>
                )}

            </ScrollView>
        )}

        <View className="p-4 border-t border-gray-200 bg-white">
          <TouchableOpacity
            disabled={isSaving || !isTotalValid}
            onPress={handleSave}
            className={`w-full rounded-xl py-3.5 items-center justify-center flex-row gap-2 ${isSaving || !isTotalValid ? 'bg-[#43C17A]/50' : 'bg-[#43C17A]'}`}
          >
            {isSaving && <ActivityIndicator color="white" size="small" />}
            <Text className="text-white font-bold text-base">Save Weightage</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
