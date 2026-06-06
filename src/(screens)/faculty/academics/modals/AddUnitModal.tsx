import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { CaretLeft, Plus, Trash, CalendarBlank } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';

import { supabase } from '@/lib/supabaseClient';
import { useFaculty } from '@/utils/context/faculty/useFaculty';
import { CardProps } from '@/lib/types/faculty';

type AddUnitModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  subjectDetails: CardProps | null;
};

export default function AddUnitModal({ visible, onClose, onSave, subjectDetails }: AddUnitModalProps) {
  const { facultyId } = useFaculty();

  const [unitName, setUnitName] = useState("");
  const [unitNumber, setUnitNumber] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!subjectDetails) return;
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

    try {
      setIsSaving(true);
      const now = new Date().toISOString();

      // Insert Unit
      const { data: unitData, error: unitError } = await supabase
        .from("college_subject_units")
        .insert({
          collegeSubjectId: subjectDetails.collegeSubjectId,
          collegeId: subjectDetails.collegeId,
          unitNumber: Number(unitNumber),
          unitTitle: unitName,
          startDate: startDate || null,
          endDate: endDate || null,
          completionPercentage: 0,
          createdBy: facultyId,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
        .select("collegeSubjectUnitId")
        .single();

      if (unitError) throw unitError;

      const unitId = unitData.collegeSubjectUnitId;

      // Insert Unit mappings (faculty section mapping)
      if (subjectDetails.collegeSectionId) {
          const { error: mappingError } = await supabase
              .from("college_academic_units")
              .insert({
                  collegeId: subjectDetails.collegeId,
                  collegeEducationId: subjectDetails.collegeEducationId,
                  collegeBranchId: subjectDetails.collegeBranchId,
                  collegeAcademicYearId: subjectDetails.collegeAcademicYearId,
                  collegeSemesterId: subjectDetails.collegeSemesterId,
                  collegeSubjectId: subjectDetails.collegeSubjectId,
                  collegeSectionId: subjectDetails.collegeSectionId,
                  collegeSubjectUnitId: unitId,
                  createdBy: facultyId,
                  isActive: true,
              });
          
          if (mappingError) console.error("Academic unit mapping error:", mappingError);
      }

      // Insert Topics
      const topicInserts = topics.map((title, index) => ({
        collegeSubjectUnitId: unitId,
        collegeSubjectId: subjectDetails.collegeSubjectId,
        collegeId: subjectDetails.collegeId,
        topicTitle: title,
        displayOrder: index + 1,
        isCompleted: false,
        createdBy: facultyId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }));

      const { error: topicsError } = await supabase
        .from("college_subject_unit_topics")
        .insert(topicInserts);

      if (topicsError) throw topicsError;

      Toast.show({ type: "success", text1: "Unit saved successfully" });
      
      // Reset form
      setUnitName("");
      setUnitNumber((Number(unitNumber) + 1).toString());
      setStartDate("");
      setEndDate("");
      setTopics([]);
      
      onSave();
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to save unit", text2: err?.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white pt-5">
        <View className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-[#282828]">Add Unit</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-[#43C17A] font-bold">Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
           
          {/* Read-only Context */}
          <View className="bg-gray-50 p-3 rounded-lg mb-4 flex-col gap-2 border border-gray-100">
             <Text className="text-xs text-gray-500 font-medium">Subject: <Text className="font-bold text-gray-800">{subjectDetails?.subjectTitle}</Text></Text>
             <Text className="text-xs text-gray-500 font-medium">Section: <Text className="font-bold text-gray-800">{subjectDetails?.sectionName}</Text></Text>
          </View>

          {/* Form Fields */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-[#282828] mb-1.5">Unit Name *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white"
              placeholder="e.g. Introduction to React Native"
              value={unitName}
              onChangeText={setUnitName}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-[#282828] mb-1.5">Unit Number *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white"
              placeholder="e.g. 1"
              keyboardType="number-pad"
              value={unitNumber}
              onChangeText={setUnitNumber}
            />
          </View>

          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-[#282828] mb-1.5">Start Date</Text>
              <View className="relative justify-center">
                <TextInput
                  className="border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-900 bg-white"
                  placeholder="YYYY-MM-DD"
                  value={startDate}
                  onChangeText={setStartDate}
                />
                <View className="absolute left-3">
                  <CalendarBlank size={18} color="#9ca3af" />
                </View>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-[#282828] mb-1.5">End Date</Text>
              <View className="relative justify-center">
                <TextInput
                  className="border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-900 bg-white"
                  placeholder="YYYY-MM-DD"
                  value={endDate}
                  onChangeText={setEndDate}
                />
                <View className="absolute left-3">
                  <CalendarBlank size={18} color="#9ca3af" />
                </View>
              </View>
            </View>
          </View>

          {/* Topics */}
          <View className="mb-4 mt-2">
            <Text className="text-sm font-semibold text-[#282828] mb-1.5">Topics *</Text>
            
            <View className="flex-col gap-2 mb-3">
              {topics.map((topic, index) => (
                <View key={index} className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <View className="h-1.5 w-1.5 bg-[#43C17A] rounded-full mr-2" />
                  <Text className="flex-1 text-sm text-gray-800">{topic}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTopic(index)} className="p-1">
                    <Trash size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white"
                placeholder="Add a new topic..."
                value={newTopic}
                onChangeText={setNewTopic}
                onSubmitEditing={handleAddTopic}
              />
              <TouchableOpacity 
                onPress={handleAddTopic}
                className="bg-[#43C17A] w-12 h-12 rounded-lg items-center justify-center"
              >
                <Plus size={20} weight="bold" color="white" />
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>

        <View className="p-4 border-t border-gray-200 bg-white">
          <TouchableOpacity
            disabled={isSaving}
            onPress={handleSave}
            className={`w-full rounded-xl py-3.5 items-center justify-center ${isSaving ? 'bg-[#43C17A]/50' : 'bg-[#43C17A]'}`}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-bold text-base">Save Unit</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
