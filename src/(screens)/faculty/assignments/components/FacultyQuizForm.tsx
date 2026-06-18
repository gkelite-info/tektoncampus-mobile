import { Text } from '@/components/AppText';
import React, { useState, useEffect, useMemo } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { supabase } from '@/lib/supabaseServer';
import { fetchFacultyContext } from '@/lib/helpers/faculty/assignment/fetchFacultyContext';
import { saveQuiz, fetchQuizById } from '@/lib/helpers/quiz/quizAPI';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

const getSafe = (data: any) => (Array.isArray(data) ? data[0] : data) || {};

const formatTo12Hour = (time24: string) => {
  if (!time24) return '';
  const [hours] = time24.split(':');
  return parseInt(hours, 10) >= 12 ? 'PM' : 'AM';
};

const getTopicsBySubjectId = async (subjectId: number) => {
  const { data, error } = await supabase.
  from('college_subject_unit_topics').
  select('topicTitle, collegeSubjectUnitId, collegeSubjectUnitTopicId').
  eq('collegeSubjectId', subjectId).
  eq('isActive', true).
  is('deletedAt', null);

  if (error) {
    console.error('Error fetching topics:', error);
    return [];
  }
  return data || [];
};

interface FacultyQuizFormProps {
  quizId?: number;
  isEditMode?: boolean;
  onCancel: () => void;
  onSaved: (quizId: number) => void;
}

export default function FacultyQuizForm({ quizId, isEditMode, onCancel, onSaved }: FacultyQuizFormProps) {
  const { t } = useTranslation();
  const [facultyId, setFacultyId] = useState<number | null>(null);
  const [facultySections, setFacultySections] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);


  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);

  const [form, setForm] = useState({
    quizTitle: '',
    selectedSubjectId: '',
    selectedTopicId: '',
    selectedYearId: '',
    selectedSectionId: '',
    questionsCount: '1',
    marksPerQuestion: '1',
    durationMinutes: '30',
    maxAttempts: '1',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '10:00'
  });

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadContext = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) throw new Error('Not authenticated');

        const { data: userRecord } = await supabase.
        from('users').
        select('userId').
        eq('auth_id', auth.user.id).
        single();

        if (!userRecord) throw new Error('User record not found');

        const { data: facultyData } = await supabase.
        from('faculty').
        select('facultyId').
        eq('userId', userRecord.userId).
        single();

        if (!facultyData) throw new Error('Faculty record not found');
        setFacultyId(facultyData.facultyId);

        const context = await fetchFacultyContext(userRecord.userId);
        setFacultySections(context.sections);

        if (isEditMode && quizId) {
          const quizData = await fetchQuizById(quizId);
          if (quizData) {
            setForm({
              quizTitle: quizData.quizTitle,
              questionsCount: String(quizData.questionsCount),
              marksPerQuestion: String(quizData.marksPerQuestion),
              durationMinutes: String(quizData.durationMinutes),
              maxAttempts: String(quizData.maxAttempts),
              startDate: quizData.startDate ? quizData.startDate.split('T')[0] : '',
              endDate: quizData.endDate ? quizData.endDate.split('T')[0] : '',
              startTime: quizData.startTime || '09:00',
              endTime: quizData.endTime || '10:00',
              selectedSubjectId: String(quizData.collegeSubjectId),
              selectedTopicId: String(quizData.collegeSubjectUnitTopicId || quizData.collegeSubjectUnitId),
              selectedYearId: String(quizData.collegeAcademicYearId ?? ''),
              selectedSectionId: String(quizData.collegeSectionsId ?? '')
            });
          }
        }
      } catch (err: any) {
        console.error('Context Load Error:', err);
        Toast.show({ type: 'error', text1: 'Failed to load faculty details' });
      } finally {
        setIsLoading(false);
      }
    };

    loadContext();
  }, [quizId, isEditMode]);

  useEffect(() => {
    if (form.selectedSubjectId) {
      getTopicsBySubjectId(Number(form.selectedSubjectId)).then(setTopics);
    } else {
      setTopics([]);
    }
  }, [form.selectedSubjectId]);

  const uniqueSubjects = useMemo(() => {
    const map = new Map();
    facultySections.forEach((s) => {
      const subjectObj = getSafe(s.college_subjects);
      if (subjectObj && !map.has(s.collegeSubjectId)) {
        map.set(s.collegeSubjectId, subjectObj.subjectName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [facultySections]);

  const availableYears = useMemo(() => {
    if (!form.selectedSubjectId) return [];
    const map = new Map();
    facultySections.
    filter((s) => s.collegeSubjectId === Number(form.selectedSubjectId)).
    forEach((s) => {
      const yearObj = getSafe(s.college_academic_year);
      if (yearObj) {
        map.set(s.collegeAcademicYearId, yearObj.collegeAcademicYear);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [facultySections, form.selectedSubjectId]);

  const availableSections = useMemo(() => {
    if (!form.selectedSubjectId || !form.selectedYearId) return [];
    const map = new Map();
    facultySections.
    filter(
      (s) =>
      s.collegeSubjectId === Number(form.selectedSubjectId) &&
      s.collegeAcademicYearId === Number(form.selectedYearId)
    ).
    forEach((s) => {
      const sectionObj = getSafe(s.college_sections);
      if (sectionObj) {
        map.set(s.collegeSectionsId, sectionObj.collegeSections);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [facultySections, form.selectedSubjectId, form.selectedYearId]);

  const totalMarks = Number(form.questionsCount) * Number(form.marksPerQuestion) || 0;

  const handleSave = async (status: 'Draft' | 'Active') => {
    if (!form.quizTitle.trim()) {Toast.show({ type: 'error', text1: 'Quiz title is required' });return;}
    if (!form.selectedTopicId) {Toast.show({ type: 'error', text1: 'Please select a topic' });return;}
    if (!form.selectedYearId || !form.selectedSectionId) {Toast.show({ type: 'error', text1: 'Year and Section are required' });return;}
    if (!form.durationMinutes) {Toast.show({ type: 'error', text1: 'Duration is required' });return;}
    if (form.startTime === '00:00' || form.endTime === '00:00') {Toast.show({ type: 'error', text1: 'Please set valid Start and End times' });return;}
    if (form.endTime <= form.startTime) {Toast.show({ type: 'error', text1: 'End time must be later than start time' });return;}
    if (!form.startDate || !form.endDate) {Toast.show({ type: 'error', text1: 'Dates are required' });return;}
    if (!facultyId) {Toast.show({ type: 'error', text1: 'Faculty not found' });return;}

    try {
      if (status === 'Active') setIsSaving(true);else
      setIsDraftSaving(true);

      const selectedTopicObj = topics.find((t) => String(t.collegeSubjectUnitTopicId) === String(form.selectedTopicId));
      if (!selectedTopicObj) throw new Error('Invalid topic selected.');

      const result = await saveQuiz({
        quizId: isEditMode && quizId ? Number(quizId) : undefined,
        facultyId,
        collegeSubjectId: Number(form.selectedSubjectId),
        collegeAcademicYearId: Number(form.selectedYearId),
        collegeSectionsId: Number(form.selectedSectionId),
        collegeSubjectUnitId: selectedTopicObj.collegeSubjectUnitId,
        collegeSubjectUnitTopicId: selectedTopicObj.collegeSubjectUnitTopicId,
        quizTitle: form.quizTitle.trim(),
        totalMarks,
        questionsCount: Number(form.questionsCount),
        marksPerQuestion: Number(form.marksPerQuestion),
        startTime: form.startTime,
        endTime: form.endTime,
        durationMinutes: Number(form.durationMinutes),
        startDate: form.startDate,
        endDate: form.endDate,
        maxAttempts: Number(form.maxAttempts),
        status: 'Draft'
      });

      if (!result.success) throw new Error(result.error?.message);

      Toast.show({ type: 'success', text1: status === 'Active' ? 'Details saved! Now add your questions.' : 'Quiz saved as draft!' });
      onSaved(result.quizId!);
    } catch (error: any) {
      console.error(error);
      Toast.show({ type: 'error', text1: error.message || 'Something went wrong' });
    } finally {
      setIsSaving(false);
      setIsDraftSaving(false);
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#43C17A" style={{ marginTop: 20 }} />;
  }

  return (
    <ScrollView className="flex-1 w-full" showsVerticalScrollIndicator={false}>
      <View className="mb-4">
        <Text className="text-xl font-semibold text-[#282828]">
          {isEditMode ? t('Edit Quiz') : t('Create New Quiz')}
        </Text>
        <Text className="text-sm text-gray-500">{t('Set up the timing and scoring for your quiz.')}</Text>
      </View>

      <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        
        {}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.QuizTitle", "Quiz Title")}<Text className="text-red-500">*</Text></Text>
          <TextInput
            value={form.quizTitle}
            onChangeText={(val) => setForm({ ...form, quizTitle: val })}
            placeholder={t("Auto.Attr.egUnit1Assessme", "e.g. Unit 1 Assessment")}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black" />
          
        </View>

        {}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.Subject", "Subject")}<Text className="text-red-500">*</Text></Text>
          <View className="border border-gray-200 rounded-md bg-white overflow-hidden">
            <Picker
              selectedValue={form.selectedSubjectId}
              onValueChange={(val) => setForm({ ...form, selectedSubjectId: val, selectedTopicId: '', selectedYearId: '', selectedSectionId: '' })}>
              
              <Picker.Item label={t("Auto.Attr.SelectSubject", "Select Subject")} value="" color="#9CA3AF" />
              {uniqueSubjects.map((s) => <Picker.Item key={s.id} label={s.name} value={s.id} />)}
            </Picker>
          </View>
        </View>

        {/* Topic */}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.Topic", "Topic")}<Text className="text-red-500">*</Text></Text>
          <View className="border border-gray-200 rounded-md bg-white overflow-hidden">
            <Picker
              selectedValue={form.selectedTopicId}
              onValueChange={(val) => setForm({ ...form, selectedTopicId: val })}
              enabled={!!form.selectedSubjectId}>
              
              <Picker.Item label={t("Auto.Attr.SelectTopic", "Select Topic")} value="" color="#9CA3AF" />
              {topics.map((t, idx) => <Picker.Item key={idx} label={t.topicTitle} value={t.collegeSubjectUnitTopicId} />)}
            </Picker>
          </View>
        </View>

        {/* Academic Year & Section */}
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.AcademicYear", "Academic Year")}<Text className="text-red-500">*</Text></Text>
            <View className="border border-gray-200 rounded-md bg-white overflow-hidden">
              <Picker
                selectedValue={form.selectedYearId}
                onValueChange={(val) => setForm({ ...form, selectedYearId: val, selectedSectionId: '' })}
                enabled={!!form.selectedSubjectId}>
                
                <Picker.Item label={t("Auto.Attr.SelectYear", "Select Year")} value="" color="#9CA3AF" />
                {availableYears.map((y) => <Picker.Item key={y.id} label={y.name} value={y.id} />)}
              </Picker>
            </View>
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.Section", "Section")}<Text className="text-red-500">*</Text></Text>
            <View className="border border-gray-200 rounded-md bg-white overflow-hidden">
              <Picker
                selectedValue={form.selectedSectionId}
                onValueChange={(val) => setForm({ ...form, selectedSectionId: val })}
                enabled={!!form.selectedYearId}>
                
                <Picker.Item label={t("Auto.Attr.SelectSection", "Select Section")} value="" color="#9CA3AF" />
                {availableSections.map((s) => <Picker.Item key={s.id} label={s.name} value={s.id} />)}
              </Picker>
            </View>
          </View>
        </View>

        {/* Questions and Marks */}
        <View className="bg-gray-50 p-3 rounded-lg mb-4 flex-row gap-4">
          <View className="flex-1">
            <Text className="mb-1 text-xs font-bold text-gray-500">{t("Auto.Common.NoQuestions", "No. Questions")}<Text className="text-red-500">*</Text></Text>
            <TextInput
              value={form.questionsCount}
              onChangeText={(val) => setForm({ ...form, questionsCount: val })}
              keyboardType="number-pad"
              className="w-full rounded-md border border-gray-200 px-2 py-2 text-sm bg-white text-black" />
            
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs font-bold text-gray-500">{t("Auto.Common.MarksQtn", "Marks/Qtn")}<Text className="text-red-500">*</Text></Text>
            <TextInput
              value={form.marksPerQuestion}
              onChangeText={(val) => setForm({ ...form, marksPerQuestion: val })}
              keyboardType="number-pad"
              className="w-full rounded-md border border-gray-200 px-2 py-2 text-sm bg-white text-black" />
            
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs font-bold text-gray-500">{t("Auto.Common.TotalMarks", "Total Marks")}</Text>
            <View className="bg-white border border-gray-200 rounded-md px-2 py-2 items-center justify-center">
              <Text className="text-sm font-bold text-[#43C17A]">{totalMarks}</Text>
            </View>
          </View>
        </View>

        {/* Duration and Attempts */}
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.DurationMins", "Duration (Mins)")}<Text className="text-red-500">*</Text></Text>
            <TextInput
              value={form.durationMinutes}
              onChangeText={(val) => setForm({ ...form, durationMinutes: val })}
              keyboardType="number-pad"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black" />
            
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.MaxAttempts", "Max Attempts")}</Text>
            <TextInput
              value={form.maxAttempts}
              onChangeText={(val) => setForm({ ...form, maxAttempts: val })}
              keyboardType="number-pad"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black" />
            
          </View>
        </View>

        {/* Dates */}
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.StartDate", "Start Date")}<Text className="text-red-500">*</Text></Text>
            <TouchableOpacity onPress={() => setStartDatePickerVisible(true)} className="border border-gray-200 rounded-md px-3 py-2">
              <Text className="text-sm text-black">{form.startDate || 'YYYY-MM-DD'}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isStartDatePickerVisible}
              mode="date"
              onConfirm={(date) => {setForm((prev) => ({ ...prev, startDate: date.toISOString().split('T')[0] }));setStartDatePickerVisible(false);}}
              onCancel={() => setStartDatePickerVisible(false)} />
            
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.EndDate", "End Date")}<Text className="text-red-500">*</Text></Text>
            <TouchableOpacity onPress={() => setEndDatePickerVisible(true)} className="border border-gray-200 rounded-md px-3 py-2">
              <Text className="text-sm text-black">{form.endDate || 'YYYY-MM-DD'}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isEndDatePickerVisible}
              mode="date"
              onConfirm={(date) => {setForm((prev) => ({ ...prev, endDate: date.toISOString().split('T')[0] }));setEndDatePickerVisible(false);}}
              onCancel={() => setEndDatePickerVisible(false)} />
            
          </View>
        </View>

        {}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.StartTime", "Start Time")}<Text className="text-red-500">*</Text></Text>
            <TouchableOpacity onPress={() => setStartTimePickerVisible(true)} className="border border-gray-200 rounded-md px-3 py-2 flex-row items-center justify-between">
              <Text className="text-sm text-black">{form.startTime}</Text>
              <View className="bg-[#43C17A]/10 px-1 py-0.5 rounded"><Text className="text-[10px] font-bold text-[#43C17A]">{formatTo12Hour(form.startTime)}</Text></View>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isStartTimePickerVisible}
              mode="time"
              onConfirm={(date) => {setForm((prev) => ({ ...prev, startTime: date.toTimeString().substring(0, 5) }));setStartTimePickerVisible(false);}}
              onCancel={() => setStartTimePickerVisible(false)} />
            
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.EndTime", "End Time")}<Text className="text-red-500">*</Text></Text>
            <TouchableOpacity onPress={() => setEndTimePickerVisible(true)} className="border border-gray-200 rounded-md px-3 py-2 flex-row items-center justify-between">
              <Text className="text-sm text-black">{form.endTime}</Text>
              <View className="bg-blue-50 px-1 py-0.5 rounded"><Text className="text-[10px] font-bold text-blue-500">{formatTo12Hour(form.endTime)}</Text></View>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isEndTimePickerVisible}
              mode="time"
              onConfirm={(date) => {setForm((prev) => ({ ...prev, endTime: date.toTimeString().substring(0, 5) }));setEndTimePickerVisible(false);}}
              onCancel={() => setEndTimePickerVisible(false)} />
            
          </View>
        </View>

        {}
        <View className="flex-row items-center justify-between mt-2 border-t border-gray-100 pt-4 gap-2">
          <TouchableOpacity onPress={onCancel} disabled={isSaving || isDraftSaving} className="px-4 py-3 rounded-md border border-[#16284F] flex-1 items-center">
            <Text className="text-[#16284F] text-sm font-medium">{t("Auto.Common.Cancel", "Cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSave('Draft')} disabled={isDraftSaving} className="px-2 py-3 rounded-md bg-[#16284F] flex-1 items-center">
            {isDraftSaving ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white text-sm font-medium text-center">{t("Auto.Common.SaveDraft", "Save Draft")}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSave('Active')} disabled={isSaving} className="px-2 py-3 rounded-md bg-[#43C17A] flex-1 items-center">
            {isSaving ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white text-sm font-medium text-center">{t("Auto.Common.SaveNext", "Save & Next")}</Text>}
          </TouchableOpacity>
        </View>
      </View>
      <View className="h-10" />
    </ScrollView>);

}