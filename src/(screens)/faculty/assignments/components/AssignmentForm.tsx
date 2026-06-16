import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { supabase } from '@/lib/supabaseServer';
import { fetchFacultyContext } from '@/lib/helpers/faculty/assignment/fetchFacultyContext';
import { upsertFacultyAssignment } from '@/lib/helpers/faculty/assignment/upsertFacultyAssignment';
import { Assignment } from './AssignmentCard';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

type Props = {
  initialData?: Assignment | null;
  onSave: (data: Assignment) => void;
  onCancel: () => void;
};

const getSafe = (data: any) => (Array.isArray(data) ? data[0] : data) || {};

function toHtmlDate(dateStr: string | number | undefined) {
  if (!dateStr) return '';
  const str = dateStr.toString();
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  return str;
}

export default function AssignmentForm({ initialData, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const [facultyId, setFacultyId] = useState<number | null>(null);
  const [facultySections, setFacultySections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sectionSelect, setSectionSelect] = useState('');

  // Date picker states
  const [isFromDatePickerVisible, setFromDatePickerVisible] = useState(false);
  const [isToDatePickerVisible, setToDatePickerVisible] = useState(false);

  const [form, setForm] = useState({
    assignmentId: initialData?.assignmentId,
    topicName: initialData?.description || '',
    fromDate: toHtmlDate(initialData?.fromDate),
    toDate: toHtmlDate(initialData?.toDate),
    totalMarks: initialData?.marks ? String(initialData.marks) : '',
    subjectId: '',
    branchId: '',
    sectionIds: [] as string[],
    yearId: '',
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadContext = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) throw new Error('Not authenticated');

        const { data: userRecord } = await supabase
          .from('users')
          .select('userId')
          .eq('auth_id', auth.user.id)
          .single();

        if (!userRecord) throw new Error('User record not found');

        const context = await fetchFacultyContext(userRecord.userId);

        setFacultyId(context.facultyId);
        setFacultySections(context.sections);

        if (initialData?.sectionId && context.sections.length > 0) {
          const matchedSection = context.sections.find(
            (s: any) => s.collegeSectionsId === Number(initialData.sectionId)
          );

          if (matchedSection) {
            const sectionObj = getSafe(matchedSection.college_sections);

            setForm((prev) => ({
              ...prev,
              subjectId: String(matchedSection.collegeSubjectId),
              branchId: String(sectionObj.collegeBranchId),
              sectionIds: [String(matchedSection.collegeSectionsId)],
              yearId: String(matchedSection.collegeAcademicYearId),
            }));
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
  }, [initialData]);

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

  useEffect(() => {
    if (uniqueSubjects.length === 1 && !form.subjectId) {
      setForm((prev) => ({ ...prev, subjectId: String(uniqueSubjects[0].id) }));
    }
  }, [uniqueSubjects, form.subjectId]);

  const availableBranches = useMemo(() => {
    if (!form.subjectId) return [];
    const map = new Map();
    facultySections
      .filter((s) => s.collegeSubjectId === Number(form.subjectId))
      .forEach((s) => {
        const sectionObj = getSafe(s.college_sections);
        const branchObj = getSafe(sectionObj?.college_branch);
        if (sectionObj && branchObj) {
          const bId = sectionObj.collegeBranchId;
          const bName = branchObj.collegeBranchCode;
          if (!map.has(bId)) map.set(bId, bName);
        }
      });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [facultySections, form.subjectId]);

  useEffect(() => {
    if (availableBranches.length === 1 && form.branchId !== String(availableBranches[0].id)) {
      setForm((prev) => ({ ...prev, branchId: String(availableBranches[0].id) }));
    }
  }, [availableBranches, form.branchId]);

  const availableSections = useMemo(() => {
    if (!form.subjectId || !form.branchId || !form.yearId) return [];
    const map = new Map();
    facultySections
      .filter((s) => {
        const sectionObj = getSafe(s.college_sections);
        return (
          s.collegeSubjectId === Number(form.subjectId) &&
          sectionObj?.collegeBranchId === Number(form.branchId) &&
          s.collegeAcademicYearId === Number(form.yearId)
        );
      })
      .forEach((s) => {
        const sectionObj = getSafe(s.college_sections);
        if (sectionObj) {
          const secId = s.collegeSectionsId;
          const secName = sectionObj.collegeSections;
          if (!map.has(secId)) map.set(secId, secName);
        }
      });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [facultySections, form.subjectId, form.branchId, form.yearId]);

  const availableYears = useMemo(() => {
    if (!form.subjectId || !form.branchId) return [];
    const map = new Map();
    facultySections
      .filter((s) => {
        const sectionObj = getSafe(s.college_sections);
        return (
          s.collegeSubjectId === Number(form.subjectId) &&
          sectionObj?.collegeBranchId === Number(form.branchId)
        );
      })
      .forEach((s) => {
        const yearObj = getSafe(s.college_academic_year);
        if (yearObj) {
          const yId = s.collegeAcademicYearId;
          const yName = yearObj.collegeAcademicYear;
          if (!map.has(yId)) map.set(yId, yName);
        }
      });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [facultySections, form.subjectId, form.branchId]);

  const validateForm = () => {
    if (!facultyId) return false;
    if (!form.subjectId) { Toast.show({ type: 'error', text1: 'Please select a Subject.' }); return false; }
    if (!form.topicName.trim()) { Toast.show({ type: 'error', text1: 'Topic Name is required.' }); return false; }
    if (!form.totalMarks) { Toast.show({ type: 'error', text1: 'Total Marks are required.' }); return false; }
    if (!form.branchId) { Toast.show({ type: 'error', text1: 'Please select a Branch.' }); return false; }
    if (form.sectionIds.length === 0) { Toast.show({ type: 'error', text1: 'Please select at least one Section.' }); return false; }
    if (!form.yearId) { Toast.show({ type: 'error', text1: 'Please select an Academic Year.' }); return false; }
    if (!form.fromDate || !form.toDate) { Toast.show({ type: 'error', text1: 'Both start and end dates are required.' }); return false; }

    const fromDateObj = new Date(form.fromDate);
    const toDateObj = new Date(form.toDate);
    const todayObj = new Date(today);

    if (!initialData && fromDateObj < todayObj) { Toast.show({ type: 'error', text1: 'Assigned date cannot be in the past.' }); return false; }
    if (!initialData && toDateObj < todayObj) { Toast.show({ type: 'error', text1: 'Submission deadline cannot be in the past.' }); return false; }
    if (fromDateObj > toDateObj) { Toast.show({ type: 'error', text1: 'Assigned date must be before the submission deadline.' }); return false; }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      for (const sectionId of form.sectionIds) {
        const payload = {
          assignmentId: form.assignmentId,
          facultyId: facultyId as number,
          subjectId: form.subjectId,
          topicName: form.topicName.trim(),
          dateAssigned: form.fromDate,
          submissionDeadline: form.toDate,
          collegeBranchId: form.branchId,
          collegeSectionsId: sectionId,
          collegeAcademicYearId: form.yearId,
          marks: form.totalMarks,
        };

        const res = await upsertFacultyAssignment(payload);
        if (!res.success) throw new Error(res.error);
      }

      Toast.show({ type: 'success', text1: 'Assignment saved successfully' });
      onSave({
        ...(initialData as Assignment),
        description: form.topicName.trim(),
        title: form.topicName.trim(),
        fromDate: form.fromDate,
        toDate: form.toDate,
        marks: form.totalMarks,
      });
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'An unexpected error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#43C17A" style={{ marginTop: 20 }} />;
  }

  return (
    <ScrollView className="flex-1 w-full" showsVerticalScrollIndicator={false}>
      <View className="mb-4">
        <Text className="text-xl font-semibold text-gray-900">
          {initialData ? t('Edit Assignment') : t('Add New Assignment')}
        </Text>
      </View>

      <View className="bg-white p-4 rounded-xl">
        {}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">Subject <Text className="text-red-500">*</Text></Text>
          <View className="border border-gray-300 rounded-md bg-gray-50 overflow-hidden">
            <Picker
              selectedValue={form.subjectId}
              onValueChange={(val) => setForm({ ...form, subjectId: val, branchId: '', sectionIds: [], yearId: '' })}
              enabled={uniqueSubjects.length > 1}
            >
              <Picker.Item label="Select Subject" value="" color="#9CA3AF" />
              {uniqueSubjects.map((s) => <Picker.Item key={s.id} label={s.name} value={s.id} />)}
            </Picker>
          </View>
        </View>

        {/* Topic Name */}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">Topic Name <Text className="text-red-500">*</Text></Text>
          <TextInput
            value={form.topicName}
            onChangeText={(val) => setForm({ ...form, topicName: val })}
            placeholder="e.g., Implementation of Stack and Queue"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
          />
        </View>

        {/* Total Marks */}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">Total Marks <Text className="text-red-500">*</Text></Text>
          <TextInput
            value={form.totalMarks}
            onChangeText={(val) => {
              const cleaned = val.replace(/\D/g, '').slice(0, 3);
              setForm({ ...form, totalMarks: cleaned });
            }}
            keyboardType="number-pad"
            placeholder="e.g., 100"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
          />
        </View>

        {/* Branch */}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">Branch <Text className="text-red-500">*</Text></Text>
          <View className="border border-gray-300 rounded-md bg-gray-50 overflow-hidden">
            <Picker
              selectedValue={form.branchId}
              onValueChange={(val) => setForm({ ...form, branchId: val, sectionIds: [], yearId: '' })}
              enabled={!!form.subjectId && availableBranches.length > 1}
            >
              <Picker.Item label="Select Branch" value="" color="#9CA3AF" />
              {availableBranches.map((b) => <Picker.Item key={b.id} label={b.name} value={b.id} />)}
            </Picker>
          </View>
        </View>

        {/* Year */}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">Year <Text className="text-red-500">*</Text></Text>
          <View className="border border-gray-300 rounded-md bg-gray-50 overflow-hidden">
            <Picker
              selectedValue={form.yearId}
              onValueChange={(val) => setForm({ ...form, yearId: val, sectionIds: [] })}
              enabled={!!form.branchId}
            >
              <Picker.Item label="Select Year" value="" color="#9CA3AF" />
              {availableYears.map((y) => <Picker.Item key={y.id} label={y.name} value={y.id} />)}
            </Picker>
          </View>
        </View>

        {/* Section Multiple Select */}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">Section <Text className="text-red-500">*</Text></Text>
          <View className="border border-gray-300 rounded-md bg-white p-2 min-h-[40px] flex-row flex-wrap gap-2">
            {form.sectionIds.map((id) => {
              const section = availableSections.find((s) => String(s.id) === id);
              return (
                <View key={id} className="flex-row items-center gap-1 bg-[#ECFDF5] px-3 py-1 rounded-full">
                  <Text className="text-[#065F46] text-xs">{section?.name}</Text>
                  <TouchableOpacity onPress={() => setForm(prev => ({ ...prev, sectionIds: prev.sectionIds.filter(sid => sid !== id) }))}>
                    <Text className="text-red-500 font-bold ml-1">×</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            <View className="flex-1 min-w-[120px] bg-gray-50 rounded-md overflow-hidden">
              <Picker
                selectedValue={sectionSelect}
                onValueChange={(val) => {
                  if (val && !form.sectionIds.includes(val)) {
                    setForm(prev => ({ ...prev, sectionIds: [...prev.sectionIds, val] }));
                  }
                  setSectionSelect('');
                }}
                enabled={!!form.yearId}
              >
                <Picker.Item label={form.yearId ? "Select section" : "Select year first"} value="" color="#9CA3AF" />
                {availableSections.filter(s => !form.sectionIds.includes(String(s.id))).map((s) => (
                  <Picker.Item key={s.id} label={s.name} value={s.id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Dates */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <Text className="mb-1 text-xs text-gray-500">Date Assigned <Text className="text-red-500">*</Text></Text>
            <TouchableOpacity onPress={() => setFromDatePickerVisible(true)} className="border border-gray-300 rounded-md px-3 py-2">
              <Text className="text-sm text-black">{form.fromDate || 'YYYY-MM-DD'}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isFromDatePickerVisible}
              mode="date"
              onConfirm={(date) => {
                setForm(prev => ({ ...prev, fromDate: date.toISOString().split('T')[0] }));
                setFromDatePickerVisible(false);
              }}
              onCancel={() => setFromDatePickerVisible(false)}
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs text-gray-500">Submission Deadline <Text className="text-red-500">*</Text></Text>
            <TouchableOpacity onPress={() => setToDatePickerVisible(true)} className="border border-gray-300 rounded-md px-3 py-2">
              <Text className="text-sm text-black">{form.toDate || 'YYYY-MM-DD'}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isToDatePickerVisible}
              mode="date"
              onConfirm={(date) => {
                setForm(prev => ({ ...prev, toDate: date.toISOString().split('T')[0] }));
                setToDatePickerVisible(false);
              }}
              onCancel={() => setToDatePickerVisible(false)}
            />
          </View>
        </View>

        {}
        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            disabled={isSaving}
            onPress={handleSubmit}
            className={`flex-1 items-center justify-center py-3 rounded-md ${isSaving ? 'bg-[#43C17A]/70' : 'bg-[#43C17A]'}`}
          >
            {isSaving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">{t('Save')}</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isSaving}
            onPress={onCancel}
            className="flex-1 items-center justify-center py-3 rounded-md border border-gray-300"
          >
            <Text className="text-gray-700 font-bold">{t('Cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="h-10" />
    </ScrollView>
  );
}
