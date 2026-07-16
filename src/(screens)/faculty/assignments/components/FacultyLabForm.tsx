import { Text } from '@/components/AppText';
import { fonts } from '@/constants/fonts';
import React, { useState, useEffect, useMemo } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@/lib/supabaseServer';
import { fetchFacultyContext } from '@/lib/helpers/faculty/assignment/fetchFacultyContext';
import { saveLabManual } from '@/lib/helpers/faculty/facultyLabManualHelper';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { FilePdf, Trash } from 'phosphor-react-native';

const getSafe = (data: any) => (Array.isArray(data) ? data[0] : data) || {};

interface FacultyLabFormProps {
  initialData?: any;
  onCancel: () => void;
  onSaved: () => void;
}

export default function FacultyLabForm({ initialData, onCancel, onSaved }: FacultyLabFormProps) {
  const { t } = useTranslation();
  const [facultyId, setFacultyId] = useState<number | null>(null);
  const [facultySections, setFacultySections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    labTitle: initialData?.labTitle || '',
    description: initialData?.description || '',
    selectedSubjectId: initialData?.collegeSubjectId ? String(initialData.collegeSubjectId) : '',
    selectedYearId: initialData?.collegeAcademicYearId ? String(initialData.collegeAcademicYearId) : '',
    selectedSectionId: initialData?.collegeSectionsId ? String(initialData.collegeSectionsId) : ''
  });

  const [pdfFile, setPdfFile] = useState<any>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(
    initialData?.pdfUrl ? initialData.pdfUrl.split('/').pop() : null
  );

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
      } catch (err: any) {
        console.error('Context Load Error:', err);
        Toast.show({ type: 'error', text1: 'Failed to load faculty details' });
      } finally {
        setIsLoading(false);
      }
    };

    loadContext();
  }, []);

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
        type: 'application/pdf'
      });

      if (!result.canceled && result.assets.length > 0) {
        setPdfFile(result.assets[0]);
        setExistingFileName(null);
      }
    } catch (err) {
      console.log('File pick error:', err);
    }
  };

  const handleSave = async () => {
    if (!form.labTitle.trim()) { Toast.show({ type: 'error', text1: 'Lab Title is required' }); return; }
    if (!form.selectedSubjectId) { Toast.show({ type: 'error', text1: 'Please select a subject' }); return; }
    if (!form.selectedYearId) { Toast.show({ type: 'error', text1: 'Please select a year' }); return; }
    if (!form.selectedSectionId) { Toast.show({ type: 'error', text1: 'Please select a section' }); return; }
    if (!pdfFile && !initialData) { Toast.show({ type: 'error', text1: 'PDF is required' }); return; }
    if (!facultyId) { Toast.show({ type: 'error', text1: 'Faculty not found' }); return; }

    try {
      setIsSaving(true);



      let filePath = initialData?.pdfUrl || 'dummy_mobile_path.pdf';
      if (pdfFile) {

        filePath = `faculty_${facultyId}/${pdfFile.name}`;
      }

      await saveLabManual(
        {
          labManualId: initialData?.labId,
          labTitle: form.labTitle.trim(),
          description: form.description.trim(),
          pdfUrl: filePath,
          collegeSubjectId: Number(form.selectedSubjectId),
          collegeAcademicYearId: Number(form.selectedYearId),
          collegeSectionsId: Number(form.selectedSectionId),
          facultyId: facultyId
        },
        { id: facultyId, role: 'faculty' }
      );

      Toast.show({ type: 'success', text1: initialData ? 'Lab manual updated' : 'Lab manual uploaded' });
      onSaved();
    } catch (error: any) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Failed to save lab manual' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#43C17A" style={{ marginTop: 20 }} />;
  }

  return (
    <ScrollView className="min-h-[57vh] w-full mb-20" showsVerticalScrollIndicator={false}>
      <View className="mb-4">
        <Text className="text-xl text-[#282828]" style={{ fontFamily: fonts.semiBold }}>
          {initialData ? t('Edit Lab Manual') : t('Upload Lab Manual')}
        </Text>
        <Text className="text-sm text-gray-500" style={{ fontFamily: fonts.regular }}>{t('Upload a PDF lab manual for your assigned sections.')}</Text>
      </View>

      <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">

        { }
        <View className="mb-4">
          <Text className="mb-1 text-sm text-[#282828]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.LabTitle", "Lab Title")}<Text className="text-red-500" style={{ fontFamily: fonts.regular }}>*</Text></Text>
          <TextInput
            value={form.labTitle}
            onChangeText={(val) => setForm({ ...form, labTitle: val })}
            placeholder={t("Auto.Attr.egExperiment3", "e.g. Experiment 3")}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black"
            style={{ fontFamily: fonts.regular }}
          />

        </View>

        { }
        <View className="mb-4">
          <Text className="mb-1 text-sm text-[#282828]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Subject", "Subject")}<Text className="text-red-500" style={{ fontFamily: fonts.regular }}>*</Text></Text>
          <View className="border border-gray-200 rounded-md bg-white overflow-hidden mb-3">
            <Picker
              selectedValue={form.selectedSubjectId}
              onValueChange={(val) => setForm({ ...form, selectedSubjectId: val, selectedYearId: '', selectedSectionId: '' })}>

              <Picker.Item label={t("Auto.Attr.Selectsubject", "Select subject")} value="" color="#9CA3AF" style={{ fontFamily: fonts.regular }} />
              {uniqueSubjects.map((s) => <Picker.Item key={s.id} label={s.name} value={s.id} />)}
            </Picker>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1 text-sm text-[#282828]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Year", "Year")}<Text className="text-red-500" style={{ fontFamily: fonts.regular }}>*</Text></Text>
              <View className="border border-gray-200 rounded-md bg-white overflow-hidden">
                <Picker
                  selectedValue={form.selectedYearId}
                  onValueChange={(val) => setForm({ ...form, selectedYearId: val, selectedSectionId: '' })}
                  enabled={!!form.selectedSubjectId}>

                  <Picker.Item label={t("Auto.Attr.Selectyear", "Select year")} value="" color="#9CA3AF" />
                  {availableYears.map((y) => <Picker.Item key={y.id} label={y.name} value={y.id} />)}
                </Picker>
              </View>
            </View>
            <View className="flex-1">
              <Text className="mb-1 text-sm text-[#282828]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Section", "Section")}<Text className="text-red-500" style={{ fontFamily: fonts.regular }}>*</Text></Text>
              <View className="border border-gray-200 rounded-md bg-white overflow-hidden">
                <Picker
                  selectedValue={form.selectedSectionId}
                  onValueChange={(val) => setForm({ ...form, selectedSectionId: val })}
                  enabled={!!form.selectedYearId}>

                  <Picker.Item label={t("Auto.Attr.Selectsection", "Select section")} value="" color="#9CA3AF" />
                  {availableSections.map((s) => <Picker.Item key={s.id} label={s.name} value={s.id} />)}
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="mb-1 text-sm text-[#282828]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Description", "Description")}<Text className="text-gray-400 ml-1" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.optional", "(optional)")}</Text></Text>
          <TextInput
            value={form.description}
            onChangeText={(val) => setForm({ ...form, description: val })}
            placeholder={t("Auto.Attr.Brieflydescribe", "Briefly describe the objective of this lab")}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-black min-h-[80px]" />

        </View>

        {/* File Section */}
        <View className="mb-4">
          <Text className="mb-2 text-sm text-[#282828]" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.LabManualPDF", "Lab Manual PDF")}<Text className="text-red-500" style={{ fontFamily: fonts.regular }}>*</Text></Text>

          {!pdfFile && !existingFileName ?
            <TouchableOpacity onPress={handlePickFile} className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center justify-center bg-gray-50/50">
              <Text className="text-gray-500 text-sm mb-1" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.UploadPDF", "Upload PDF")}</Text>
              <Text className="text-gray-400 text-xs" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Taptobrowsefile", "Tap to browse files")}</Text>
            </TouchableOpacity> :

            <View className="border border-[#43C17A]/30 bg-[#F0FFF7] rounded-xl p-3 flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-[#D5FFE7] items-center justify-center">
                <FilePdf size={20} color="#43C17A" weight="fill" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-[#282828]" numberOfLines={1} style={{ fontFamily: fonts.bold }}>
                  {pdfFile ? pdfFile.name : existingFileName}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: fonts.regular }}>
                  {pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : 'Already uploaded'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setPdfFile(null); setExistingFileName(null); }} className="w-7 h-7 items-center justify-center rounded-full bg-red-50">
                <Trash size={14} color="#EF4444" weight="bold" />
              </TouchableOpacity>
            </View>
          }
        </View>

        { }
        <View className="flex-row items-center justify-end mt-2 border-t border-gray-100 pt-4 gap-3">
          <TouchableOpacity onPress={onCancel} disabled={isSaving} className="px-6 py-2.5 rounded-md border border-[#7B7B7B]">
            <Text className="text-[#7B7B7B] text-sm" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Cancel", "Cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={isSaving} className="px-6 py-2.5 rounded-md bg-[#16284F]">
            {isSaving ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white text-sm" style={{ fontFamily: fonts.bold }}>{initialData ? 'Update Lab Manual' : 'Upload Lab Manual'}</Text>}
          </TouchableOpacity>
        </View>
      </View>
      <View className="h-10" />
    </ScrollView>);

}