import { Text } from '@/components/AppText';
import React, { useState, useEffect, useMemo } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { supabase } from '@/lib/supabaseServer';
import { fetchFacultyContext } from '@/lib/helpers/faculty/assignment/fetchFacultyContext';
import { saveDiscussionForum, fetchDiscussionById } from '@/lib/helpers/discussionForum/discussionForumAPI';
import { saveDiscussionSections, replaceDiscussionSections } from '@/lib/helpers/discussionForum/discussionForumSectionsAPI';
import { deactivateDiscussionFile } from '@/lib/helpers/discussionForum/discussionFileUploadsAPI';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { File, Trash } from 'phosphor-react-native';

const getSafe = (data: any) => (Array.isArray(data) ? data[0] : data) || {};

interface FacultyDiscussionFormProps {
  discussionId?: number;
  isEditMode?: boolean;
  onCancel: () => void;
  onSaved: (discussionId: number) => void;
}

export default function FacultyDiscussionForm({ discussionId, isEditMode, onCancel, onSaved }: FacultyDiscussionFormProps) {
  const { t } = useTranslation();
  const [facultyId, setFacultyId] = useState<number | null>(null);
  const [facultySections, setFacultySections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);


  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    marks: '',
    selectedSubjectId: '',
    selectedYearId: '',
    sectionIds: [] as string[]
  });

  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [newFiles, setNewFiles] = useState<any[]>([]);
  const [sectionSelect, setSectionSelect] = useState('');

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

        if (isEditMode && discussionId) {
          const discussionData = await fetchDiscussionById(discussionId);
          if (discussionData) {
            setForm((prev) => ({
              ...prev,
              title: discussionData.title || '',
              description: discussionData.description || '',
              deadline: discussionData.deadline ? discussionData.deadline.split('T')[0] : '',
              marks: String(discussionData.discussion_forum_sections?.[0]?.marks || ''),
              sectionIds: discussionData.discussion_forum_sections?.map((s: any) => String(s.collegeSectionsId)) || []
            }));

            // Attempt to infer Subject & Year from sections
            if (discussionData.discussion_forum_sections?.length > 0 && context.sections.length > 0) {
              const firstSecId = discussionData.discussion_forum_sections[0].collegeSectionsId;
              const matched = context.sections.find((s: any) => s.collegeSectionsId === firstSecId);
              if (matched) {
                setForm((prev) => ({
                  ...prev,
                  selectedSubjectId: String(matched.collegeSubjectId),
                  selectedYearId: String(matched.collegeAcademicYearId)
                }));
              }
            }

            setExistingFiles(
              (discussionData.discussion_file_uploads ?? []).
              filter((f: any) => f.isActive && !f.is_deleted && !f.deletedAt)
            );
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
  }, [discussionId, isEditMode]);

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

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true
      });

      if (!result.canceled) {
        setNewFiles((prev) => [...prev, ...result.assets]);
      }
    } catch (err) {
      console.log('File pick error:', err);
    }
  };

  const removeExistingFile = async (id: number) => {
    try {
      const res = await deactivateDiscussionFile(id);
      if (res.success) {
        setExistingFiles((prev) => prev.filter((f) => f.discussionFileUploadId !== id));
        Toast.show({ type: 'success', text1: 'File removed' });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to remove file' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to remove file' });
    }
  };

  const removeNewFile = (idx: number) => {
    setNewFiles((prev) => prev.filter((_, index) => index !== idx));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {Toast.show({ type: 'error', text1: 'Title is required' });return;}
    if (!form.description.trim()) {Toast.show({ type: 'error', text1: 'Description is required' });return;}
    if (!form.deadline) {Toast.show({ type: 'error', text1: 'Deadline is required' });return;}
    if (!form.marks || Number(form.marks) <= 0) {Toast.show({ type: 'error', text1: 'Valid marks are required' });return;}
    if (form.sectionIds.length === 0) {Toast.show({ type: 'error', text1: 'Please select at least one section' });return;}
    if (!facultyId) {Toast.show({ type: 'error', text1: 'Faculty not found' });return;}

    try {
      setIsSaving(true);
      const payload = await saveDiscussionForum({
        discussionId: isEditMode && discussionId ? discussionId : undefined,
        title: form.title.trim(),
        description: form.description.trim(),
        deadline: form.deadline
      }, { facultyId });

      if (!payload.success || !payload.discussionId) {
        throw new Error('Failed to save discussion');
      }

      const sectionsPayload = form.sectionIds.map((id) => ({
        collegeSectionsId: Number(id),
        marks: Number(form.marks)
      }));

      let sectionsResult;
      if (!isEditMode) {
        sectionsResult = await saveDiscussionSections(payload.discussionId, sectionsPayload);
      } else {
        sectionsResult = await replaceDiscussionSections(payload.discussionId, sectionsPayload);
      }

      if (!sectionsResult.success) {
        throw new Error('Failed to save discussion sections');
      }




      if (newFiles.length > 0) {
        Toast.show({ type: 'info', text1: 'Discussion saved. File uploads from mobile are currently disabled.' });
      } else {
        Toast.show({ type: 'success', text1: isEditMode ? 'Discussion updated' : 'Discussion created' });
      }

      onSaved(payload.discussionId);
    } catch (error: any) {
      console.error(error);
      Toast.show({ type: 'error', text1: error.message || 'Something went wrong' });
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
        <Text className="text-xl font-semibold text-[#282828]">
          {isEditMode ? t('Edit Discussion') : t('Create New Discussion')}
        </Text>
        <Text className="text-sm text-gray-500">{t('Manage project discussions for students.')}</Text>
      </View>

      <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        
        {}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.Title", "Title")}<Text className="text-red-500">*</Text></Text>
          <TextInput
            value={form.title}
            onChangeText={(val) => setForm({ ...form, title: val })}
            placeholder={t("Auto.Attr.EnterDiscussion", "Enter Discussion Title here")}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black" />
          
        </View>

        {}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.Description", "Description")}<Text className="text-red-500">*</Text></Text>
          <TextInput
            value={form.description}
            onChangeText={(val) => setForm({ ...form, description: val })}
            placeholder={t("Auto.Attr.EnterDescriptio", "Enter Description here")}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black min-h-[100px]" />
          
        </View>

        {}
        <View className="mb-4">
            <Text className="text-xs font-bold text-gray-400 mb-2">{t("Auto.Common.FILTERSECTIONS", "FILTER SECTIONS")}</Text>
            <View className="flex-row gap-2 mb-2">
                <View className="flex-1 border border-gray-200 rounded-md bg-white overflow-hidden">
                    <Picker
                selectedValue={form.selectedSubjectId}
                onValueChange={(val) => setForm({ ...form, selectedSubjectId: val, selectedYearId: '' })}>
                
                    <Picker.Item label={t("Auto.Attr.SelectSubject", "Select Subject")} value="" color="#9CA3AF" />
                    {uniqueSubjects.map((s) => <Picker.Item key={s.id} label={s.name} value={s.id} />)}
                    </Picker>
                </View>
                <View className="flex-1 border border-gray-200 rounded-md bg-white overflow-hidden">
                    <Picker
                selectedValue={form.selectedYearId}
                onValueChange={(val) => setForm({ ...form, selectedYearId: val })}
                enabled={!!form.selectedSubjectId}>
                
                    <Picker.Item label={t("Auto.Attr.SelectYear", "Select Year")} value="" color="#9CA3AF" />
                    {availableYears.map((y) => <Picker.Item key={y.id} label={y.name} value={y.id} />)}
                    </Picker>
                </View>
            </View>
            <View className="flex-row items-center gap-2 border border-gray-200 rounded-md p-2 bg-white flex-wrap">
                {form.sectionIds.map((id) => {
              const section = availableSections.find((s) => String(s.id) === id);
              return (
                <View key={id} className="flex-row items-center bg-[#ECFDF5] px-2 py-1 rounded-full mr-1 mb-1">
                            <Text className="text-[#065F46] text-[10px]">{section?.name || `ID ${id}`}</Text>
                            <TouchableOpacity onPress={() => setForm((prev) => ({ ...prev, sectionIds: prev.sectionIds.filter((sid) => sid !== id) }))}>
                                <Text className="text-red-500 font-bold ml-1 text-xs">×</Text>
                            </TouchableOpacity>
                        </View>);

            })}
                <View className="flex-1 min-w-[120px] bg-gray-50 rounded-md overflow-hidden h-8 justify-center">
                    <Picker
                selectedValue={sectionSelect}
                onValueChange={(val) => {
                  if (val && !form.sectionIds.includes(val)) {
                    setForm((prev) => ({ ...prev, sectionIds: [...prev.sectionIds, val] }));
                  }
                  setSectionSelect('');
                }}
                enabled={!!form.selectedYearId}>
                
                        <Picker.Item label={t("Auto.Attr.Selectsection", "Select section")} value="" color="#9CA3AF" style={{ fontSize: 12 }} />
                        {availableSections.filter((s) => !form.sectionIds.includes(String(s.id))).map((s) =>
                <Picker.Item key={s.id} label={s.name} value={s.id} style={{ fontSize: 12 }} />
                )}
                    </Picker>
                </View>
            </View>
        </View>

        {/* Deadline & Marks */}
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.Deadline", "Deadline")}<Text className="text-red-500">*</Text></Text>
            <TouchableOpacity onPress={() => setDatePickerVisible(true)} className="border border-gray-200 rounded-md px-3 py-2">
              <Text className="text-sm text-black">{form.deadline || 'YYYY-MM-DD'}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={(date) => {setForm((prev) => ({ ...prev, deadline: date.toISOString().split('T')[0] }));setDatePickerVisible(false);}}
              onCancel={() => setDatePickerVisible(false)} />
            
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm font-bold text-[#282828]">{t("Auto.Common.Marks", "Marks")}<Text className="text-red-500">*</Text></Text>
            <TextInput
              value={form.marks}
              onChangeText={(val) => setForm({ ...form, marks: val })}
              keyboardType="number-pad"
              placeholder={t("Auto.Attr.eg100", "e.g. 100")}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black" />
            
          </View>
        </View>

        {}
        <View className="mt-2 mb-4">
            <Text className="font-bold text-[#282828] text-sm mb-2">{t("Auto.Common.ProjectFiles", "Project Files")}</Text>
            <TouchableOpacity onPress={handlePickFile} className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center justify-center bg-gray-50/50 mb-3">
                <Text className="text-gray-500 text-sm mb-2">{t("Auto.Common.Taptouploadfile", "Tap to upload files")}</Text>
            </TouchableOpacity>
            
            {existingFiles.length > 0 &&
          <View className="flex-col gap-2 mb-2">
                    {existingFiles.map((file) =>
            <View key={file.discussionFileUploadId} className="flex-row items-center justify-between border border-blue-100 rounded-md p-2 bg-white">
                            <View className="flex-row items-center flex-1 pr-2">
                                <File size={20} color="#3B82F6" weight="fill" />
                                <Text className="text-sm ml-2 text-[#282828]" numberOfLines={1}>{file.fileUrl.split('/').pop()}</Text>
                            </View>
                            <TouchableOpacity onPress={() => removeExistingFile(file.discussionFileUploadId)} className="p-1.5 bg-red-50 rounded-full">
                                <Trash size={16} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
            )}
                </View>
          }

            {newFiles.length > 0 &&
          <View className="flex-col gap-2">
                    {newFiles.map((file, idx) =>
            <View key={idx} className="flex-row items-center justify-between border border-red-100 rounded-md p-2 bg-white">
                            <View className="flex-row items-center flex-1 pr-2">
                                <File size={20} color="#EF4444" weight="fill" />
                                <Text className="text-sm ml-2 text-[#282828]" numberOfLines={1}>{file.name}</Text>
                            </View>
                            <TouchableOpacity onPress={() => removeNewFile(idx)} className="p-1.5 bg-red-50 rounded-full">
                                <Trash size={16} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
            )}
                </View>
          }
        </View>

        {}
        <View className="flex-row items-center justify-end mt-2 border-t border-gray-100 pt-4 gap-3">
          <TouchableOpacity onPress={onCancel} disabled={isSaving} className="px-6 py-2 rounded-md border border-[#7B7B7B]">
            <Text className="text-[#7B7B7B] text-sm font-bold">{t("Auto.Common.Cancel", "Cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={isSaving} className="px-8 py-2 rounded-md bg-[#43C17A]">
            {isSaving ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white text-sm font-bold">{t("Auto.Common.Save", "Save")}</Text>}
          </TouchableOpacity>
        </View>
      </View>
      <View className="h-10" />
    </ScrollView>);

}