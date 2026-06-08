import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { CaretLeft, CaretDown, CheckCircle, Trash, FilePdf, Clock } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';

import { supabase } from '@/lib/supabaseClient';
import { getUnitsWithTopics, UiUnit, UiTopic } from '@/lib/helpers/faculty/getUnitsWithTopics';
import { CardProps } from '@/lib/types/faculty';

import TopicPdfModal from './modals/TopicPdfModal';
import AddUnitModal from './modals/AddUnitModal';

const colorMap = {
  purple: {
    cardBg: "bg-[#E9E3FF]",
    dot: "bg-[#A66BFF]",
    title: "text-[#3B2A91]",
    accent: "text-[#7E5DFF]",
  },
  orange: {
    cardBg: "bg-[#FFEDDA]",
    dot: "bg-[#FFAE4C]",
    title: "text-[#A35300]",
    accent: "text-[#FF8A2A]",
  },
  blue: {
    cardBg: "bg-[#CEE6FF]",
    dot: "bg-[#68A4FF]",
    title: "text-[#22518F]",
    accent: "text-[#4C8DFF]",
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
  onDeleteTopic: (unitId: number, topicId: number) => Promise<void>;
  onDeleteUnit: (unitId: number) => Promise<void>;
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
    <View className={`rounded-xl px-4 py-4 mb-4 ${colors.cardBg} w-full flex-col relative`}>
      <TouchableOpacity 
        className="flex-row items-center justify-between mb-3"
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View className="flex-row items-center gap-2">
          <View className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
          <Text className={`font-semibold text-[15px] text-[#4B4B4B] ${colors.accent}`}>
            {unit.unitLabel}
          </Text>
        </View>
        <CaretDown 
          size={20} 
          weight="bold" 
          color="#3B2A91"
          style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      <View className="bg-white/80 rounded-2xl p-4 flex-col relative overflow-hidden shadow-sm">
        <View className="flex-row justify-between items-start mb-3">
          <Text className={`text-[15px] font-semibold flex-1 mr-2 ${colors.title}`}>
            {unit.title}
          </Text>
          <TouchableOpacity onPress={() => onDeleteUnit(unit.id)} className="p-1">
            <Trash size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View className="w-full h-2 rounded-full bg-gray-200 overflow-visible mb-2 mt-1 relative">
          <View className={`h-full rounded-full bg-[#7E5DFF]`} style={{ width: `${percentage}%` }} />
          {percentage > 0 && (
             <View 
                className="absolute top-1/2 -translate-y-1/2 bg-white rounded-full shadow-sm"
                style={{
                  left: `${percentage}%`,
                  transform: [{ translateX: percentage >= 100 ? -8 : -4 }, { translateY: -4 }],
                  height: 8,
                  width: 8,
                }}
             />
          )}
        </View>

        <View className="flex-row items-center justify-between mt-1 mb-2">
          <View className="flex-row items-center gap-1.5">
            <Clock size={13} weight="fill" color="#3B2A91" />
            <Text className={`text-[10px] font-semibold ${colors.title}`}>
              {unit.dateRange || "-"}
            </Text>
          </View>
          <Text className={`text-[11px] font-bold ${colors.title}`}>
            {percentage}%
          </Text>
        </View>

        {isExpanded && (
          <View className="mt-3 flex-col gap-3">
            {localTopics.map((topic) => (
              <View key={topic.id} className="flex-row items-start justify-between gap-2">
                <TouchableOpacity 
                  className="flex-row items-start gap-2 flex-1"
                  onPress={() => {
                    setLocalTopics(prev => prev.map(t => t.id === topic.id ? { ...t, isCompleted: !t.isCompleted } : t));
                    setIsDirty(true);
                  }}
                >
                  <View className="mt-0.5">
                    <CheckCircle 
                      size={18} 
                      weight={topic.isCompleted ? "fill" : "regular"} 
                      color={topic.isCompleted ? "#7E5DFF" : "#9ca3af"} 
                    />
                  </View>
                  <Text className={`text-xs flex-1 ${topic.isCompleted ? "text-gray-500" : "text-[#3F3F3F]"}`}>
                    {topic.title}
                  </Text>
                </TouchableOpacity>

                <View className="flex-row items-center gap-3 mt-0.5">
                  <TouchableOpacity onPress={() => onDeleteTopic(unit.id, topic.id)}>
                    <Trash size={16} color="#ef4444" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onOpenTopicPdf(topic.id, topic.title, unit.unitLabel, unit.title)}>
                    <FilePdf size={18} color="#7E5DFF" weight="duotone" />
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
              <Text className={`text-xs font-bold ${(!isDirty || isSaving) ? 'text-[#43C17A]/50' : 'text-[#43C17A]'}`}>
                {isSaving ? "Saving..." : "Save Progress"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default function SubjectDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { details } = route.params as { details: CardProps };
  
  const [units, setUnits] = useState<UiUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const [addUnitVisible, setAddUnitVisible] = useState(false);
  
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [selectedTopicPdf, setSelectedTopicPdf] = useState<{
    id: number;
    title: string;
    unitLabel: string;
    unitTitle: string;
  } | null>(null);

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

  const handleDeleteUnit = async (unitId: number) => {
    try {
      const now = new Date().toISOString();
      const { error: unitError } = await supabase
        .from("college_subject_units")
        .update({ isActive: false, deletedAt: now, updatedAt: now })
        .eq("collegeSubjectUnitId", unitId);

      if (unitError) throw unitError;

      const { error: topicError } = await supabase
        .from("college_subject_unit_topics")
        .update({ isActive: false, deletedAt: now, updatedAt: now })
        .eq("collegeSubjectUnitId", unitId)
        .eq("isActive", true);

      if (topicError) throw topicError;

      setUnits((prev) => prev.filter((unit) => unit.id !== unitId));
      Toast.show({ type: "success", text1: "Unit deleted successfully" });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to delete unit" });
    }
  };

  const handleDeleteTopic = async (unitId: number, topicId: number) => {
    try {
      const now = new Date().toISOString();
      const { error: deleteError } = await supabase
        .from("college_subject_unit_topics")
        .update({ isActive: false, deletedAt: now, updatedAt: now })
        .eq("collegeSubjectUnitTopicId", topicId);

      if (deleteError) throw deleteError;

      const { data: remainingTopics, error: fetchError } = await supabase
        .from("college_subject_unit_topics")
        .select("isCompleted")
        .eq("collegeSubjectUnitId", unitId)
        .eq("isActive", true);

      if (fetchError) throw fetchError;

      const total = remainingTopics.length;
      const completed = remainingTopics.filter((topic) => topic.isCompleted).length;
      const newPercentage = total === 0 ? 0 : Math.round((completed / total) * 100);

      const { error: unitError } = await supabase
        .from("college_subject_units")
        .update({ completionPercentage: newPercentage, updatedAt: now })
        .eq("collegeSubjectUnitId", unitId);

      if (unitError) throw unitError;

      setUnits((prev) =>
        prev.map((unit) => {
          if (unit.id !== unitId) return unit;
          const topics = unit.topics.filter((topic) => topic.id !== topicId);
          return { ...unit, topics, percentage: newPercentage };
        })
      );
      Toast.show({ type: "success", text1: "Topic deleted successfully" });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to delete topic" });
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
          <Text className="text-lg font-bold text-[#16284F]" numberOfLines={1}>{details.subjectTitle}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mb-4 flex-row flex-wrap gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-[#525252] text-xs">Subject :</Text>
            <View className="px-3 py-1 bg-[#DCEAE2] rounded-full">
              <Text className="text-[#43C17A] text-[10px] font-bold">{details.subjectTitle}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-[#525252] text-xs">Semester :</Text>
            <View className="px-3 py-1 bg-[#DCEAE2] rounded-full">
              <Text className="text-[#43C17A] text-[10px] font-bold">{details.semester}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-[#525252] text-xs">Year :</Text>
            <View className="px-3 py-1 bg-[#DCEAE2] rounded-full">
              <Text className="text-[#43C17A] text-[10px] font-bold">{details.year}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-end mb-4">
          <TouchableOpacity 
            onPress={() => setAddUnitVisible(true)}
            className="bg-[#43C17A] px-4 py-2 rounded-lg flex-row items-center gap-2"
          >
            <Text className="text-white font-bold text-xs">Add Unit</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#7E5DFF" className="mt-10" />
        ) : units.length === 0 ? (
          <View className="items-center justify-center mt-10">
            <Text className="text-gray-500 font-semibold">No units found</Text>
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
    </View>
  );
}
