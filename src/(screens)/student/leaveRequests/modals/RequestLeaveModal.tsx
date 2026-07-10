import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { X, CaretDown, Paperclip, FilePdf } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { submitLeaveRequest, fetchStudentFaculties } from '@/lib/helpers/student/leaveRequests/studentLeaveAPI';
import { Avatar } from '@/components/Avatar';

interface RequestLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  onSuccess: () => void;
}

export default function RequestLeaveModal({
  isOpen,
  onClose,
  studentId,
  onSuccess
}: RequestLeaveModalProps) {
  const { t } = useTranslation();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [faculty, setFaculty] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showFacultyDropdown, setShowFacultyDropdown] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      setLoadingFaculties(true);
      fetchStudentFaculties(studentId)
        .then(setFaculties)
        .finally(() => setLoadingFaculties(false));
    }
  }, [isOpen, studentId]);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets;
        
        const containsApk = newFiles.some(file =>
          file.name.toLowerCase().endsWith(".apk") ||
          file.mimeType === "application/vnd.android.package-archive"
        );
  
        if (containsApk) {
          Toast.show({ type: 'error', text1: t('LeaveRequests.student.APK files are not allowed.', 'APK files are not allowed.') });
          return;
        }
  
        if (files.length + newFiles.length > 5) {
          Toast.show({ type: 'error', text1: t('LeaveRequests.student.You can only upload a maximum of 5 files.', 'You can only upload a maximum of 5 files.') });
          return;
        }

        setFiles(prev => [...prev, ...newFiles]);
      }
    } catch (err) {
      console.log('Document picker error:', err);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (!leaveType) {
      Toast.show({ type: 'error', text1: t('LeaveRequests.student.Select Leave Type', 'Select Leave Type') });
      return;
    }
    if (!startDate) {
      Toast.show({ type: 'error', text1: t('LeaveRequests.student.Start Date required', 'Start Date required') });
      return;
    }
    if (!endDate) {
      Toast.show({ type: 'error', text1: t('LeaveRequests.student.End Date required', 'End Date required') });
      return;
    }
    if (!faculty) {
      Toast.show({ type: 'error', text1: t('LeaveRequests.student.Please select a faculty', 'Please select a faculty') });
      return;
    }
    if (!description.trim()) {
      Toast.show({ type: 'error', text1: t('LeaveRequests.student.Description required', 'Description required') });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitLeaveRequest(studentId, {
        leaveType,
        startDate,
        endDate,
        description,
        faculty,
        files
      });
      Toast.show({ type: 'success', text1: t('LeaveRequests.student.Leave request submitted successfully!', 'Leave request submitted successfully!') });
      
      // Reset form
      setLeaveType('');
      setStartDate('');
      setEndDate('');
      setDescription('');
      setFaculty(null);
      setFiles([]);
      
      onSuccess();
    } catch (error) {
      Toast.show({ type: 'error', text1: t('LeaveRequests.student.Failed to submit request Please try again', 'Failed to submit request. Please try again.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartDateChange = (text: string) => {
    setStartDate(text);
    if (endDate && endDate < text) {
      setEndDate('');
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-center items-center bg-black/40 px-4 py-10">
        
        <View className="bg-white w-full rounded-2xl shadow-xl overflow-hidden max-w-[500px] max-h-full">
          <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
            <Text className="text-lg font-bold text-[#282828]">{t("LeaveRequests.student.requestLeave", "Request Leave")}</Text>
            <TouchableOpacity onPress={onClose} disabled={isSubmitting} className="p-1">
              <X size={20} color="#9CA3AF" weight="bold" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-5" contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false}>
            {/* Leave Type */}
            <View className="gap-1.5 z-50">
              <Text className="text-sm font-semibold text-[#282828]">{t("LeaveRequests.student.leaveType", "Leave Type")} <Text className="text-red-500">*</Text></Text>
              <TouchableOpacity onPress={() => setShowTypeDropdown(!showTypeDropdown)} className="w-full border border-gray-200 rounded-lg px-3 py-3 flex-row justify-between items-center bg-white">
                <Text className={`text-sm ${leaveType ? 'text-[#282828]' : 'text-gray-400'}`}>
                  {leaveType === 'leave' ? t("LeaveRequests.student.Leave", "Leave") : leaveType === 'attendanceregularization' ? t("LeaveRequests.student.attendanceRegularization", "Attendance Regularization") : t("LeaveRequests.student.selectLeaveType", "Select Leave Type")}
                </Text>
                <CaretDown size={16} color="#9CA3AF" />
              </TouchableOpacity>
              
              {showTypeDropdown && (
                <View className="absolute top-[65px] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-sm z-50 overflow-hidden">
                  <TouchableOpacity onPress={() => { setLeaveType('leave'); setShowTypeDropdown(false); }} className={`px-4 py-3 border-b border-gray-100 ${leaveType === 'leave' ? 'bg-[#E7F8EE]' : 'bg-white'}`}>
                    <Text className={`text-sm ${leaveType === 'leave' ? 'text-[#43C17A] font-bold' : 'text-[#282828]'}`}>{t("LeaveRequests.student.Leave", "Leave")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setLeaveType('attendanceregularization'); setShowTypeDropdown(false); }} className={`px-4 py-3 bg-white ${leaveType === 'attendanceregularization' ? 'bg-[#E7F8EE]' : 'bg-white'}`}>
                    <Text className={`text-sm ${leaveType === 'attendanceregularization' ? 'text-[#43C17A] font-bold' : 'text-[#282828]'}`}>{t("LeaveRequests.student.attendanceRegularization", "Attendance Regularization")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Dates */}
            <View className="flex-row gap-4 z-40">
              <View className="flex-1 gap-1.5">
                <Text className="text-sm font-semibold text-[#282828]">{t("LeaveRequests.student.startDate", "Start Date")} <Text className="text-red-500">*</Text></Text>
                <TextInput 
                  value={startDate} 
                  onChangeText={handleStartDateChange} 
                  placeholder="YYYY-MM-DD" 
                  placeholderTextColor="#9CA3AF" 
                  className="border border-gray-200 rounded-lg px-3 py-3 text-sm text-[#282828]" 
                />
              </View>
              <View className="flex-1 gap-1.5">
                <Text className="text-sm font-semibold text-[#282828]">{t("LeaveRequests.student.endDate", "End Date")} <Text className="text-red-500">*</Text></Text>
                <TextInput 
                  value={endDate} 
                  onChangeText={setEndDate} 
                  placeholder="YYYY-MM-DD" 
                  placeholderTextColor="#9CA3AF" 
                  editable={!!startDate}
                  className={`border border-gray-200 rounded-lg px-3 py-3 text-sm text-[#282828] ${!startDate ? 'bg-gray-100 text-gray-400' : ''}`} 
                />
              </View>
            </View>

            {/* Faculties */}
            <View className="gap-1.5 z-30">
              <Text className="text-sm font-semibold text-[#282828]">{t("LeaveRequests.student.Faculties", "Faculties")} <Text className="text-red-500">*</Text></Text>
              <TouchableOpacity 
                onPress={() => { if (!loadingFaculties && faculties.length > 0) setShowFacultyDropdown(!showFacultyDropdown); }} 
                className={`w-full border border-gray-200 rounded-lg px-3 py-3 flex-row justify-between items-center ${loadingFaculties || faculties.length === 0 ? 'bg-gray-50' : 'bg-white'}`}
              >
                {loadingFaculties ? (
                  <Text className="text-sm text-gray-500">{t("LeaveRequests.student.loadingFaculties", "Loading faculties...")}</Text>
                ) : faculties.length === 0 ? (
                  <Text className="text-sm text-gray-500">{t("LeaveRequests.student.noFacultiesAssigned", "No faculties assigned")}</Text>
                ) : faculty ? (
                  <View className="flex-row items-center gap-2 flex-1 mr-2">
                    <Avatar src={faculty.avatar} size={24} />
                    <Text className="text-sm font-medium text-[#282828] flex-1" numberOfLines={1}>
                      {faculty.name} • <Text className="text-gray-500 font-normal">{faculty.subject}</Text>
                    </Text>
                  </View>
                ) : (
                  <Text className="text-sm text-gray-400">{t("LeaveRequests.student.selectFaculties", "Select Faculties")}</Text>
                )}
                <CaretDown size={16} color="#9CA3AF" />
              </TouchableOpacity>
              
              {showFacultyDropdown && (
                <View className="absolute top-[65px] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-sm z-50 max-h-48 overflow-hidden">
                  <ScrollView nestedScrollEnabled className="w-full">
                    {faculties.map(fac => (
                      <TouchableOpacity 
                        key={`${fac.id}-${fac.subjectId}`} 
                        onPress={() => { setFaculty(fac); setShowFacultyDropdown(false); }} 
                        className={`flex-row items-center px-3 py-2.5 border-b border-gray-100 ${faculty?.id === fac.id && faculty?.subjectId === fac.subjectId ? 'bg-gray-50' : 'bg-white'}`}
                      >
                        <Avatar src={fac.avatar} size={32} />
                        <View className="ml-3 flex-1">
                          <Text className="text-sm font-bold text-[#282828]" numberOfLines={1}>{fac.name}</Text>
                          <Text className="text-xs text-gray-500" numberOfLines={1}>{fac.subject}</Text>
                        </View>
                        {faculty?.id === fac.id && faculty?.subjectId === fac.subjectId && (
                          <Text className="text-[#43C17A] text-[10px] font-bold">✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Description */}
            <View className="gap-1.5 z-10">
              <Text className="text-sm font-semibold text-[#282828]">{t("LeaveRequests.student.Description", "Description")} <Text className="text-red-500">*</Text></Text>
              <TextInput 
                value={description} 
                onChangeText={setDescription} 
                placeholder={t("LeaveRequests.student.provideExplanationPlaceholder", "Provide a short explanation for your leave request..........")} 
                placeholderTextColor="#9CA3AF" 
                multiline 
                numberOfLines={4} 
                textAlignVertical="top" 
                className="border border-gray-200 rounded-lg px-3 py-3 text-sm text-[#282828] min-h-[80px]" 
              />
            </View>

            {/* Attachments */}
            <View className="gap-1.5">
              <View className="flex-row justify-between items-end">
                <Text className="text-sm font-semibold text-[#282828]">{t("LeaveRequests.student.Attachments", "Attachments")}</Text>
                <Text className="text-xs text-gray-400">{t("LeaveRequests.student.optionalMax5", "Optional (Max 5)")}</Text>
              </View>
              
              <TouchableOpacity onPress={handlePickFile} className="border-2 border-dashed border-gray-300 rounded-lg p-4 items-center justify-center bg-gray-50">
                <Text className="text-sm font-medium text-gray-600">{t("LeaveRequests.student.clickToUpload", "Click to upload files")}</Text>
              </TouchableOpacity>

              {files.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2 flex-row gap-3">
                  {files.map((file, idx) => {
                    const isImage = file.mimeType?.startsWith('image/');
                    return (
                      <View key={idx} className="relative w-16 h-16 mr-3 border border-gray-200 rounded-lg bg-white shadow-sm justify-center items-center overflow-hidden">
                        {isImage ? (
                          <Image source={{ uri: file.uri }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                          <View className="items-center justify-center p-1">
                            <FilePdf size={20} color="#9CA3AF" weight="fill" />
                            <Text className="text-[8px] text-gray-500 mt-1 text-center" numberOfLines={1}>{file.name}</Text>
                          </View>
                        )}
                        <TouchableOpacity 
                          onPress={() => removeFile(idx)}
                          className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow border border-gray-100"
                        >
                          <X size={10} color="#EF4444" weight="bold" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>

          </ScrollView>

          <View className="p-4 border-t border-gray-100 flex-row gap-3 bg-white">
            <TouchableOpacity onPress={onClose} disabled={isSubmitting} className="flex-1 py-3 bg-gray-100 rounded-lg items-center justify-center">
              <Text className="text-[#525252] font-bold text-sm">{t("LeaveRequests.student.Cancel", "Cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 bg-[#43C17A] rounded-lg items-center justify-center">
              <Text className="text-white font-bold text-sm">{isSubmitting ? t("LeaveRequests.student.Submitting", "Submitting...") : t("LeaveRequests.student.submitRequest", "Submit Request")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
