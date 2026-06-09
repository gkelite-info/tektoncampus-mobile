import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { CaretLeft, CaretDown, CheckCircle, Trash, FilePdf, Clock } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';

import { supabase } from '@/lib/supabaseClient';
import { getUnitsWithTopics, UiUnit, UiTopic } from '@/lib/helpers/faculty/getUnitsWithTopics';
import { CardProps } from '@/lib/types/faculty';

import TopicPdfModal from './modals/TopicPdfModal';
import AddUnitModal from './modals/AddUnitModal';
import AddWeightageModal from './modals/AddWeightageModal';
import { fonts } from '@/constants/fonts';

const colorMap = {
  purple: {
    cardBg: "bg-[#E9E3FF]",
    dot: "bg-[#A66BFF]",
    title: "text-[#3B2A91]",
    accent: "text-[#7E5DFF]",
    solidEnd: "#7E5DFF",
  },
  orange: {
    cardBg: "bg-[#FFEDDA]",
    dot: "bg-[#FFAE4C]",
    title: "text-[#A35300]",
    accent: "text-[#FF8A2A]",
    solidEnd: "#FF8A2A",
  },
  blue: {
    cardBg: "bg-[#CEE6FF]",
    dot: "bg-[#68A4FF]",
    title: "text-[#22518F]",
    accent: "text-[#4C8DFF]",
    solidEnd: "#4C8DFF",
  },
} as const;

function UnitCard({ 
  unit, 
  onMarkComplete,
  onOpenTopicPdf,
  onDeleteTopic,
  onDeleteUnit
}: { 
  unit: UiUnit;
  onMarkComplete: (unitId: number, topics: UiTopic[], percentage: number) => Promise<void>;
  onOpenTopicPdf: (topicId: number, topicTitle: string, unitLabel: string, unitTitle: string) => void;
  onDeleteTopic: (unitId: number, topicId: number) => void;
  onDeleteUnit: (unitId: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localTopics, setLocalTopics] = useState<UiTopic[]>(unit.topics);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const colors = colorMap[unit.color] || colorMap.purple;
  
  useEffect(() => {
    setLocalTopics(unit.topics);
    setIsDirty(false);
  }, [unit.topics]);

  const completedCount = localTopics.filter((t) => t.isCompleted).length;
  const percentage = localTopics.length === 0 ? 0 : Math.round((completedCount / localTopics.length) * 100);

  const handleSave = async () => {
    setIsSaving(true);
    await onMarkComplete(unit.id, localTopics, percentage);
    setIsSaving(false);
    setIsDirty(false);
  };

  return (
    <View className={`rounded-2xl p-4 mb-4 ${colors.cardBg} w-full flex-col`}>
      <TouchableOpacity 
        className="flex-row items-center justify-between mb-2"
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View className="flex-row items-center gap-2">
          <View className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
          <Text className={`text-base ${colors.title}`} style={{ fontFamily: fonts.bold }}>
            {unit.unitLabel}
          </Text>
        </View>
        <CaretDown 
          size={16} 
          weight="bold" 
          color={colors.solidEnd}
          style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      <View className="bg-white rounded-xl p-3 flex-col relative">
        <View className="flex-row justify-between items-start mb-2">
          <Text className={`text-base flex-1 mr-2 ${colors.title}`} style={{ fontFamily: fonts.bold }}>
            {unit.title}
          </Text>
          <TouchableOpacity onPress={() => onDeleteUnit(unit.id)} className="p-1">
            <Trash size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View className="w-full h-2 rounded-full bg-gray-200 overflow-hidden relative my-2">
          <View 
             className="h-full rounded-full" 
             style={{ 
                 width: `${percentage}%`,
                 backgroundColor: colors.solidEnd, 
             }} 
          />
        </View>

        <View className="flex-row items-center justify-between mt-1 mb-2">
          <View className="flex-row items-center gap-1.5">
            <Clock size={12} weight="fill" color={colors.solidEnd} />
            <Text className={`text-[10px] font-semibold ${colors.title}`}>
              {unit.dateRange || "01-01-1970 - 03-17-2026"}
            </Text>
          </View>
          <Text className={`text-base ${colors.title}`} style={{ fontFamily: fonts.bold }}>
            {percentage}%
          </Text>
        </View>

        {isExpanded && (
          <View className="border-t border-gray-100 pt-2 mt-2 flex-col gap-1">
            {localTopics.length === 0 && (
                <Text className="text-gray-400 text-xs text-center" style={{ fontFamily: fonts.italic }}>No topics found</Text>
            )}
            {localTopics.map((topic) => (
              <View key={topic.id} className="flex-row items-start justify-between gap-2 py-1">
                <TouchableOpacity 
                  className="flex-row items-start gap-2 flex-1"
                  onPress={() => {
                    setLocalTopics(prev => prev.map(t => t.id === topic.id ? { ...t, isCompleted: !t.isCompleted } : t));
                    setIsDirty(true);
                  }}
                >
                  <CheckCircle 
                    size={16} 
                    weight={topic.isCompleted ? "fill" : "regular"} 
                    color={colors.solidEnd} 
                    style={{ marginTop: 2 }}
                  />
                  <Text className={`text-xs flex-1 ${topic.isCompleted ? "text-gray-400 line-through" : "text-[#3F3F3F]"}`} style={{ fontFamily: fonts.regular }}>
                    {topic.title}
                  </Text>
                </TouchableOpacity>

                <View className="flex-row items-center gap-3">
                  <TouchableOpacity onPress={() => onDeleteTopic(unit.id, topic.id)}>
                    <Trash size={16} color="#ef4444" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onOpenTopicPdf(topic.id, topic.title, unit.unitLabel, unit.title)}>
                    <FilePdf size={18} color={colors.solidEnd} weight="duotone" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {isExpanded && (
          <View className="flex-row justify-end mt-4">
            <TouchableOpacity 
              disabled={!isDirty || isSaving}
              onPress={handleSave}
              className={`px-4 py-1.5 rounded-lg border text-sm ${(!isDirty || isSaving) ? 'border-[#43C17A]/50 bg-transparent' : 'border-[#43C17A] bg-[#43C17A]/10'}`}
            >
              <Text className={`text-xs ${(!isDirty || isSaving) ? 'text-[#43C17A]/50' : 'text-[#43C17A]'}`} style={{ fontFamily: fonts.bold }}>
                {isSaving ? "Saving..." : "Save Progress"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function ConfirmDeleteModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDeleting: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-center items-center px-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl flex-col gap-3">
          <View className="flex-row items-center gap-3">
            <View className="bg-red-100 p-2.5 rounded-full">
              <Trash size={22} color="#ef4444" weight="fill" />
            </View>
            <Text className="text-lg font-bold text-gray-800 flex-1">{title}</Text>
          </View>
          <Text className="text-sm text-gray-600 mt-1 leading-5">{message}</Text>
          <View className="flex-row gap-3 justify-end mt-4">
            <TouchableOpacity
              onPress={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg border border-gray-200"
            >
              <Text className="text-sm font-medium text-gray-600">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg bg-red-600"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-sm font-medium text-white">Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SubjectDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { details } = route.params as { details: CardProps };
  
  const [units, setUnits] = useState<UiUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const [addUnitVisible, setAddUnitVisible] = useState(false);
  const [addWeightageVisible, setAddWeightageVisible] = useState(false);
  
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [selectedTopicPdf, setSelectedTopicPdf] = useState<{
    id: number;
    title: string;
    unitLabel: string;
    unitTitle: string;
  } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'unit' | 'topic', unitId?: number, topicId?: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const data = await getUnitsWithTopics({
        collegeId: details.collegeId,
        collegeSubjectId: details.collegeSubjectId,
      });
      setUnits(data);
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to load units" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!details?.collegeId || !details?.collegeSubjectId) return;
    loadUnits();
  }, [details]);

  const handleMarkComplete = async (unitId: number, topics: UiTopic[], percentage: number) => {
    try {
      for (const topic of topics) {
        const { error: topicError } = await supabase
          .from("college_subject_unit_topics")
          .update({ isCompleted: topic.isCompleted, updatedAt: new Date().toISOString() })
          .eq("collegeSubjectUnitTopicId", topic.id);
        if (topicError) throw topicError;
      }

      const { error: unitError } = await supabase
        .from("college_subject_units")
        .update({ completionPercentage: percentage, updatedAt: new Date().toISOString() })
        .eq("collegeSubjectUnitId", unitId);
      
      if (unitError) throw unitError;

      setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, topics, percentage } : u)));
      Toast.show({ type: "success", text1: "Progress saved" });
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to save progress" });
    }
  };

  const handleDeleteUnit = (unitId: number) => {
    setDeleteTarget({ type: 'unit', unitId });
  };

  const handleDeleteTopic = (unitId: number, topicId: number) => {
    setDeleteTarget({ type: 'topic', unitId, topicId });
  };

  const performDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const now = new Date().toISOString();

      if (deleteTarget.type === 'unit' && deleteTarget.unitId) {
        const { error: unitError } = await supabase
          .from("college_subject_units")
          .update({ isActive: false, deletedAt: now, updatedAt: now })
          .eq("collegeSubjectUnitId", deleteTarget.unitId);
        if (unitError) throw unitError;

        const { error: topicError } = await supabase
          .from("college_subject_unit_topics")
          .update({ isActive: false, deletedAt: now, updatedAt: now })
          .eq("collegeSubjectUnitId", deleteTarget.unitId)
          .eq("isActive", true);
        if (topicError) throw topicError;

        setUnits((prev) => prev.filter((unit) => unit.id !== deleteTarget.unitId));
        Toast.show({ type: "success", text1: "Unit deleted successfully" });
      } 
      
      else if (deleteTarget.type === 'topic' && deleteTarget.topicId && deleteTarget.unitId) {
        const { error: deleteError } = await supabase
          .from("college_subject_unit_topics")
          .update({ isActive: false, deletedAt: now, updatedAt: now })
          .eq("collegeSubjectUnitTopicId", deleteTarget.topicId);
        if (deleteError) throw deleteError;

        const { data: remainingTopics, error: fetchError } = await supabase
          .from("college_subject_unit_topics")
          .select("isCompleted")
          .eq("collegeSubjectUnitId", deleteTarget.unitId)
          .eq("isActive", true);
        if (fetchError) throw fetchError;

        const total = remainingTopics?.length || 0;
        const completed = remainingTopics?.filter((t) => t.isCompleted).length || 0;
        const newPercentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        const { error: updateUnitError } = await supabase
          .from("college_subject_units")
          .update({ completionPercentage: newPercentage, updatedAt: now })
          .eq("collegeSubjectUnitId", deleteTarget.unitId);
        if (updateUnitError) throw updateUnitError;

        setUnits((prev) =>
          prev.map((unit) => {
            if (unit.id === deleteTarget.unitId) {
              return {
                ...unit,
                percentage: newPercentage,
                topics: unit.topics.filter((t) => t.id !== deleteTarget.topicId),
              };
            }
            return unit;
          })
        );
        Toast.show({ type: "success", text1: "Topic deleted successfully" });
      }
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to delete" });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleOpenTopicPdf = (topicId: number, topicTitle: string, unitLabel: string, unitTitle: string) => {
    setSelectedTopicPdf({ id: topicId, title: topicTitle, unitLabel, unitTitle });
    setPdfModalVisible(true);
  };

  return (
    <View className="flex-1 bg-[#F4F4F4]">
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center gap-3 shadow-sm z-10 pt-12">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1 rounded-full hover:bg-gray-100">
          <CaretLeft size={24} weight="bold" color="#16284F" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg text-[#16284F]" numberOfLines={1} style={{ fontFamily: fonts.bold }}>{details.subjectTitle}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mb-4 flex-row flex-wrap gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-[#525252] text-xs" style={{ fontFamily: fonts.regular }}>Subject :</Text>
            <View className="px-3 py-1 bg-[#DCEAE2] rounded-full">
              <Text className="text-[#43C17A] text-[10px]" style={{ fontFamily: fonts.bold }}>{details.subjectTitle}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-[#525252] text-xs" style={{ fontFamily: fonts.regular }}>Semester :</Text>
            <View className="px-3 py-1 bg-[#DCEAE2] rounded-full">
              <Text className="text-[#43C17A] text-[10px]" style={{ fontFamily: fonts.bold }}>{details.semester}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-[#525252] text-xs" style={{ fontFamily: fonts.regular }}>Year :</Text>
            <View className="px-3 py-1 bg-[#DCEAE2] rounded-full">
              <Text className="text-[#43C17A] text-[10px]" style={{ fontFamily: fonts.bold }}>{details.year}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-end mb-4 gap-2">
          <TouchableOpacity 
            onPress={() => setAddWeightageVisible(true)}
            className="bg-white px-4 py-2 rounded-lg flex-row items-center gap-2 border border-[#43C17A]"
          >
            <Text className="text-[#43C17A] text-xs" style={{ fontFamily: fonts.bold }}>Add Weightage</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setAddUnitVisible(true)}
            className="bg-[#43C17A] px-4 py-2 rounded-lg flex-row items-center gap-2 border border-[#43C17A]"
          >
            <Text className="text-white text-xs" style={{ fontFamily: fonts.bold }}>Add Unit</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#7E5DFF" className="mt-10" />
        ) : units.length === 0 ? (
          <View className="items-center justify-center mt-10">
            <Text className="text-gray-500" style={{ fontFamily: fonts.medium }}>No units found</Text>
          </View>
        ) : (
          units.map(unit => (
            <UnitCard 
              key={unit.id}
              unit={unit}
              onMarkComplete={handleMarkComplete}
              onDeleteTopic={handleDeleteTopic}
              onDeleteUnit={handleDeleteUnit}
              onOpenTopicPdf={handleOpenTopicPdf}
            />
          ))
        )}
      </ScrollView>

      {addUnitVisible && (
        <AddUnitModal 
          visible={addUnitVisible} 
          onClose={() => setAddUnitVisible(false)} 
          onSave={() => {
            setAddUnitVisible(false);
            loadUnits();
          }} 
          subjectDetails={details} 
        />
      )}

      {pdfModalVisible && selectedTopicPdf && (
        <TopicPdfModal 
          visible={pdfModalVisible} 
          onClose={() => {
            setPdfModalVisible(false);
            setSelectedTopicPdf(null);
          }} 
          topicId={selectedTopicPdf.id}
          topicTitle={selectedTopicPdf.title}
          unitLabel={selectedTopicPdf.unitLabel}
          unitTitle={selectedTopicPdf.unitTitle}
        />
      )}

      {addWeightageVisible && (
        <AddWeightageModal 
          visible={addWeightageVisible}
          onClose={() => setAddWeightageVisible(false)}
          subjectDetails={details}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          visible={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={performDelete}
          isDeleting={isDeleting}
          title={deleteTarget.type === 'unit' ? "Delete Unit" : "Delete Topic"}
          message={
            deleteTarget.type === 'unit'
              ? "Are you sure you want to permanently delete this unit and all its topics?"
              : "Are you sure you want to permanently delete this topic?"
          }
        />
      )}
    </View>
  );
}
