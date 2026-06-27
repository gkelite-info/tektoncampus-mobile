import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Text } from '@/components/AppText';
import { CheckCircle, Clock, UploadSimple, X } from 'phosphor-react-native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { fetchAllActiveWellbeingCategories } from '@/lib/helpers/wellbeingCategories/wellbeingCategoryAPI';
import { createWellbeingSupportIssue, updateWellbeingSupportIssue } from '@/lib/helpers/wellbeingSupportIssues/wellbeingSupportIssueAPI';
import type { StudentWellbeingIssueListItem } from '@/lib/helpers/wellbeingSupportIssues/types';
import { useUser } from '@/utils/context/UserContext';

interface IssueFormProps {
  editingIssue?: StudentWellbeingIssueListItem | null;
  onCancelEdit?: () => void;
  onEditComplete?: () => void;
  onCancelNew?: () => void;
  onSuccess?: () => void;
  role: string;
}

export default function IssueForm({
  editingIssue = null,
  onCancelEdit,
  onEditComplete,
  onCancelNew,
  onSuccess,
  role
}: IssueFormProps) {
  const { t } = useTranslation();
  const isEditing = Boolean(editingIssue);
  const [files, setFiles] = useState<any[]>([]);

  const [issueTitle, setIssueTitle] = useState("");
  const [isExecutiveSelected, setIsExecutiveSelected] = useState(false);
  const [appliesTo, setAppliesTo] = useState<"college" | "hostel" | "both">("college");
  const [priority, setPriority] = useState<string>("medium");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editingIssue) return;
    setIssueTitle(editingIssue.title || "");
    setIsExecutiveSelected(editingIssue.issueVisibilityRole === "both");
    setAppliesTo(editingIssue.appliesTo || "college");
    setPriority(editingIssue.priority || "medium");
    setSelectedCategory(editingIssue.categoryId?.toString() || "");
    setSelectedSubCategory(editingIssue.subCategoryId?.toString() || "");
    setDescription(editingIssue.description || "");
    setDescription(editingIssue.description || "");
    setFiles([]);
  }, [editingIssue]);

  const { fullName, email, userId, collegeId } = useUser();
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    async function getCategories() {
      if (!collegeId) return;
      try {
        const data = await fetchAllActiveWellbeingCategories(Number(collegeId));
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    }
    getCategories();
  }, [collegeId]);

  const activeCategory = categories.find((cat) => cat.categoryId.toString() === selectedCategory);
  const subCategoryOptions = activeCategory ? activeCategory.wellbeing_sub_categories : [];

  const handleFilePick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true
      });
      if (!res.canceled) {
        setFiles((prev) => [...prev, ...res.assets]);
      }
    } catch (err) {
      console.error("Document picker error:", err);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const resetForm = () => {
    setIssueTitle("");
    setSelectedCategory("");
    setSelectedSubCategory("");
    setAppliesTo("college");
    setPriority("medium");
    setIsExecutiveSelected(false);
    setDescription("");
    setFiles([]);
  };

  const handleCancel = () => {
    resetForm();
    if (isEditing) {
      onCancelEdit?.();
    } else {
      onCancelNew?.();
    }
  };

  const handleSubmit = async () => {
    if (!issueTitle.trim() || !selectedCategory || !selectedSubCategory || !description.trim()) {
      Alert.alert(t('Wellbeing_module.common.Error', 'Error'), t('Wellbeing_module.common.FillRequiredFields', 'Please fill in all required fields.'));
      return;
    }

    if (!userId || !collegeId || !fullName || !email) {
      Alert.alert(t('Wellbeing_module.common.Error', 'Error'), t('Wellbeing_module.common.UserDataNotLoaded', 'User data not fully loaded.'));
      return;
    }

    setSubmitting(true);
    try {
      // Map files to Blobs for Supabase upload
      const mappedFiles = await Promise.all(
        files.map(async (f) => {
          const res = await fetch(f.uri);
          const blob = await res.blob();
          (blob as any).name = f.name;
          return blob;
        })
      );

      const issueRaisedRole = role === "student" ? "Student" : role;

      if (isEditing && editingIssue) {
        await updateWellbeingSupportIssue({
          wellbeingSupportIssueId: Number(editingIssue.id),
          issueTitle,
          issueVisibilityRole: isExecutiveSelected ? "both" : "wellbeingmanager",
          categoryId: Number(selectedCategory),
          subCategoryId: Number(selectedSubCategory),
          appliesTo: appliesTo as any,
          priority: priority as any,
          description,
          collegeId: Number(collegeId),
          createdBy: Number(userId),
          filesToAdd: mappedFiles as any,
          attachmentIdsToRemove: [],
        });
        Alert.alert(t('Wellbeing_module.common.Success', 'Success'), t('Wellbeing_module.common.IssueUpdated', 'Issue updated successfully!'));
        onEditComplete?.();
      } else {
        await createWellbeingSupportIssue({
          fullName,
          email,
          issueTitle,
          issueVisibilityRole: isExecutiveSelected ? "both" : "wellbeingmanager",
          categoryId: Number(selectedCategory),
          subCategoryId: Number(selectedSubCategory),
          appliesTo: appliesTo as any,
          priority: priority as any,
          description,
          issueRaisedRole: issueRaisedRole as any,
          collegeId: Number(collegeId),
          createdBy: Number(userId),
          files: mappedFiles as any,
        });
        Alert.alert(t('Wellbeing_module.common.Success', 'Success'), t('Wellbeing_module.common.IssueRaised', 'Issue raised successfully!'));
        onSuccess ? onSuccess() : onCancelNew?.();
      }
      resetForm();
    } catch (error) {
      console.error(error);
      Alert.alert(t('Wellbeing_module.common.Error', 'Error'), t('Wellbeing_module.common.FailedToSave', 'Failed to save issue.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 mt-4" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <View className="bg-gradient-to-r from-[#205B3A] to-[#43C17A] px-5 py-6 rounded-t-2xl overflow-hidden" style={{ backgroundColor: '#205B3A' }}>
        <Text className="text-white text-xl font-bold mb-2">
          {isEditing ? t('Wellbeing_module.common.EditWellbeingIssue', 'Edit Wellbeing Issue') : t('Wellbeing_module.common.RaiseWellbeingIssue', 'Raise Wellbeing Issue')}
        </Text>
        <Text className="text-white/90 text-sm leading-5">
          {t('Wellbeing_module.common.FillInDetails', 'Fill in the details below. Every submission is tracked and resolved transparently.')}
        </Text>
      </View>

      <View className="bg-white p-5 rounded-b-2xl shadow-sm border border-gray-100">
        
        {/* Issue Title */}
        <Text className="text-sm font-semibold mb-2 text-gray-800">
          {t('Wellbeing_module.common.IssueTitle', 'Issue Title')} <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={issueTitle}
          onChangeText={setIssueTitle}
          placeholder={t('Wellbeing_module.common.EnterIssueTitle', 'Enter Issue Title')}
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4 bg-white text-sm"
        />

        {/* Issue Visibility */}
        <Text className="text-sm font-semibold mb-2 text-gray-800">
          {t('Wellbeing_module.common.IssueVisibility', 'Issue Visibility')} <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row justify-between mb-4">
          <TouchableOpacity
            onPress={() => setIsExecutiveSelected(!isExecutiveSelected)}
            className={`flex-row items-center justify-center py-3 px-4 rounded-lg flex-1 mr-2 border ${
              isExecutiveSelected ? 'bg-[#16284F] border-[#16284F]' : 'border-gray-300 bg-white'
            }`}
          >
            {isExecutiveSelected ? (
              <CheckCircle size={18} weight="fill" color="white" />
            ) : (
              <View className="w-4 h-4 rounded-full border border-gray-400 mr-2" />
            )}
            <Text className={`ml-2 text-sm font-semibold ${isExecutiveSelected ? 'text-white' : 'text-gray-600'}`}>
              {t('Wellbeing_module.common.Executive', 'Executive')}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-center py-3 px-4 rounded-lg flex-1 bg-[#16284F] border border-[#16284F]">
            <CheckCircle size={18} weight="fill" color="white" />
            <Text className="ml-2 text-sm font-semibold text-white">
              {t('Wellbeing_module.common.Manager', 'Manager')}
            </Text>
          </View>
        </View>

        {/* Applies To */}
        <Text className="text-sm font-semibold mb-2 text-gray-800">
          {t('Wellbeing_module.common.AppliesTo', 'Applies To')} <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row flex-wrap border border-gray-300 rounded-lg px-4 py-3 mb-4">
          {(["college", "hostel", "both"] as const).map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setAppliesTo(option)}
              className="flex-row items-center mr-6 mb-2"
            >
              <View className="w-4 h-4 rounded-full border border-gray-400 items-center justify-center mr-2">
                {appliesTo === option && <View className="w-2.5 h-2.5 rounded-full bg-[#16284F]" />}
              </View>
              <Text className="text-sm text-gray-600 capitalize">
                {t(`Wellbeing_module.common.${option}`, option)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Priority */}
        <Text className="text-sm font-semibold mb-2 text-gray-800">
          {t('Wellbeing_module.common.Priority', 'Priority')} <Text className="text-red-500">*</Text>
        </Text>
        <View className="border border-gray-300 rounded-lg mb-4">
          <Picker selectedValue={priority} onValueChange={setPriority} style={Platform.OS === 'ios' ? { height: 120 } : {}}>
            <Picker.Item label="High" value="high" />
            <Picker.Item label="Medium" value="medium" />
            <Picker.Item label="Low" value="low" />
          </Picker>
        </View>

        {/* Category */}
        <Text className="text-sm font-semibold mb-2 text-gray-800">
          {t('Wellbeing_module.common.Category', 'Category')} <Text className="text-red-500">*</Text>
        </Text>
        <View className="border border-gray-300 rounded-lg mb-4">
          <Picker selectedValue={selectedCategory} onValueChange={(val) => { setSelectedCategory(val); setSelectedSubCategory(""); }} style={Platform.OS === 'ios' ? { height: 120 } : {}}>
            <Picker.Item label={t('Wellbeing_module.common.SelectCategory', 'Select Category')} value="" />
            {categories.map((c) => <Picker.Item key={c.categoryId} label={c.categoryName} value={c.categoryId.toString()} />)}
          </Picker>
        </View>

        {/* Subcategory */}
        <Text className="text-sm font-semibold mb-2 text-gray-800">
          {t('Wellbeing_module.common.Subcategory', 'Subcategory')} <Text className="text-red-500">*</Text>
        </Text>
        <View className="border border-gray-300 rounded-lg mb-4">
          <Picker selectedValue={selectedSubCategory} onValueChange={setSelectedSubCategory} style={Platform.OS === 'ios' ? { height: 120 } : {}}>
            <Picker.Item label={t('Wellbeing_module.common.SelectSubcategory', 'Select Subcategory')} value="" />
            {subCategoryOptions.map((c: any) => <Picker.Item key={c.subCategoryId} label={c.subCategoryName} value={c.subCategoryId.toString()} />)}
          </Picker>
        </View>

        {/* Description */}
        <Text className="text-sm font-semibold mb-2 text-gray-800">
          {t('Wellbeing_module.common.Description', 'Description')} <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t('Wellbeing_module.common.DescribeIssue', 'Describe your issue in detail...')}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4 bg-white text-sm h-32"
        />

        {/* Attachments */}
        <Text className="text-sm font-semibold mb-2 text-gray-800">
          {t('Wellbeing_module.common.Attachments', 'Attachments')}
        </Text>
        <TouchableOpacity onPress={handleFilePick} className="border border-dashed border-[#43C17A] bg-[#F3F3F3] rounded-xl p-6 items-center justify-center mb-2">
          <UploadSimple size={32} color="#8A8A8A" style={{ marginBottom: 8 }} />
          <Text className="text-sm text-gray-500 mb-2">{t('Wellbeing_module.common.TapToBrowse', 'Tap to browse files')}</Text>
          <View className="bg-[#43C17A] px-4 py-1.5 rounded text-white mt-1">
             <Text className="text-white font-semibold text-xs">{t('Wellbeing_module.common.BrowseFiles', 'Browse Files')}</Text>
          </View>
        </TouchableOpacity>

        {files.length > 0 && (
          <View className="mb-4 mt-2">
            {files.map((file, index) => (
              <View key={index} className="flex-row items-center justify-between bg-white border border-gray-200 p-3 rounded-lg mb-2 shadow-sm">
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="w-8 h-8 rounded bg-[#E9F5EE] items-center justify-center mr-3">
                    <UploadSimple size={16} weight="bold" color="#43C17A" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>{file.name}</Text>
                    <Text className="text-[10px] text-gray-500 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => removeFile(index)} className="p-2">
                  <X size={16} weight="bold" color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Notice Info */}
        <View className="flex-row items-center bg-[#0083E80D] border border-[#0090FF24] rounded-lg px-4 py-3 my-6">
          <View className="w-8 h-8 rounded bg-[#0090FF24] items-center justify-center mr-3">
            <Clock size={18} color="#0084E8" />
          </View>
          <Text className="flex-1 text-xs font-semibold text-[#0585D9] leading-5">
            {t('Wellbeing_module.common.ReviewNotice', 'Our team will review your complaint and respond within 24-48 hours.')}
          </Text>
        </View>

        {/* Submit Actions */}
        <View className="flex-row justify-center mt-2 mb-8">
          <TouchableOpacity
            onPress={handleCancel}
            disabled={submitting}
            className="border border-[#16284F] py-3.5 px-6 rounded-lg mr-3 flex-1 items-center"
          >
            <Text className="text-[#16284F] font-semibold text-base">{t('Wellbeing_module.common.Cancel', 'Cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className={`bg-[#16284F] py-3.5 px-6 rounded-lg flex-1 items-center ${submitting ? 'opacity-70' : ''}`}
          >
            <Text className="text-white font-semibold text-base">
              {submitting ? t('Wellbeing_module.common.Saving', 'Saving...') : (isEditing ? t('Wellbeing_module.common.SaveChanges', 'Save Changes') : t('Wellbeing_module.common.Submit', 'Submit'))}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}
